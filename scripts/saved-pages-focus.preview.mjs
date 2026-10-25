// Run against an authenticated immutable Git Preview, never a local server:
// node scripts/saved-pages-focus.preview.mjs /private/path/preview-access.json
// Config: { origin, shareUrl, commit }. The file must have mode 0600.
import assert from "node:assert/strict";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { chromium, expect as baseExpect } from "@playwright/test";

let config;
let origin;
try {
  const file = process.argv[2];
  const stat = lstatSync(file);
  assert.ok(stat.isFile() && stat.size <= 16_384);
  assert.equal(stat.mode & 0o777, 0o600);
  config = JSON.parse(readFileSync(file, "utf8"));
  const address = new URL(config.origin);
  const access = new URL(config.shareUrl);
  origin = address.origin;
  assert.equal(config.origin, origin);
  assert.equal(address.protocol, "https:");
  assert.equal(address.port, "");
  assert.equal(address.username + address.password, "");
  assert.match(address.hostname, /^[a-z0-9-]+-[a-z0-9]{9}-[a-z0-9-]+\.vercel\.app$/);
  assert.ok(!address.hostname.includes("-git-"));
  assert.equal(access.origin, origin);
  assert.equal(access.username + access.password, "");
  assert.ok(access.searchParams.has("_vercel_share"));
  assert.match(config.commit, /^[a-f0-9]{40}$/);
} catch {
  throw new Error("Expected a private mode-0600 JSON config for one immutable HTTPS Vercel Preview, with same-origin shareUrl and full commit SHA.");
}

const expect = baseExpect.configure({ timeout: 10_000 });
const readings = ["/topics/faith", "/concepts/wisdom", "/proverbs/words-and-speech"];
const repetitions = 6;
const report = {
  commit: config.commit, origin, startedAt: new Date().toISOString(), result: "running",
  cases: [], pageErrors: [], apiMutationAttempts: [], permissionRequests: 0, pushSubscribeAttempts: 0,
  limits: ["Chromium synthetic isolated contexts only; no physical-device or screen-reader proof.", "Focus regression coverage, not complete feature or two-deployment PWA certification."],
};
const privateValues = [config.shareUrl, ...new URL(config.shareUrl).searchParams.values()];
function safeMessage(error) {
  let value = String(error?.message ?? error);
  for (const secret of privateValues) {
    if (secret) value = value.split(secret).join("[private access]").split(encodeURIComponent(secret)).join("[private access]");
  }
  return value.replace(/([?&](?:_vercel_share|token|bypass)=)[^&\s)]+/gi, "$1[redacted]")
    .replace(/(https?:\/\/)[^/\s@]+@/gi, "$1[redacted]@");
}

async function createContext(browser, width, theme, name) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
  context.setDefaultTimeout(10_000);
  context.setDefaultNavigationTimeout(30_000);
  try {
    let access;
    try { access = await context.request.get(config.shareUrl); }
    catch { throw new Error("Preview authentication request failed."); }
    assert.ok(access.ok() && new URL(access.url()).origin === origin, "Exact Preview authentication must succeed.");
    const response = await context.request.get(`${origin}/health`, { headers: { "Cache-Control": "no-cache" } });
    assert.equal(response.status(), 200);
    const health = await response.json();
    assert.equal(health.surface, "preview", "This regression must never run on Production.");
    assert.equal(health.commit, config.commit, "Preview must serve the exact intended revision.");
    await context.route(`${origin}/api/**`, async (route) => {
      const request = route.request();
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
        report.apiMutationAttempts.push({ name, method: request.method(), path: new URL(request.url()).pathname });
        await route.abort("blockedbyclient");
      } else await route.continue();
    });
    context.on("page", (page) => page.on("pageerror", (error) => report.pageErrors.push({ name, error: safeMessage(error) })));
    await context.exposeFunction("__savedFocusPermissionAttempt", () => { report.permissionRequests++; });
    await context.exposeFunction("__savedFocusPushAttempt", () => { report.pushSubscribeAttempts++; });
    await context.addInitScript(({ origin, theme }) => {
      if (location.origin !== origin) return;
      localStorage.setItem("bible-compass-theme", theme);
      sessionStorage.setItem("bible-compass-splash-seen", "1");
      if ("Notification" in window) Notification.requestPermission = async () => {
        await window.__savedFocusPermissionAttempt();
        return "denied";
      };
      if ("PushManager" in window) PushManager.prototype.subscribe = async () => {
        await window.__savedFocusPushAttempt();
        throw new DOMException("Focus regression blocks push subscription", "NotAllowedError");
      };
    }, { origin, theme });
    return context;
  } catch (error) { await context.close(); throw error; }
}

