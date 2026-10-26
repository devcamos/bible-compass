import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
const pool = { query: vi.fn() };
const send = vi.fn();
vi.mock("pg", () => ({ Pool: vi.fn(function () { return pool; }) }));
vi.mock("@vercel/functions", () => ({ attachDatabasePool: vi.fn() }));
vi.mock("web-push", () => ({ default: { setVapidDetails: vi.fn(), sendNotification: (...a: unknown[]) => send(...a) } }));
import { database, notificationsReady } from "@/lib/notifications/db";
import { readBody } from "@/lib/notifications/request";
import { githubSchedulerAuthorized, SCHEDULER_AUDIENCE, schedulerAuthorized } from "@/lib/notifications/scheduler-auth";
import { parseSchedule, parseSubscription, sameOrigin, validToken } from "@/lib/notifications/validation";
import { sendTestNotification } from "@/lib/notifications/test-notification";
import * as dailyVerse from "@/app/api/cron/daily-verse/route";
import * as cronFeedback from "@/app/api/cron/feedback/route";
import * as config from "@/app/api/notifications/config/route";
import * as subs from "@/app/api/notifications/subscriptions/route";
import * as testRoute from "@/app/api/notifications/test/route";
import * as fbRoute from "@/app/api/feedback/route";
import * as ratingRoute from "@/app/api/ratings/route";
import * as summaryRoute from "@/app/api/ratings/summary/route";
import * as health from "@/app/health/route";
import * as conceptsData from "@/app/concepts/data/route";

const O = "https://app.test";
const tok = "a".repeat(43);
const p256dh = Buffer.alloc(65, 1).toString("base64url"), auth = Buffer.alloc(16, 2).toString("base64url");
const sub = { endpoint: "https://fcm.googleapis.com/x", keys: { p256dh, auth }, token: tok };
const req = (method: string, body?: unknown, headers: Record<string, string> = {}) => new Request(O + "/x", { method, body: body === undefined ? undefined : JSON.stringify(body), headers: { origin: O, "content-type": "application/json", ...headers } });
const ENV = { DATABASE_URL: "pg://x", VAPID_PUBLIC_KEY: "p", VAPID_PRIVATE_KEY: "k", VAPID_SUBJECT: "mailto:a@b.c", CRON_SECRET: "c".repeat(32) };
beforeEach(() => { Object.assign(process.env, ENV); pool.query.mockReset(); send.mockReset(); });
afterEach(() => { for (const k of [...Object.keys(ENV), "VERCEL_ENV", "FEEDBACK_DATABASE_URL", "FEEDBACK_NOTION_TOKEN", "FEEDBACK_NOTION_DATA_SOURCE_ID", "FEEDBACK_WORKER_SECRET"]) delete process.env[k]; vi.restoreAllMocks(); });

describe("notification libs", () => {
  it("db and readiness", () => { expect(notificationsReady()).toBe(true); expect(database()).toBe(database()); delete process.env.DATABASE_URL; expect(() => database()).toThrow(); expect(notificationsReady()).toBe(false); });
  it("readBody", async () => {
    expect(await readBody(req("POST", { a: 1 }))).toEqual({ a: 1 });
    await expect(readBody(new Request(O, { method: "POST", body: "{}" }))).rejects.toThrow();
    await expect(readBody(req("POST", {}, { "content-length": "9999" }))).rejects.toThrow();
    await expect(readBody(req("POST"))).rejects.toThrow();
    await expect(readBody(req("POST", "x".repeat(5000)))).rejects.toThrow();
  });
  it("validation", () => {
    expect(parseSchedule({})).toEqual({ reminderTime: "08:00", timeZone: "UTC" });
    expect(() => parseSchedule({ reminderTime: "25:00" })).toThrow(); expect(() => parseSchedule({ timeZone: "bad zone" })).toThrow();
    expect(parseSubscription({ ...sub, timeZone: "Europe/London" }).timeZone).toBe("Europe/London");
    for (const bad of [null, { ...sub, token: 1 }, { ...sub, endpoint: "https://evil.com/x" }, { ...sub, keys: null }, { ...sub, keys: { p256dh: "x", auth } }]) expect(() => parseSubscription(bad)).toThrow();
    expect(validToken(tok)).toBe(true); expect(sameOrigin(req("GET"))).toBe(true);
  });
  it("scheduler auth", async () => {
    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const keys = createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), alg: "RS256" }] });
    const good = { repository: "devcamos/bible-compass", repository_id: "1335846005", ref: "refs/heads/main", sub: "repo:devcamos/bible-compass:ref:refs/heads/main", workflow_ref: "devcamos/bible-compass/.github/workflows/daily-verse.yml@refs/heads/main", event_name: "schedule" };
    const sign = (c: object) => new SignJWT({ ...c }).setProtectedHeader({ alg: "RS256" }).setIssuer("https://token.actions.githubusercontent.com").setAudience(SCHEDULER_AUDIENCE).setIssuedAt().setExpirationTime("5m").sign(privateKey);
    expect(await githubSchedulerAuthorized(await sign(good), keys)).toBe(true);
    expect(await githubSchedulerAuthorized(await sign({ ...good, event_name: "push" }), keys)).toBe(false);
    expect(await githubSchedulerAuthorized("x", keys)).toBe(false);
    expect(await schedulerAuthorized(req("GET", undefined, { authorization: "Bearer " + ENV.CRON_SECRET }))).toBe(true);
    expect(await schedulerAuthorized(req("GET"))).toBe(false);
    expect(await schedulerAuthorized(req("GET", undefined, { authorization: "Bearer nope" }))).toBe(false);
  });
});

