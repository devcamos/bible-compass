import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("../../src/lib/feedback/db", () => ({ feedbackDatabase: () => { throw new Error("no default db in tests"); } }));
import type { Pool } from "pg";
import { FeedbackRateError, feedbackLimits, limitFeedbackRequest } from "../../src/lib/feedback/rate-limit";

const secret = "s".repeat(32);
const request = (ip?: string) => new Request("https://app.test", { headers: ip ? { "x-real-ip": ip } : {} });
const fakeDb = (count: number | null) => ({ query: vi.fn(async (_sql: string, [json]: [string]) => ({ rows: count === null ? [] : (JSON.parse(json) as { bucket: string }[]).map(i => ({ bucket: i.bucket, count })) })) }) as unknown as Pool;

describe("feedbackLimits", () => {
  afterEach(() => { delete process.env.VERCEL; delete process.env.FEEDBACK_RATE_LIMIT_SECRET; });
  it("requires a strong secret", () => { expect(() => feedbackLimits(request(), "feedback", "short")).toThrow(); });
  it("builds per-scope windows", () => {
    expect(feedbackLimits(request(), "feedback", secret, 0)).toHaveLength(3);
    expect(feedbackLimits(request(), "rating", secret, 0).map(l => l.limit)).toEqual([30, 2000]);
    expect(feedbackLimits(request(), "summary", secret, 0)[0].retryAfter).toBe(60);
  });
  it("buckets by x-real-ip only on Vercel", () => {
    process.env.VERCEL = "1";
    const a = feedbackLimits(request("1.1.1.1"), "rating", secret, 0)[0].bucket;
    expect(feedbackLimits(request("2.2.2.2"), "rating", secret, 0)[0].bucket).not.toBe(a);
    expect(feedbackLimits(request(), "rating", secret, 0)[0].bucket).not.toBe(a);
  });
  it("allows under the limit and blocks over it", async () => {
    process.env.FEEDBACK_RATE_LIMIT_SECRET = secret;
    await expect(limitFeedbackRequest(request(), "feedback", fakeDb(1))).resolves.toBeUndefined();
    await expect(limitFeedbackRequest(request(), "feedback", fakeDb(11))).rejects.toBeInstanceOf(FeedbackRateError);
    await expect(limitFeedbackRequest(request(), "rating", fakeDb(null))).rejects.toBeInstanceOf(FeedbackRateError);
  });
  it("fails closed without config", async () => { await expect(limitFeedbackRequest(request(), "rating", fakeDb(1))).rejects.toThrow("not configured"); });
  it("uses the default database when none is given", async () => { process.env.FEEDBACK_RATE_LIMIT_SECRET = secret; await expect(limitFeedbackRequest(request(), "rating")).rejects.toThrow("no default db"); });
});