const rowLink = (page, path) => page.locator(`a[data-reading][href="${path}"]`);
const remove = (page, path) => rowLink(page, path).locator("..").getByRole("button", { name: /^Remove / });
const undo = (page) => page.getByRole("button", { name: "Undo removal", exact: true });
const emptyHeading = (page) => page.getByRole("heading", { name: "No saved pages yet.", exact: true });
async function navigate(page, path) {
  const response = await page.goto(origin + path, { waitUntil: "domcontentloaded" });
  assert.equal(response.status(), 200);
  assert.equal(new URL(page.url()).pathname, path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}
async function settleFocus(page) {
  // Let competing React effects and focus callbacks finish; no timed sleep.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function activeControl(page) {
  return page.evaluate(() => ({ tag: document.activeElement?.tagName, label: document.activeElement?.getAttribute("aria-label"), text: document.activeElement?.textContent?.trim().slice(0, 100) }));
}
async function expectPaths(page, paths) {
  await expect.poll(() => page.locator("a[data-reading]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")))).toEqual(paths);
}
async function save(page, path) {
  await navigate(page, path);
  const toggle = page.locator("button[aria-pressed]");
  await expect(toggle).toHaveCount(1);
  await expect(toggle).toBeEnabled();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toBeEnabled();
}
async function externalRemove(page, path) {
  const control = remove(page, path);
  await expect(control).toBeEnabled();
  // DOM activation in the other tab preserves the foreground observer's focus.
  await control.evaluate((node) => node.click());
  await expect(rowLink(page, path)).toHaveCount(0);
  await expect(undo(page)).toBeEnabled();
}
async function externalUndo(page) {
  await expect(undo(page)).toBeEnabled();
  await undo(page).evaluate((node) => node.click());
}

