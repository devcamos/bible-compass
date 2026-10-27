import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const client = { query: vi.fn(), release: vi.fn() };
const pool = { query: vi.fn(), connect: vi.fn(async () => client) };
vi.mock("pg", () => ({ Pool: vi.fn(function () { return pool; }) }));
vi.mock("@vercel/functions", () => ({ attachDatabasePool: vi.fn() }));
import { feedbackDatabase, feedbackPoolConfig, feedbackReady } from "../../src/lib/feedback/db";
import { FeedbackConflictError, loadRatingSummary, RatingConflictError, saveFeedback, saveRating } from "../../src/lib/feedback/service";
import { feedbackFailureCode, feedbackPost, ratingPut, ratingSummaryGet } from "../../src/lib/feedback/handlers";

const key = "123e4567-e89b-42d3-a456-426614174000";
const input = { idempotencyKey: key, category: "bug" as const, description: "d", reproduction: null, expected: null, replyEmail: "a@b.co", pathname: null, clientCommit: null };
const rows = (r: unknown[], rowCount = r.length) => ({ rows: r, rowCount });
const origin = "https://app.test";
const post = (body: unknown, method = "POST", o = origin) => new Request(origin + "/api/feedback", { method, body: JSON.stringify(body), headers: { origin: o, "content-type": "application/json" } });

beforeEach(() => { process.env.FEEDBACK_DATABASE_URL = "postgres://x"; process.env.FEEDBACK_RATE_LIMIT_SECRET = "s".repeat(32); client.query.mockReset(); client.release.mockReset(); pool.query.mockReset(); });
afterEach(() => { delete process.env.FEEDBACK_DATABASE_URL; delete process.env.FEEDBACK_RATE_LIMIT_SECRET; vi.restoreAllMocks(); });

describe("db", () => {
  it("configures and caches the pool", () => {
    expect(feedbackPoolConfig("c").max).toBe(3);
    expect(feedbackDatabase()).toBe(feedbackDatabase());
    delete process.env.FEEDBACK_DATABASE_URL; expect(feedbackReady()).toBe(false); expect(() => feedbackDatabase()).toThrow();
  });
});

describe("service", () => {
  it("inserts new feedback with contact and outbox", async () => {
    client.query.mockResolvedValueOnce({}).mockResolvedValueOnce(rows([{ id: "abc" }])).mockResolvedValue({});
    expect(await saveFeedback(input)).toEqual({ reference: "FB-ABC" });
    expect(client.query).toHaveBeenCalledTimes(5);
    client.query.mockReset().mockResolvedValueOnce({}).mockResolvedValueOnce(rows([{ id: "abc" }])).mockResolvedValue({});
    await saveFeedback({ ...input, replyEmail: null }); expect(client.query).toHaveBeenCalledTimes(4);
  });
  it("replays identical retries and rejects conflicts", async () => {
    const { payloadHash } = await import("../../src/lib/feedback/validation");
    client.query.mockResolvedValueOnce({}).mockResolvedValueOnce(rows([], 0)).mockResolvedValueOnce(rows([{ id: "x", payload_hash: payloadHash(input) }])).mockResolvedValue({});
    expect(await saveFeedback(input)).toEqual({ reference: "FB-X" });
    client.query.mockReset().mockResolvedValueOnce({}).mockResolvedValueOnce(rows([], 0)).mockResolvedValueOnce(rows([], 0)).mockResolvedValue({});
    await expect(saveFeedback(input)).rejects.toBeInstanceOf(FeedbackConflictError);
    expect(client.release).toHaveBeenLastCalledWith(false);
    client.query.mockReset().mockRejectedValue(new Error("down"));
    await expect(saveFeedback(input)).rejects.toThrow("down");
    expect(client.release).toHaveBeenLastCalledWith(true);
  });
  it("saves ratings and summaries", async () => {
    pool.query.mockResolvedValueOnce(rows([{ stars: 4, revision: "2" }]));
    expect(await saveRating({ stars: 4, token: "t", revision: 2 })).toEqual({ stars: 4, revision: 2 });
    pool.query.mockResolvedValueOnce(rows([], 0));
    await expect(saveRating({ stars: 4, token: "t", revision: 2 })).rejects.toBeInstanceOf(RatingConflictError);
    const base = { rating_count: "1", one: "0", two: "0", three: "0", four: "1", five: "0", as_of: new Date(0) };
    pool.query.mockResolvedValueOnce(rows([{ ...base, average: "4.0" }]));
    expect((await loadRatingSummary()).average).toBe(4);
    pool.query.mockResolvedValueOnce(rows([{ ...base, average: null }]));
    expect((await loadRatingSummary()).average).toBeNull();
  });
});

