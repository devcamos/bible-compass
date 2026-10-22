import assert from "node:assert/strict";
import { test } from "node:test";
import { Client, type Pool } from "pg";
import { feedbackPoolConfig, feedbackReady } from "../src/lib/feedback/db";
import { feedbackFailureCode } from "../src/lib/feedback/handlers";
import { feedbackLimits, FeedbackRateError, limitFeedbackRequest } from "../src/lib/feedback/rate-limit";
import { feedbackJson, FeedbackRequestError, readFeedbackBody, sameFeedbackOrigin } from "../src/lib/feedback/request";
import { loadRatingSummary, saveFeedback, FeedbackConflictError, RatingConflictError, saveRating } from "../src/lib/feedback/service";
import { parseFeedback, parseRating, payloadHash, ratingTokenHash } from "../src/lib/feedback/validation";
import { POST } from "../src/app/api/feedback/route";
import { PUT } from "../src/app/api/ratings/route";
import { GET } from "../src/app/api/ratings/summary/route";

const key = "b6960f6e-154d-4b58-a096-6861127f636f";
const input = { idempotencyKey: key, category: "bug", description: "The back link lost my place." };
const token = Buffer.alloc(32, 7).toString("base64url");
const request = (body: unknown, headers: HeadersInit = {}) => new Request("https://compass.test/api/feedback", {
  method: "POST", headers: { origin: "https://compass.test", "content-type": "application/json", ...headers }, body: JSON.stringify(body),
});

test("feedback pool sends only PgBouncer-supported startup parameters", () => {
  const config = feedbackPoolConfig("postgresql://fixture:fixture@localhost:5432/feedback");
  const client = new Client(config) as unknown as { getStartupConf(): Record<string, unknown> };
  const allowed = new Set(["user", "database", "application_name", "client_encoding", "datestyle", "timezone", "standard_conforming_strings"]);
  assert.ok(Object.keys(client.getStartupConf()).every(name => allowed.has(name)));
  assert.equal(config.query_timeout, 6_000);
});

test("service diagnostics emit fixed safe codes only, not provider details", () => {
  assert.equal(feedbackFailureCode({ code: "42501", message: "private SQL and credentials" }), "42501");
  assert.equal(feedbackFailureCode({ code: "08P01" }), "08P01");
  assert.equal(feedbackFailureCode({ code: "ENOTFOUND" }), "ENOTFOUND");
  assert.equal(feedbackFailureCode({ code: "secret=private-value", message: "private" }), "UNKNOWN");
  assert.equal(feedbackFailureCode(new Error("Sensitive details must not be logged")), "UNKNOWN");
});

test("feedback intake is anonymous, bounded and allowlisted; no hidden diagnostics", () => {
  const parsed = parseFeedback(input);
  assert.equal(parsed.replyEmail, null);
  assert.equal(parsed.pathname, null);
  assert.equal(parsed.clientCommit, null);
  for (const change of [
    { idempotencyKey: "predictable" }, { category: "comment" }, { description: " \n\t " },
    { description: "x".repeat(5001) }, { reproduction: "x".repeat(3001) }, { expected: "x".repeat(2001) },
    { replyEmail: "bad@@mail.test" }, { replyEmail: "a@mail.test\nbcc:other@mail.test" },
    { description: "Bad\u0000text" }, { clientCommit: "main" }, { pushToken: token }, { diagnostics: { localStorage: "private" } },
  ]) assert.throws(() => parseFeedback({ ...input, ...change }));
  assert.throws(() => parseFeedback([input]));
});

test("context is opt-in pathname only and never stores query strings or fragments", () => {
  const parsed = parseFeedback({ ...input, pathname: "/psalms/trust?email=private%40example.test#secret" });
  assert.equal(parsed.pathname, "/psalms/trust");
  for (const pathname of ["https://evil.test", "//evil.test", "/a/..//evil.test", "/\\evil.test", "/a b", "/bad\npath", "/" + "x".repeat(513)]) {
    assert.throws(() => parseFeedback({ ...input, pathname }));
  }
});

test("normalized payload hash supports lost-ack retry across deployments, but distinguishes edited text/contact", () => {
  const first = parseFeedback({ ...input, description: "  A line\r\nand another.  ", reproduction: "\r\nOpen a passage.\r\n" });
  const retry = parseFeedback({ ...input, idempotencyKey: key.toUpperCase(), description: "A line\nand another.", reproduction: "Open a passage." });
  assert.equal(payloadHash(first), payloadHash(retry));
  assert.notEqual(payloadHash(first), payloadHash({ ...retry, description: "Edited feedback." }));
  assert.notEqual(payloadHash(first), payloadHash({ ...retry, replyEmail: "person@example.test" }));
  assert.equal(parseFeedback({ ...input, category: "improvement", reproduction: "Hidden old bug details", expected: "Hidden old expectation" }).reproduction, null);
});

