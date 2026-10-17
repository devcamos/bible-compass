import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const origin = new URL(process.env.PREVIEW_URL).origin;
const artifactDirectory = await mkdtemp(join(tmpdir(), "bible-compass-preview-"));
if (!origin.startsWith("https://") || !new URL(origin).hostname.endsWith(".vercel.app")) throw new Error("Use a Vercel Preview URL");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, chromiumSandbox: true, ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}) });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.grantPermissions(["notifications"], { origin });
  await context.addInitScript(() => {
    window.__bibleCompassPermissionRequests = 0;
    const request = Notification.requestPermission.bind(Notification);
    Notification.requestPermission = (...args) => { window.__bibleCompassPermissionRequests++; return request(...args); };
  });
  // Attach credentials only to requests to the exact deployment under test.
  if (process.env.PREVIEW_BYPASS) {
    const headers = { "x-vercel-protection-bypass": process.env.PREVIEW_BYPASS, "x-vercel-set-bypass-cookie": "true" };
    const authenticated = await context.request.get(origin, { headers });
    if (!authenticated.ok()) throw new Error("Preview authentication failed");
    // The session cookie also authenticates worker-script requests, which are
    // outside Playwright's route interception. Keep headers scoped to this host.
    await context.route(`${origin}/**`, (route) => route.continue({ headers: { ...route.request().headers(), ...headers } }));
  }
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open profile" }).click();
  await page.getByRole("heading", { name: "Daily verse reminder" }).waitFor();
  await page.getByRole("switch", { name: "Daily verse reminder", exact: true }).waitFor({ state: "attached" });
  assert.equal(await page.evaluate(() => window.__bibleCompassPermissionRequests), 0, "page load must not ask permission");
  const worker = await page.evaluate(async () => {
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Service worker did not activate")), 15_000)),
    ]);
    return { scope: registration.scope, active: Boolean(registration.active) };
  });
  assert.equal(worker.scope, `${origin}/`);
  assert.equal(worker.active, true);
  assert.equal(await page.getByLabel("Remind me at").count(), 0, "timing stays hidden while reminders are off");
  const api = await page.evaluate(async () => {
    const manifest = await (await fetch("/manifest.webmanifest")).json();
    if (manifest.display !== "standalone" || !manifest.icons.some((icon) => icon.purpose === "maskable")) throw new Error("Manifest missing installation metadata");
    const keys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    const encode = (bytes) => btoa(String.fromCodePoint(...bytes)).replaceAll("+", "-").replaceAll("/", "_").split("=")[0];
    const input = { endpoint: `https://fcm.googleapis.com/fcm/send/bible-compass-preview-test-${crypto.randomUUID()}`, token: encode(crypto.getRandomValues(new Uint8Array(32))), keys: { p256dh: encode(new Uint8Array(await crypto.subtle.exportKey("raw", keys.publicKey))), auth: encode(crypto.getRandomValues(new Uint8Array(16))) }, reminderTime: "19:45", timeZone: "Europe/London" };
    const mutate = (method, body) => fetch("/api/notifications/subscriptions", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const created = await mutate("POST", input);
    if (created.status !== 200) throw new Error(`Subscription create failed: ${created.status}`);
    try {
      const id = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input.endpoint))), (b) => b.toString(16).padStart(2, "0")).join("");
      const stored = await (await fetch(`/api/notifications/subscriptions?id=${id}`, { headers: { Authorization: `Bearer ${input.token}` } })).json();
      if (stored.reminderTime !== "19:45" || stored.timeZone !== "Europe/London") throw new Error("Schedule was not persisted");
      const changed = await mutate("POST", { ...input, reminderTime: "06:30", timeZone: "Asia/Kathmandu" });
      if (changed.status !== 200) throw new Error("Schedule update failed");
      const restored = await (await fetch(`/api/notifications/subscriptions?id=${id}`, { headers: { Authorization: `Bearer ${input.token}` } })).json();
      if (restored.reminderTime !== "06:30" || restored.timeZone !== "Asia/Kathmandu") throw new Error("Schedule update was not persisted");
      const conflict = await mutate("POST", { ...input, token: encode(crypto.getRandomValues(new Uint8Array(32))) });
      if (conflict.status !== 409) throw new Error("Device ownership was not enforced");
      const invalid = await mutate("POST", { ...input, endpoint: "https://127.0.0.1/private" });
      if (invalid.status !== 400) throw new Error("Unsafe endpoint accepted");
      const rejectedTest = await fetch("/api/notifications/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, token: encode(crypto.getRandomValues(new Uint8Array(32))) }) });
      if (rejectedTest.status !== 404) throw new Error("Test notification device ownership was not enforced");
      const unauthenticatedCron = await fetch("/api/cron/daily-verse");
      if (unauthenticatedCron.status !== 401) throw new Error("Unauthenticated cron accepted");
      return { subscriptions: true, schedulePersistence: true, ownership: true, endpointValidation: true, cronAuthentication: true, manifest: true };
    } finally {
      const removed = await mutate("DELETE", input);
      if (removed.status !== 200) throw new Error("Subscription cleanup failed");
    }
  });
  // Simulate only the device push service; UI requests still use the real Preview API/database.
  // Real OS delivery remains a separate iOS/Android release check.
  await context.grantPermissions(["notifications"], { origin });
  await page.evaluate(async () => {
    const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    const encode = (bytes) => btoa(String.fromCodePoint(...bytes)).replaceAll("+", "-").replaceAll("/", "_").split("=")[0];
    const data = { endpoint: `https://fcm.googleapis.com/fcm/send/bible-compass-preview-ui-${crypto.randomUUID()}`, keys: { p256dh: encode(new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey))), auth: encode(crypto.getRandomValues(new Uint8Array(16))) } };
    let current = null;
    const simulated = { endpoint: data.endpoint, toJSON: () => data, unsubscribe: async () => { current = null; return true; } };
    PushManager.prototype.getSubscription = async () => current;
    PushManager.prototype.subscribe = async () => { current = simulated; return simulated; };
  });
  const reminder = page.getByRole("switch", { name: "Daily verse reminder", exact: true });
  await reminder.locator("..").click();
  try {
    await page.getByLabel("Remind me at").waitFor();
    await page.getByLabel("Remind me at").fill("20:15");
    await page.getByLabel("Timezone", { exact: true }).selectOption("Europe/London");
    await page.getByRole("button", { name: "Save time", exact: true }).click();
    await page.getByText("Time saved for testing. Scheduled reminders start after release.", { exact: true }).waitFor();
    await page.getByText("Enabled for testing", { exact: true }).waitFor();
    // Exercise button feedback without sending to the synthetic push endpoint.
    await page.route(`${origin}/api/notifications/test`, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
    await page.getByRole("button", { name: "Send test notification", exact: true }).click();
    await page.getByText(/Test sent to your push service/).waitFor();
    await page.unroute(`${origin}/api/notifications/test`);
    await page.getByRole("switch", { name: "Dark mode", exact: true }).press("Space");
    await page.screenshot({ path: join(artifactDirectory, "profile.png"), fullPage: true });
  } finally {
    if (await reminder.isChecked()) await reminder.locator("..").click();
    await page.getByText("Reminders are off. Your daily verse is always here when you need it.", { exact: true }).waitFor();
  }
  assert.equal(await page.getByLabel("Remind me at").count(), 0);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.goto(`${origin}/verse-of-the-day?date=2026-10-16`, { waitUntil: "networkidle" });
  await page.waitForURL(`${origin}/?verse=2026-10-16#verse-of-the-day-heading`);
  assert.equal(await page.getByRole("link", { name: "Daily verse & reminders", exact: true }).count(), 0);
  await page.locator(".bc-votd").getByRole("link", { name: "Explore further", exact: true }).click();
  await page.waitForURL(/\/topics\//);
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open profile" }).waitFor();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, ...api, serviceWorker: worker.active, profile: true, reminderSwitchAndTiming: true, devicePushServiceSimulated: true, datedVerse: true, readerNavigation: true, permissionPromptOnLoad: false, artifactDirectory }));
  await context.close();
} finally { await browser.close(); }
