import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { parseSchedule, parseSubscription, sameOrigin, secretEquals } from "../src/lib/notifications/validation";
import { POST, DELETE } from "../src/app/api/notifications/subscriptions/route";
import { GET as cron } from "../src/app/api/cron/daily-verse/route";
import { generateKeyPair, SignJWT } from "jose";
import { githubSchedulerAuthorized, SCHEDULER_AUDIENCE } from "../src/lib/notifications/scheduler-auth";
import { parseVerseDate } from "../src/lib/verse-of-the-day";

const input = {
  endpoint: "https://fcm.googleapis.com/fcm/send/test",
  keys: { p256dh: Buffer.alloc(65, 4).toString("base64url"), auth: Buffer.alloc(16).toString("base64url") },
  token: Buffer.alloc(32).toString("base64url"),
  reminderTime: "08:00", timeZone: "UTC",
};

test("subscriptions allow real push hosts and reject SSRF and malformed keys", () => {
  assert.deepEqual(parseSubscription(input), input);
  for (const endpoint of ["http://fcm.googleapis.com/test", "https://127.0.0.1/test", "https://fcm.googleapis.com.evil.test/test", "https://fcm.googleapis.com:8443/test", "https://user:password@fcm.googleapis.com/test"]) {
    assert.throws(() => parseSubscription({ ...input, endpoint }));
  }
  assert.throws(() => parseSubscription({ ...input, keys: { ...input.keys, auth: "wrong" } }));
  assert.throws(() => parseSubscription({ ...input, token: "guessable" }));
});

test("reminder schedules accept local times and IANA zones, rejecting invalid inputs", () => {
  assert.deepEqual(parseSchedule({ reminderTime: "19:45", timeZone: "Europe/London" }), { reminderTime: "19:45", timeZone: "Europe/London" });
  assert.deepEqual(parseSchedule({}), { reminderTime: "08:00", timeZone: "UTC" });
  for (const reminderTime of ["24:00", "08:60", "8:00", "", "08:00:00"]) assert.throws(() => parseSchedule({ reminderTime }));
  for (const timeZone of ["Fake/City", "+01:00", "", "Europe/London; DROP TABLE x"]) assert.throws(() => parseSchedule({ timeZone }));
});