test("app rating is independent, constrained to 1–5 and hashes the random management token", () => {
  assert.deepEqual(parseRating({ stars: 4, token, revision: 123 }), { stars: 4, token, revision: 123 });
  assert.equal(ratingTokenHash(token).length, 64);
  assert.notEqual(ratingTokenHash(token), token);
  for (const stars of [0, 6, 2.5, "5", null, true]) assert.throws(() => parseRating({ stars, token }));
  for (const value of [{ stars: 4, token: "guessable" }, { stars: 4, token, email: "x@y.test" }, { stars: 4, token, pushToken: "other" }]) assert.throws(() => parseRating(value));
  for (const revision of [0, -1, 1.5, "2", null, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => parseRating({ stars: 4, token, revision }));
  assert.equal(parseRating({ stars: 4, token, revision: Number.MAX_SAFE_INTEGER }).revision, Number.MAX_SAFE_INTEGER);
});

test("JSON reader rejects wrong media, compression, malformed JSON/UTF-8 and oversized headers", async () => {
  await assert.rejects(readFeedbackBody(request(input, { "content-type": "application/jsonx" })), error => error instanceof FeedbackRequestError && error.status === 415);
  await assert.rejects(readFeedbackBody(request(input, { "content-encoding": "gzip" })), error => error instanceof FeedbackRequestError && error.status === 415);
  await assert.rejects(readFeedbackBody(request(input, { "content-length": "32769" })), error => error instanceof FeedbackRequestError && error.status === 413);
  await assert.rejects(readFeedbackBody(new Request("https://compass.test", { method: "POST", headers: { "content-type": "application/json" }, body: "{" })), error => error instanceof FeedbackRequestError && error.status === 400);
  await assert.rejects(readFeedbackBody(new Request("https://compass.test", { method: "POST", headers: { "content-type": "application/json" }, body: new Uint8Array([0xff]) })), error => error instanceof FeedbackRequestError && error.status === 400);
  assert.deepEqual(await readFeedbackBody(request(input, { "content-type": "application/json; charset=utf-8" })), input);
});

test("streaming body limit holds even when Content-Length is absent or false", async () => {
  let canceled = false;
  const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new Uint8Array(32769)); }, cancel() { canceled = true; } });
  const streamed = new Request("https://compass.test", { method: "POST", body: stream, headers: { "content-type": "application/json", "content-length": "2" }, duplex: "half" } as RequestInit & { duplex: "half" });
  await assert.rejects(readFeedbackBody(streamed), error => error instanceof FeedbackRequestError && error.status === 413);
  assert.equal(canceled, true);
});

test("slow body cannot keep an intake request open indefinitely", async () => {
  let canceled = false;
  const stream = new ReadableStream<Uint8Array>({ cancel() { canceled = true; } });
  const slow = new Request("https://compass.test", { method: "POST", body: stream, headers: { "content-type": "application/json" }, duplex: "half" } as RequestInit & { duplex: "half" });
  await assert.rejects(readFeedbackBody(slow), error => error instanceof FeedbackRequestError && error.status === 408);
  assert.equal(canceled, true);
});

test("mutation boundary rejects cross-origin requests and all managed responses are uncached", async () => {
  const other = request(input, { origin: "https://other.test" });
  assert.equal(sameFeedbackOrigin(other), false);
  for (const method of [POST, PUT]) {
    const response = await method(other);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  assert.equal(sameFeedbackOrigin(request(input, { "sec-fetch-site": "cross-site" })), false);
  assert.equal(feedbackJson({ ok: true }).headers.get("cache-control"), "no-store");
});

test("optional API fails closed without config and does not expose provider or credential details", async () => {
  const oldUrl = process.env.FEEDBACK_DATABASE_URL, oldSecret = process.env.FEEDBACK_RATE_LIMIT_SECRET;
  delete process.env.FEEDBACK_DATABASE_URL; delete process.env.FEEDBACK_RATE_LIMIT_SECRET;
  try {
    assert.equal(feedbackReady(), false);
    for (const response of [await POST(request(input)), await PUT(request({ stars: 5, token })), await GET(new Request("https://compass.test/api/ratings/summary"))]) {
      assert.equal(response.status, 503);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.deepEqual(await response.json(), { error: "The service is temporarily unavailable. Please try again." });
    }
  } finally {
    if (oldUrl === undefined) delete process.env.FEEDBACK_DATABASE_URL; else process.env.FEEDBACK_DATABASE_URL = oldUrl;
    if (oldSecret === undefined) delete process.env.FEEDBACK_RATE_LIMIT_SECRET; else process.env.FEEDBACK_RATE_LIMIT_SECRET = oldSecret;
  }
});

test("distributed buckets use separate rotating keyed identifiers, not raw IPs or reminder secrets", () => {
  const old = process.env.VERCEL;
  process.env.VERCEL = "1";
  try {
    const r = request(input, { "x-real-ip": "192.0.2.123" });
    const secret = "test-only-feedback-secret-at-least-32-characters";
    const now = Date.parse("2026-10-22T12:30:00Z");
    const limits = feedbackLimits(r, "feedback", secret, now);
    assert.equal(limits.length, 3);
    assert.equal(limits[0].retryAfter, 1800);
    assert.equal(limits[0].limit, 10);
    assert.ok(limits.every(limit => /^[a-f0-9]{64}$/.test(limit.bucket)));
    assert.notEqual(limits[0].bucket, feedbackLimits(r, "feedback", secret, now + 3600_000)[0].bucket);
    assert.notEqual(limits[0].bucket, feedbackLimits(r, "rating", secret, now)[0].bucket);
    assert.notEqual(limits[0].bucket, feedbackLimits(r, "feedback", secret + "rotate", now)[0].bucket);
    const other = feedbackLimits(request(input, { "x-real-ip": "192.0.2.124" }), "feedback", secret, now);
    assert.notEqual(limits[0].bucket, other[0].bucket);
    assert.equal(limits[2].bucket, other[2].bucket);
    assert.throws(() => feedbackLimits(r, "summary", "short"));
  } finally { if (old === undefined) delete process.env.VERCEL; else process.env.VERCEL = old; }
});

test("summary maps empty set to null and returns only aggregate fields from one query", async () => {
  let queries = 0;
  const db = { query: async () => { queries += 1; return { rows: [{ rating_count: "0", average: null, one: "0", two: "0", three: "0", four: "0", five: "0", as_of: new Date("2026-10-22T12:00:00Z") }] }; } } as unknown as Pool;
  assert.deepEqual(await loadRatingSummary(db), { average: null, ratingCount: 0, distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }, asOf: "2026-10-22T12:00:00.000Z" });
  assert.equal(queries, 1);
});