async function routeFocus({ page, details }) {
  await save(page, readings[0]);
  const opener = page.getByRole("button", { name: "Open profile", exact: true });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const entry = dialog.getByRole("link", { name: /Saved pages/ });
  await entry.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/saved(?:#.*)?$`));
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Saved pages", level: 1, exact: true })).toBeVisible();
  await settleFocus(page);
  details.focusAfterNavigation = await activeControl(page);
  await expect.poll(() => page.evaluate(() => {
    const heading = document.querySelector("article h1");
    const active = document.activeElement;
    return active === heading || (active?.tagName === "MAIN" && active.contains(heading));
  }), { message: "Keyboard Profile navigation must focus the destination heading or main, not the Profile opener." }).toBe(true);
}

async function ownFinalRemoval({ page, details }) {
  await save(page, readings[0]);
  await navigate(page, "/saved");
  await expectPaths(page, [readings[0]]);
  details.completedCycles = 0;
  for (let cycle = 0; cycle < repetitions; cycle++) {
    await remove(page, readings[0]).focus();
    await page.keyboard.press("Space");
    await expect(emptyHeading(page)).toBeVisible();
    await expect(undo(page)).toBeEnabled();
    await settleFocus(page);
    details.focusAfterFinalRemoval = await activeControl(page);
    await expect(undo(page)).toBeFocused();
    // Operate the already-focused Undo; focusing it manually would hide a bug.
    await page.keyboard.press("Space");
    await expectPaths(page, [readings[0]]);
    await expect(undo(page)).toHaveCount(0);
    await settleFocus(page);
    await expect(rowLink(page, readings[0])).toBeFocused();
    details.completedCycles++;
  }
}

async function externalFocus({ context, page, details }) {
  for (const path of readings) await save(page, path);
  await navigate(page, "/saved");
  await expectPaths(page, [...readings].reverse());
  const other = await context.newPage();
  await navigate(other, "/saved");
  await expectPaths(other, [...readings].reverse());
  await page.bringToFront();
  await rowLink(page, readings[1]).focus();
  await externalRemove(other, readings[1]);
  await expectPaths(page, [readings[2], readings[0]]);
  await settleFocus(page);
  await expect(rowLink(page, readings[0])).toBeFocused();
  await externalUndo(other);
  await expectPaths(page, [...readings].reverse());
  await settleFocus(page);
  await expect(rowLink(page, readings[0])).toBeFocused();
  details.middleRemovalAndRestore = "adjacent row focused; restore retained it";

  const outside = page.locator("article summary");
  await outside.focus();
  for (const path of [readings[2], readings[1]]) await externalRemove(other, path);
  await expectPaths(page, [readings[0]]);
  await settleFocus(page);
  await expect(outside).toBeFocused();
  await rowLink(page, readings[0]).focus();
  await externalRemove(other, readings[0]);
  await expect(emptyHeading(page)).toBeVisible();
  await settleFocus(page);
  await expect(emptyHeading(page)).toBeFocused();
  details.lastExternalRemoval = "empty heading focused";
  await outside.focus();
  await externalUndo(other);
  await expectPaths(page, [readings[0]]);
  await settleFocus(page);
  await expect(outside).toBeFocused();
  details.restoreWhileElsewhere = "did not steal focus";
}

async function runCase(browser, width, theme, name, scenario) {
  const result = { name, width, theme, result: "running", details: {} };
  let context;
  let page;
  try {
    context = await createContext(browser, width, theme, name);
    page = await context.newPage();
    await scenario({ context, page, details: result.details });
    result.result = "passed";
  } catch (error) {
    result.result = "failed";
    result.error = safeMessage(error);
    if (page && !page.isClosed()) result.activeControl = await activeControl(page).catch(() => null);
  } finally { await context?.close(); }
  report.cases.push(result);
  console.log(JSON.stringify(result));
}

let browser;
try {
  const executablePath = process.env.SAVED_PAGES_CHROMIUM_EXECUTABLE || (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  browser = await chromium.launch({ headless: true, chromiumSandbox: false, ...(executablePath ? { executablePath } : {}), ...(proxy ? { proxy: { server: proxy } } : {}) });
  for (const [width, theme] of [[390, "light"], [320, "dark"]]) {
    await runCase(browser, width, theme, "keyboard Profile route focus", routeFocus);
    await runCase(browser, width, theme, "repeated own final removal and Undo focus", ownFinalRemoval);
    await runCase(browser, width, theme, "external removal and restoration focus", externalFocus);
  }
  assert.deepEqual(report.pageErrors, []);
  assert.deepEqual(report.apiMutationAttempts, []);
  assert.equal(report.permissionRequests, 0);
  assert.equal(report.pushSubscribeAttempts, 0);
  report.result = report.cases.every((item) => item.result === "passed") ? "passed" : "failed";
} catch (error) {
  report.result = "failed";
  report.error = browser ? safeMessage(error) : "Browser could not launch with the configured runtime; no Preview assertion ran.";
} finally {
  await browser?.close();
  report.completedAt = new Date().toISOString();
  console.log(JSON.stringify({ report }));
  if (report.result !== "passed") process.exitCode = 1;
}