describe("test notification", () => {
  const body = { id: "a".repeat(64), token: tok };
  const owned = { rowCount: 1, rows: [{ endpoint: sub.endpoint, p256dh, auth, day: "2026-10-26" }] };
  it("guards", async () => {
    expect((await sendTestNotification(req("POST", body, { origin: "https://evil" }))).status).toBe(403);
    delete process.env.CRON_SECRET; expect((await sendTestNotification(req("POST", body))).status).toBe(503); process.env.CRON_SECRET = ENV.CRON_SECRET;
    expect((await sendTestNotification(req("POST", { id: "x" }))).status).toBe(400);
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); expect((await sendTestNotification(req("POST", body))).status).toBe(404);
    pool.query.mockResolvedValueOnce(owned).mockResolvedValueOnce({ rows: [{ count: 9 }] }); expect((await sendTestNotification(req("POST", body))).status).toBe(429);
  });
  it("sends, expires and fails", async () => {
    pool.query.mockResolvedValueOnce(owned).mockResolvedValueOnce({ rows: [{ count: 1 }] }); send.mockResolvedValueOnce({});
    expect((await sendTestNotification(req("POST", body))).status).toBe(200);
    pool.query.mockResolvedValueOnce(owned).mockResolvedValueOnce({ rows: [{ count: 1 }] }).mockResolvedValueOnce({}); send.mockRejectedValueOnce({ statusCode: 410 });
    expect((await sendTestNotification(req("POST", body))).status).toBe(410);
    pool.query.mockResolvedValueOnce(owned).mockResolvedValueOnce({ rows: [{ count: 1 }] }); send.mockRejectedValueOnce({ statusCode: 500 });
    expect((await sendTestNotification(req("POST", body))).status).toBe(503);
  });
  it("route is preview-only", async () => {
    expect((await testRoute.POST(req("POST", body))).status).toBe(404);
    process.env.VERCEL_ENV = "preview"; expect((await testRoute.POST(req("POST", { id: "x" }))).status).toBe(400);
  });
});

describe("cron daily verse", () => {
  const authd = () => req("GET", undefined, { authorization: "Bearer " + ENV.CRON_SECRET });
  it("guards", async () => {
    expect((await dailyVerse.GET(req("GET"))).status).toBe(401);
    delete process.env.VAPID_SUBJECT; expect((await dailyVerse.GET(authd())).status).toBe(503); process.env.VAPID_SUBJECT = ENV.VAPID_SUBJECT;
    expect(await (await dailyVerse.GET(authd())).json()).toHaveProperty("skipped");
  });
  it("sends in production", async () => {
    process.env.VERCEL_ENV = "production";
    const row = (id: string) => ({ id, endpoint: "e", p256dh, auth, day: "2026-10-26", ttl: 100 });
    pool.query.mockImplementation(async (sql: string) => sql.includes("WITH candidates") ? { rows: [row("1"), row("2"), row("3")] } : sql.startsWith("SELECT count") ? { rows: [{ count: "0" }] } : {});
    send.mockResolvedValueOnce({}).mockRejectedValueOnce({ statusCode: 410 }).mockRejectedValueOnce({ statusCode: 500 });
    const r = await dailyVerse.GET(authd());
    expect(r.status).toBe(503); expect(await r.json()).toMatchObject({ sent: 1, failed: 2 });
    send.mockReset().mockResolvedValue({});
    pool.query.mockImplementation(async (sql: string) => sql.includes("WITH candidates") ? { rows: [] } : sql.startsWith("SELECT count") ? { rows: [{ count: "0" }] } : {});
    expect((await dailyVerse.GET(authd())).status).toBe(200);
  });
});

