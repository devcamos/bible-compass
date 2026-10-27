import { afterEach, describe, expect, it, vi } from "vitest";
const query = vi.fn();
vi.mock("../../src/lib/feedback/db", () => ({ feedbackDatabase: () => ({ query }) }));
import { deliveryBackoff, MAX_DELIVERY_ATTEMPTS, postgresOutboxStore, processFeedbackOutbox, type OutboxStore } from "../../src/lib/feedback/outbox";
import { deliverFeedbackToNotion, feedbackNotionConfig, NotionDeliveryError, type FeedbackForTriage } from "../../src/lib/feedback/notion";

const id = "123e4567-e89b-42d3-a456-426614174000";
const page = "223e4567-e89b-42d3-a456-426614174000";
const config = { token: "t", dataSourceId: "323e4567-e89b-42d3-a456-426614174000" };
const row: FeedbackForTriage = { id, category: "bug", description: "d".repeat(4000) + "\u{1F600}", reproduction: "r", expected: null, pathname: "/p", client_commit: "c", server_commit: "s", created_at: "2026-10-26T00:00:00Z" };
const json = (body: unknown, init: ResponseInit = {}) => new Response(typeof body === "string" ? body : JSON.stringify(body), init);

afterEach(() => { delete process.env.FEEDBACK_NOTION_TOKEN; delete process.env.FEEDBACK_NOTION_DATA_SOURCE_ID; query.mockReset(); });

describe("notion config", () => {
  it("needs token and uuid data source", () => {
    expect(feedbackNotionConfig()).toBeNull();
    process.env.FEEDBACK_NOTION_TOKEN = "t"; process.env.FEEDBACK_NOTION_DATA_SOURCE_ID = "bad"; expect(feedbackNotionConfig()).toBeNull();
    process.env.FEEDBACK_NOTION_DATA_SOURCE_ID = config.dataSourceId; expect(feedbackNotionConfig()).toEqual(config);
  });
});

describe("deliverFeedbackToNotion", () => {
  it("creates a page when none exists", async () => {
    const t = vi.fn().mockResolvedValueOnce(json({ results: [], has_more: false })).mockResolvedValueOnce(json({ id: page }));
    expect(await deliverFeedbackToNotion(row, config, t)).toBe(page);
    const body = JSON.parse(t.mock.calls[1][1].body);
    expect(body.properties["Page path"]).toBeDefined(); expect(body.children.length).toBeGreaterThan(4);
  });
  it("creates a minimal page", async () => {
    const t = vi.fn().mockResolvedValueOnce(json({ results: [], has_more: false })).mockResolvedValueOnce(json({ id: page }));
    await deliverFeedbackToNotion({ ...row, description: "x", reproduction: null, pathname: null, client_commit: null, server_commit: null, created_at: new Date() }, config, t);
    expect(JSON.parse(t.mock.calls[1][1].body).properties["Page path"]).toBeUndefined();
  });
  it("reconciles an existing page", async () => {
    expect(await deliverFeedbackToNotion(row, config, vi.fn().mockResolvedValue(json({ results: [{ id: page }], has_more: false })))).toBe(page);
  });
  const fails = async (t: unknown, r = row, c = config) => { try { await deliverFeedbackToNotion(r, c, t as typeof fetch); return null; } catch (e) { expect(e).toBeInstanceOf(NotionDeliveryError); return e as NotionDeliveryError; } };
  it("maps failures", async () => {
    expect((await fails(vi.fn(), { ...row, id: "x" }))?.code).toBe("notion_invalid_identifier");
    expect((await fails(vi.fn().mockRejectedValue(new Error())))?.code).toBe("notion_unavailable");
    expect((await fails(vi.fn().mockResolvedValueOnce(json({ results: [], has_more: false })).mockRejectedValueOnce(new Error())))?.code).toBe("unconfirmed_create");
    const e429 = await fails(vi.fn().mockResolvedValue(json("", { status: 429, headers: { "retry-after": "7" } })));
    expect([e429?.code, e429?.retryable, e429?.retryAfterSeconds]).toEqual(["notion_http_429", true, 7]);
    expect((await fails(vi.fn().mockResolvedValue(json("", { status: 401 }))))?.retryable).toBe(false);
    expect((await fails(vi.fn().mockResolvedValue(json("", { status: 503, headers: { "retry-after": new Date(Date.now() + 5000).toUTCString() } }))))?.retryAfterSeconds).toBeGreaterThanOrEqual(0);
    expect((await fails(vi.fn().mockResolvedValue(json("", { status: 503, headers: { "retry-after": "soon" } }))))?.retryAfterSeconds).toBe(0);
    expect((await fails(vi.fn().mockResolvedValue(new Response(null))))?.code).toBe("notion_invalid_response");
    expect((await fails(vi.fn().mockResolvedValue(json("x".repeat(140_000)))))?.code).toBe("notion_response_too_large");
    expect((await fails(vi.fn().mockResolvedValue(json("[]"))))?.code).toBe("notion_invalid_response");
    expect((await fails(vi.fn().mockResolvedValue(json({ results: 1 }))))?.code).toBe("notion_invalid_response");
    expect((await fails(vi.fn().mockResolvedValue(json({ results: [], has_more: true }))))?.code).toBe("notion_reconciliation_conflict");
    expect((await fails(vi.fn().mockResolvedValue(json({ results: [null], has_more: false }))))?.code).toBe("notion_invalid_response");
    expect((await fails(vi.fn().mockResolvedValueOnce(json({ results: [], has_more: false })).mockResolvedValueOnce(json({ id: 1 }))))?.code).toBe("unconfirmed_create");
  });
});