test("home notification dates accept real calendar dates and reject malformed values", () => {
  assert.equal(parseVerseDate("2026-10-16")?.toISOString(), "2026-10-16T00:00:00.000Z");
  for (const value of ["2026-02-30", "2026-13-01", "//evil.test", "", null, ["2026-10-16"]]) assert.equal(parseVerseDate(value), null);
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

test("scheduler identity requires the exact main-branch workflow, audience and repository", async () => {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const claims = {
    repository: "devcamos/bible-compass", repository_id: "1335846005", ref: "refs/heads/main",
    workflow_ref: "devcamos/bible-compass/.github/workflows/daily-verse.yml@refs/heads/main", event_name: "schedule",
  };
  const sign = (changes = {}, audience = SCHEDULER_AUDIENCE, expiration = "5m") => new SignJWT({ ...claims, ...changes })
    .setProtectedHeader({ alg: "RS256" }).setIssuer("https://token.actions.githubusercontent.com")
    .setAudience(audience).setSubject("repo:devcamos/bible-compass:ref:refs/heads/main")
    .setIssuedAt().setExpirationTime(expiration).sign(privateKey);
  const resolver = async () => publicKey;
  assert.equal(await githubSchedulerAuthorized(await sign(), resolver), true);
  for (const changes of [{ ref: "refs/heads/feature" }, { repository_id: "other" }, { workflow_ref: "devcamos/bible-compass/.github/workflows/other.yml@refs/heads/main" }, { event_name: "pull_request" }]) {
    assert.equal(await githubSchedulerAuthorized(await sign(changes), resolver), false);
  }
  assert.equal(await githubSchedulerAuthorized(await sign({}, "other-app"), resolver), false);
  assert.equal(await githubSchedulerAuthorized(await sign({}, SCHEDULER_AUDIENCE, "-2m"), resolver), false);
  assert.equal(await githubSchedulerAuthorized("not-a-token", resolver), false);
});

test("service worker shows dated verse, handles malformed push, and never opens an external URL", async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  const shown: { title: string; options: { tag: string; data: { date: string } } }[] = [];
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
  assert.equal(shown[0].title, "Your daily verse");
  assert.equal(shown[0].options.tag, "bible-compass-verse-2026-10-16");
  assert.equal(shown[0].options.data.date, "2026-10-16");
  handlers.push({ data: { json: () => { throw new Error("invalid json"); } }, waitUntil });
  await work;
  assert.equal(shown.length, 2);
  const testIds = ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"];
  for (const testId of testIds) {
    handlers.push({ data: { json: () => ({ date: "2026-10-16", testId }) }, waitUntil });
    await work;
  }
  assert.equal(shown[2].options.tag, `bible-compass-test-${testIds[0]}`);
  assert.notEqual(shown[2].options.tag, shown[3].options.tag, "test retries must not silently replace previous tests");
  handlers.notificationclick({ notification: { close() {}, data: { url: "https://evil.test/steal" } }, waitUntil });
  await work;
  assert.equal(opened[0], "https://compass.test/#verse-of-the-day-heading");
  handlers.notificationclick({ notification: { close() {}, data: { date: "2026-10-16" } }, waitUntil });
  await work;
  assert.equal(opened[1], "https://compass.test/?verse=2026-10-16#verse-of-the-day-heading");
  assert.equal(handlers.fetch, undefined, "reader traffic must not be intercepted or cached");
});

test("test pushes require ownership, enforce limits, and send only the stored verse", async () => {
  const { sendTestNotification } = await import("../src/lib/notifications/test-notification");
  type Dependencies = NonNullable<Parameters<typeof sendTestNotification>[1]>;
  let owned = true;
  let count = 1;
  let sends = 0;
  let expired = false;
  let removed = false;
  const dependencies = {
    notificationsReady: () => true,
    database: () => ({ query: async (sql: string, params: unknown[]) => {
      if (sql.startsWith("SELECT")) {
        assert.equal(params[1], (await import("../src/lib/notifications/validation")).hash(input.token));
        return { rowCount: owned ? 1 : 0, rows: owned ? [{ endpoint: input.endpoint, ...input.keys, day: "2026-10-17" }] : [] };
      }
      if (sql.startsWith("DELETE")) { removed = true; return {}; }
      return { rows: [{ count }] };
    } }),
    pushClient: () => ({ sendNotification: async (subscription: { endpoint: string }, payload: string, options: { TTL: number }) => {
      sends++;
      assert.equal(subscription.endpoint, input.endpoint);
      assert.equal(JSON.parse(payload).date, "2026-10-17");
      assert.match(JSON.parse(payload).testId, /^[a-f0-9-]{36}$/);
      assert.match(JSON.parse(payload).body, /^“[\s\S]+”\n.+ · .+$/);
      assert.equal(options.TTL, 60);
      if (expired) throw { statusCode: 410 };
    } }),
  } as unknown as Dependencies;
  const request = (body: unknown = { id: "a".repeat(64), token: input.token }, origin = "https://compass.test") => new Request("https://compass.test/api/notifications/test", {
    method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body),
  });
  assert.equal((await sendTestNotification(request({}, "https://evil.test"), dependencies)).status, 403);
  assert.equal((await sendTestNotification(request({ token: "bad" }), dependencies)).status, 400);
  assert.equal((await sendTestNotification(request({ id: "a".repeat(64), token: input.token, ignored: "x".repeat(5000) }), dependencies)).status, 400);
  owned = false;
  assert.equal((await sendTestNotification(request(), dependencies)).status, 404);
  assert.equal(sends, 0);
  owned = true; count = 4;
  assert.equal((await sendTestNotification(request(), dependencies)).status, 429);
  assert.equal(sends, 0);
  count = 1;
  assert.equal((await sendTestNotification(request(), dependencies)).status, 200);
  assert.equal(sends, 1);
  expired = true;
  assert.equal((await sendTestNotification(request(), dependencies)).status, 410);
  assert.equal(removed, true);
});