test("rating replacement sends only a hash and own score, never includes overall metrics", async () => {
  let args: unknown[] = [];
  const db = { query: async (_sql: string, params: unknown[]) => { args = params; return { rowCount: 1, rows: [{ stars: 2, revision: "123" }] }; } } as unknown as Pool;
  assert.deepEqual(await saveRating({ stars: 2, token, revision: 123 }, db), { stars: 2, revision: 123 });
  assert.deepEqual(args, [ratingTokenHash(token), 2, 123]);
});

test("a rejected stale/equal-conflicting rating cannot claim a successful update", async () => {
  const db = { query: async () => ({ rowCount: 0, rows: [] }) } as unknown as Pool;
  await assert.rejects(saveRating({ stars: 2, token, revision: 123 }, db), RatingConflictError);
});

test("rate-limit breach carries a bounded retry delay and never requires per-instance memory", async () => {
  const old = process.env.FEEDBACK_RATE_LIMIT_SECRET;
  process.env.FEEDBACK_RATE_LIMIT_SECRET = "test-only-feedback-secret-at-least-32-characters";
  try {
    const db = { query: async (_sql: string, params: string[]) => ({ rows: JSON.parse(params[0]).map((row: { bucket: string }) => ({ bucket: row.bucket, count: 10001 })) }) } as unknown as Pool;
    await assert.rejects(limitFeedbackRequest(request(input), "summary", db), error => error instanceof FeedbackRateError && error.retryAfter >= 1 && error.retryAfter <= 60);
  } finally { if (old === undefined) delete process.env.FEEDBACK_RATE_LIMIT_SECRET; else process.env.FEEDBACK_RATE_LIMIT_SECRET = old; }
});

test("no acknowledgement escapes a failed intake/outbox transaction, and the connection is released", async () => {
  let rolledBack = false, committed = false, released = false;
  const client = { query: async (sql: string) => {
    if (sql === "ROLLBACK") rolledBack = true;
    if (sql === "COMMIT") committed = true;
    if (sql.includes("INSERT INTO feedback_submissions")) return { rowCount: 1, rows: [{ id: key }] };
    if (sql.includes("INSERT INTO feedback_outbox")) throw new Error("Test database write interruption");
    return { rowCount: 0, rows: [] };
  }, release: () => { released = true; } };
  await assert.rejects(saveFeedback(parseFeedback(input), { connect: async () => client } as unknown as Pool));
  assert.equal(rolledBack, true); assert.equal(committed, false); assert.equal(released, true);
});

test("same-key/same-payload retry returns the original receipt; a changed payload cannot reuse it", async () => {
  const normalized = parseFeedback(input);
  let committed = false, rolledBack = false;
  const client = { query: async (sql: string) => {
    if (sql === "COMMIT") committed = true;
    if (sql === "ROLLBACK") rolledBack = true;
    if (sql.startsWith("SELECT id, payload_hash")) return { rowCount: 1, rows: [{ id: key, payload_hash: payloadHash(normalized) }] };
    return { rowCount: 0, rows: [] };
  }, release: () => {} };
  const db = { connect: async () => client } as unknown as Pool;
  assert.deepEqual(await saveFeedback(normalized, db), { reference: "FB-" + key.toUpperCase() });
  assert.equal(committed, true);
  committed = false;
  await assert.rejects(saveFeedback({ ...normalized, description: "Edited" }, db), FeedbackConflictError);
  assert.equal(committed, false); assert.equal(rolledBack, true);
});