describe("outbox", () => {
  it("bounds backoff", () => {
    expect(deliveryBackoff(1, 0, 0)).toBe(60);
    expect(deliveryBackoff(20, 0, 1)).toBe(18432);
    expect(deliveryBackoff(1, 999_999, -1)).toBe(86_400);
    expect(deliveryBackoff(0)).toBeGreaterThanOrEqual(60);
  });
  const claim = (n = 1) => ({ ...row, outbox_id: "o", lease_token: "l", attempt_count: n });
  const store = (claims: unknown[], ok = true): OutboxStore => ({ claim: vi.fn(async () => (claims.shift() ?? null) as never), delivered: vi.fn(async () => ok), failed: vi.fn(async () => ok) });
  it("requires config without a custom deliverer", async () => { await expect(processFeedbackOutbox()).rejects.toThrow("not configured"); });
  it("delivers up to three items", async () => {
    expect(await processFeedbackOutbox({ store: store([claim(), claim(), claim(), claim()]), deliver: async () => page })).toMatchObject({ claimed: 3, delivered: 3 });
    expect(await processFeedbackOutbox({ store: store([claim()], false), deliver: async () => page })).toMatchObject({ stale: 1 });
    expect(await processFeedbackOutbox({ store: store([]), deliver: async () => page })).toMatchObject({ claimed: 0 });
  });
  it("defers, fails and stops on destination errors", async () => {
    expect(await processFeedbackOutbox({ store: store([claim(), claim()]), deliver: async () => { throw new Error("x"); }, random: () => 0 })).toMatchObject({ deferred: 2 });
    expect(await processFeedbackOutbox({ store: store([claim(), claim()]), deliver: async () => { throw new NotionDeliveryError("notion_http_429"); } })).toMatchObject({ deferred: 1, claimed: 1 });
    expect(await processFeedbackOutbox({ store: store([claim(), claim()]), deliver: async () => { throw new NotionDeliveryError("notion_http_401", false); } })).toMatchObject({ failed: 1, claimed: 1 });
    expect(await processFeedbackOutbox({ store: store([claim(MAX_DELIVERY_ATTEMPTS)]), deliver: async () => { throw new Error(); } })).toMatchObject({ failed: 1 });
    expect(await processFeedbackOutbox({ store: store([claim()], false), deliver: async () => { throw new Error(); } })).toMatchObject({ stale: 1 });
    let t = 0;
    expect(await processFeedbackOutbox({ store: store([claim(), claim()]), deliver: async () => page, now: () => (t += 30_000) })).toMatchObject({ claimed: 1 });
  });
  it("uses Notion and the Postgres store by default", async () => {
    process.env.FEEDBACK_NOTION_TOKEN = "t"; process.env.FEEDBACK_NOTION_DATA_SOURCE_ID = config.dataSourceId;
    query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [] });
    expect(await processFeedbackOutbox()).toMatchObject({ claimed: 0 });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ results: [{ id: page }], has_more: false }));
    query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [claim()] }).mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [] });
    expect(await processFeedbackOutbox()).toMatchObject({ delivered: 1 });
    fetchMock.mockRestore();
  });
  it("postgres store marks failures", async () => {
    const s = postgresOutboxStore();
    query.mockResolvedValue({ rowCount: 1 });
    expect(await s.failed(claim(), new NotionDeliveryError("x"), 5)).toBe(true);
    expect(query.mock.lastCall?.[1][2]).toBe("pending");
    await s.failed(claim(MAX_DELIVERY_ATTEMPTS), new NotionDeliveryError("x"), 5);
    expect(query.mock.lastCall?.[1][2]).toBe("failed");
  });
});
