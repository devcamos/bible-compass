import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const origin = new URL(process.env.PREVIEW_URL).origin;
if (!origin.startsWith("https://") || !new URL(origin).hostname.endsWith(".vercel.app")) throw new Error("Use a Vercel Preview URL");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ["--no-sandbox", ...(process.env.PROXY_CA_SPKI ? [`--ignore-certificate-errors-spki-list=${process.env.PROXY_CA_SPKI}`] : [])], ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}) });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  // Attach credentials only to requests to the exact deployment under test.
  if (process.env.PREVIEW_BYPASS) {
    await context.route(`${origin}/**`, (route) => route.continue({ headers: { ...route.request().headers(), "x-vercel-protection-bypass": process.env.PREVIEW_BYPASS } }));
  }
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open profile" }).click();
  await page.getByRole("heading", { name: "A daily moment" }).waitFor();
  await page.getByRole("button", { name: "Enable daily verse", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => Notification.permission), "default", "page load must not ask permission");
  const worker = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return { scope: registration.scope, active: Boolean(registration.active) };
  });
  assert.equal(worker.scope, `${origin}/`);
  assert.equal(worker.active, true);
  const api = await page.evaluate(async () => {
    const manifest = await (await fetch("/manifest.webmanifest")).json();
    if (manifest.display !== "standalone" || !manifest.icons.some((icon) => icon.purpose === "maskable")) throw new Error("Manifest missing installation metadata");
    const keys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    const encode = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
      const unauthenticatedCron = await fetch("/api/cron/daily-verse");
      if (unauthenticatedCron.status !== 401) throw new Error("Unauthenticated cron accepted");
      return { subscriptions: true, schedulePersistence: true, ownership: true, endpointValidation: true, cronAuthentication: true, manifest: true };
    } finally {
      const removed = await mutate("DELETE", input);
      if (removed.status !== 200) throw new Error("Subscription cleanup failed");
    }
  });
  await page.screenshot({ path: process.env.PREVIEW_SCREENSHOT || "/tmp/bible-compass-profile.png", fullPage: true });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.goto(`${origin}/verse-of-the-day?date=2026-10-16`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "A moment in Scripture" }).waitFor();
  await page.getByText("Daily reading · 2026-10-16", { exact: true }).waitFor();
  await page.getByRole("link", { name: "Back to the compass" }).click();
  await page.getByRole("button", { name: "Open profile" }).waitFor();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, ...api, serviceWorker: worker.active, profile: true, datedVerse: true, readerNavigation: true, permissionPromptOnLoad: false }));
  await context.close();
} finally { await browser.close(); }