describe("handlers", () => {
  const limitOk = () => pool.query.mockResolvedValueOnce(rows([]).rows.length ? {} : { rows: [] });
  it("maps failure codes", () => { expect(feedbackFailureCode({ code: "08000" })).toBe("08000"); expect(feedbackFailureCode({ code: "x" })).toBe("UNKNOWN"); expect(feedbackFailureCode(null)).toBe("UNKNOWN"); });
  it("rejects cross-origin and unconfigured", async () => {
    expect((await feedbackPost(post({}, "POST", "https://evil"))).status).toBe(403);
    expect((await ratingPut(post({}, "PUT", "https://evil"))).status).toBe(403);
    vi.spyOn(console, "error").mockImplementation(() => {});
    delete process.env.FEEDBACK_DATABASE_URL;
    expect((await feedbackPost(post({}))).status).toBe(503);
    expect((await ratingPut(post({}, "PUT"))).status).toBe(503);
    expect((await ratingSummaryGet(new Request(origin))).status).toBe(503);
  });
  it("maps input, request, rate and conflict errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await feedbackPost(post({ bad: 1 }))).status).toBe(400);
    expect((await feedbackPost(new Request(origin, { method: "POST", body: "x", headers: { origin } }))).status).toBe(415);
    pool.query.mockResolvedValueOnce({ rows: [] });
    expect((await feedbackPost(post({ idempotencyKey: key, category: "bug", description: "d" }))).status).toBe(429);
    const ok = (count = 1) => ({ rows: Array.from({ length: 3 }, () => null), map: undefined, count });
    void ok; void limitOk;
    // rate-limit pass: rows echo every bucket with count 1
    pool.query.mockImplementationOnce(async (_s: string, [j]: [string]) => ({ rows: JSON.parse(j).map((b: { bucket: string }) => ({ bucket: b.bucket, count: 1 })) }));
    client.query.mockResolvedValueOnce({}).mockResolvedValueOnce(rows([{ id: "a" }])).mockResolvedValue({});
    expect((await feedbackPost(post({ idempotencyKey: key, category: "bug", description: "d" }))).status).toBe(200);
    pool.query.mockImplementationOnce(async (_s: string, [j]: [string]) => ({ rows: JSON.parse(j).map((b: { bucket: string }) => ({ bucket: b.bucket, count: 1 })) }));
    client.query.mockReset().mockResolvedValueOnce({}).mockResolvedValueOnce(rows([], 0)).mockResolvedValueOnce(rows([], 0)).mockResolvedValue({});
    expect((await feedbackPost(post({ idempotencyKey: key, category: "bug", description: "d" }))).status).toBe(409);
    const rating = { stars: 3, token: "a".repeat(43), revision: 1 };
    pool.query.mockImplementationOnce(async (_s: string, [j]: [string]) => ({ rows: JSON.parse(j).map((b: { bucket: string }) => ({ bucket: b.bucket, count: 1 })) })).mockResolvedValueOnce(rows([], 0));
    expect((await ratingPut(post(rating, "PUT"))).status).toBe(409);
    pool.query.mockImplementationOnce(async (_s: string, [j]: [string]) => ({ rows: JSON.parse(j).map((b: { bucket: string }) => ({ bucket: b.bucket, count: 1 })) })).mockResolvedValueOnce(rows([{ stars: 3, revision: "1" }]));
    expect((await ratingPut(post(rating, "PUT"))).status).toBe(200);
    pool.query.mockImplementationOnce(async (_s: string, [j]: [string]) => ({ rows: JSON.parse(j).map((b: { bucket: string }) => ({ bucket: b.bucket, count: 1 })) })).mockResolvedValueOnce(rows([{ rating_count: "0", average: null, one: "0", two: "0", three: "0", four: "0", five: "0", as_of: new Date(0) }]));
    expect((await ratingSummaryGet(new Request(origin))).status).toBe(200);
    pool.query.mockRejectedValueOnce({ code: "08006" });
    expect((await ratingSummaryGet(new Request(origin))).status).toBe(503);
  });
});
