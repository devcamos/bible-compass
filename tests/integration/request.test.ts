import { describe, expect, it, vi } from "vitest";
import { FeedbackRequestError, feedbackJson, readFeedbackBody, sameFeedbackOrigin } from "../../src/lib/feedback/request";

const url = "https://app.test/api/feedback";
const req = (body: BodyInit | null, headers: Record<string, string> = { "content-type": "application/json" }) => new Request(url, { method: "POST", body, headers });
const status = async (p: Promise<unknown>) => { try { await p; return 0; } catch (e) { expect(e).toBeInstanceOf(FeedbackRequestError); return (e as FeedbackRequestError).status; } };

describe("request helpers", () => {
  it("checks origin", () => {
    expect(sameFeedbackOrigin(new Request(url, { headers: { origin: "https://app.test" } }))).toBe(true);
    expect(sameFeedbackOrigin(new Request(url, { headers: { origin: "https://evil.test" } }))).toBe(false);
    expect(sameFeedbackOrigin(new Request(url, { headers: { origin: "https://app.test", "sec-fetch-site": "cross-site" } }))).toBe(false);
  });
  it("reads JSON", async () => { expect(await readFeedbackBody(req('{"a":1}', { "content-type": "application/json; charset=utf-8", "content-encoding": "identity" }))).toEqual({ a: 1 }); });
  it("rejects bad requests", async () => {
    expect(await status(readFeedbackBody(req("{}", {})))).toBe(415);
    expect(await status(readFeedbackBody(req("{}", { "content-type": "application/json", "content-encoding": "gzip" })))).toBe(415);
    expect(await status(readFeedbackBody(req("{}", { "content-type": "application/json", "content-length": "abc" })))).toBe(413);
    expect(await status(readFeedbackBody(req("{}", { "content-type": "application/json", "content-length": "99999" })))).toBe(413);
    expect(await status(readFeedbackBody(req(null)))).toBe(400);
    expect(await status(readFeedbackBody(req("not json")))).toBe(400);
    expect(await status(readFeedbackBody(req("x".repeat(40_000))))).toBe(413);
  });
  it("times out slow bodies", async () => {
    vi.useFakeTimers();
    const stream = new ReadableStream({ pull() { return new Promise(() => {}); } });
    const p = status(readFeedbackBody(new Request(url, { method: "POST", body: stream, headers: { "content-type": "application/json" }, duplex: "half" } as RequestInit)));
    await vi.advanceTimersByTimeAsync(5_001);
    expect(await p).toBe(408);
    vi.useRealTimers();
  });
  it("builds no-store JSON", async () => {
    const r = feedbackJson({ ok: true }, 201, { "Retry-After": "3" });
    expect(r.status).toBe(201); expect(r.headers.get("cache-control")).toBe("no-store"); expect(r.headers.get("retry-after")).toBe("3");
    expect(feedbackJson({}).status).toBe(200);
  });
});
