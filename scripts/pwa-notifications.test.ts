import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { parseSubscription, sameOrigin, secretEquals } from "../src/lib/notifications/validation";
import { POST, DELETE } from "../src/app/api/notifications/subscriptions/route";
import { GET as cron } from "../src/app/api/cron/daily-verse/route";

const input = {
  endpoint: "https://fcm.googleapis.com/fcm/send/test",
  keys: { p256dh: Buffer.alloc(65, 4).toString("base64url"), auth: Buffer.alloc(16).toString("base64url") },
  token: Buffer.alloc(32).toString("base64url"),
};

test("subscriptions allow real push hosts and reject SSRF and malformed keys", () => {
  assert.deepEqual(parseSubscription(input), input);
  for (const endpoint of ["http://fcm.googleapis.com/test", "https://127.0.0.1/test", "https://fcm.googleapis.com.evil.test/test", "https://fcm.googleapis.com:8443/test", "https://user:password@fcm.googleapis.com/test"]) {
    assert.throws(() => parseSubscription({ ...input, endpoint }));
  }
  assert.throws(() => parseSubscription({ ...input, keys: { ...input.keys, auth: "wrong" } }));
  assert.throws(() => parseSubscription({ ...input, token: "guessable" }));
});

test("subscription mutations require same-origin and cron fails closed without a secret", async () => {
  const crossOrigin = new Request("https://compass.test/api/notifications/subscriptions", { method: "POST", headers: { origin: "https://other.test" } });
  assert.equal(sameOrigin(crossOrigin), false);
  assert.equal((await POST(crossOrigin)).status, 403);
  assert.equal((await DELETE(crossOrigin)).status, 403);
  assert.equal((await cron(new Request("https://compass.test/api/cron/daily-verse"))).status, 401);
  assert.equal(secretEquals("test", "test"), true);
  assert.equal(secretEquals("test", "different length"), false);
});

test("service worker shows dated verse, handles malformed push, and never opens an external URL", async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  const shown: { title: string; options: { tag: string; data: { url: string } } }[] = [];
  const opened: string[] = [];
  vm.runInNewContext(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), {
    URL,
    self: {
      location: { origin: "https://compass.test" },
      addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; },
      registration: { showNotification: async (title: string, options: typeof shown[number]["options"]) => { shown.push({ title, options }); } },
      clients: { matchAll: async () => [], openWindow: async (url: string) => { opened.push(url); } },
    },
  });
  let work: Promise<unknown> = Promise.resolve();
  const waitUntil = (promise: Promise<unknown>) => { work = promise; };
  handlers.push({ data: { json: () => ({ date: "2026-10-16", body: "John 3:16", url: "https://evil.test" }) }, waitUntil });
  await work;
  assert.equal(shown[0].options.tag, "bible-compass-verse-2026-10-16");
  assert.equal(shown[0].options.data.url, "/verse-of-the-day?date=2026-10-16");
  handlers.push({ data: { json: () => { throw new Error("invalid json"); } }, waitUntil });
  await work;
  assert.equal(shown.length, 2);
  handlers.notificationclick({ notification: { close() {}, data: { url: "https://evil.test/steal" } }, waitUntil });
  await work;
  assert.equal(opened[0], "https://compass.test/verse-of-the-day");
  assert.equal(handlers.fetch, undefined, "reader traffic must not be intercepted or cached");
});