describe("cron feedback route", () => {
  const authd = () => req("POST", undefined, { authorization: "Bearer " + "w".repeat(32) });
  beforeEach(() => { process.env.FEEDBACK_WORKER_SECRET = "w".repeat(32); });
  it("guards and skips preview", async () => {
    expect((await cronFeedback.POST(new Request(O, { method: "POST" }))).status).toBe(401);
    expect(await (await cronFeedback.POST(authd())).json()).toHaveProperty("skipped");
    process.env.VERCEL_ENV = "production"; expect((await cronFeedback.POST(authd())).status).toBe(503);
  });
  it("processes in production", async () => {
    process.env.VERCEL_ENV = "production"; process.env.FEEDBACK_DATABASE_URL = "pg://f"; process.env.FEEDBACK_RATE_LIMIT_SECRET = "s".repeat(32);
    process.env.FEEDBACK_NOTION_TOKEN = "t"; process.env.FEEDBACK_NOTION_DATA_SOURCE_ID = "323e4567-e89b-42d3-a456-426614174000";
    pool.query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [] });
    expect((await cronFeedback.POST(authd())).status).toBe(200);
    pool.query.mockRejectedValueOnce(new Error("down"));
    expect((await cronFeedback.POST(authd())).status).toBe(503);
    delete process.env.FEEDBACK_RATE_LIMIT_SECRET;
  });
});

describe("subscriptions route", () => {
  const id = "a".repeat(64);
  it("GET", async () => {
    expect((await subs.GET(req("GET"))).status).toBe(401);
    const g = () => subs.GET(new Request(`${O}/x?id=${id}`, { headers: { authorization: "Bearer " + tok } }));
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ reminder_time: "08:00", time_zone: "UTC" }] }); expect((await g()).status).toBe(200);
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); expect((await g()).status).toBe(404);
    pool.query.mockRejectedValueOnce(new Error()); expect((await g()).status).toBe(503);
  });
  it("POST", async () => {
    expect((await subs.POST(req("POST", sub, { origin: "https://evil" }))).status).toBe(403);
    delete process.env.CRON_SECRET; expect((await subs.POST(req("POST", sub))).status).toBe(503); process.env.CRON_SECRET = ENV.CRON_SECRET;
    expect((await subs.POST(req("POST", {}))).status).toBe(400);
    pool.query.mockResolvedValueOnce({ rows: [{ count: 99 }] }); expect((await subs.POST(req("POST", sub))).status).toBe(429);
    pool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] }).mockResolvedValueOnce({ rowCount: 1 }); expect((await subs.POST(req("POST", sub))).status).toBe(200);
    pool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] }).mockResolvedValueOnce({ rowCount: 0 }); expect((await subs.POST(req("POST", sub))).status).toBe(409);
    pool.query.mockRejectedValueOnce(new Error()); expect((await subs.POST(req("POST", sub, { "x-real-ip": "1.2.3.4" }))).status).toBe(503);
  });
  it("DELETE", async () => {
    expect((await subs.DELETE(req("DELETE", sub, { origin: "https://evil" }))).status).toBe(403);
    expect((await subs.DELETE(req("DELETE", {}))).status).toBe(400);
    pool.query.mockResolvedValueOnce({}); expect((await subs.DELETE(req("DELETE", sub))).status).toBe(200);
    pool.query.mockRejectedValueOnce(new Error()); expect((await subs.DELETE(req("DELETE", sub))).status).toBe(503);
  });
});

describe("small routes", () => {
  it("config, health, concepts data and feedback route wiring", async () => {
    expect(await config.GET().json()).toMatchObject({ enabled: true, canSendTest: false });
    delete process.env.DATABASE_URL; expect(await config.GET().json()).toMatchObject({ enabled: false, publicKey: null });
    expect(await health.GET().json()).toMatchObject({ ok: true, surface: "local" });
    process.env.VERCEL_ENV = "production"; process.env.VERCEL_GIT_COMMIT_SHA = "a"; expect(await health.GET().json()).toMatchObject({ surface: "production" }); delete process.env.VERCEL_GIT_COMMIT_SHA;
    const cd = conceptsData as Record<string, (r?: Request) => Response | Promise<Response>>;
    expect((await cd.GET(new Request(O))).status).toBe(200);
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const [h, m] of [[(fbRoute as Record<string, unknown>).POST, "POST"], [(ratingRoute as Record<string, unknown>).PUT, "PUT"]] as const) expect((await (h as (r: Request) => Promise<Response>)(req(m, {}))).status).toBe(503);
    expect((await (summaryRoute as unknown as { GET: (r: Request) => Promise<Response> }).GET(req("GET"))).status).toBe(503);
  });
});
