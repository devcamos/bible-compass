import { afterEach, describe, expect, it } from "vitest";
import { FeedbackInputError, parseFeedback, parseRating, payloadHash, ratingTokenHash, receivingCommit, sanitizeFeedbackPath } from "../../src/lib/feedback/validation";

const key = "123e4567-e89b-42d3-a456-426614174000";
const base = { idempotencyKey: key, category: "bug", description: " Broken\r\n " };

describe("parseFeedback", () => {
  it("normalises a bug report", () => {
    const out = parseFeedback({ ...base, idempotencyKey: key.toUpperCase(), reproduction: "steps", expected: "works", replyEmail: "a@b.co", pathname: "/topics/x?y=1", clientCommit: "A".repeat(40) });
    expect(out).toEqual({ idempotencyKey: key, category: "bug", description: "Broken", reproduction: "steps", expected: "works", replyEmail: "a@b.co", pathname: "/topics/x", clientCommit: "a".repeat(40) });
  });
  it("drops bug-only fields for improvements", () => {
    const out = parseFeedback({ ...base, category: "improvement", reproduction: "r", expected: "e" });
    expect(out.reproduction).toBeNull(); expect(out.expected).toBeNull(); expect(out.clientCommit).toBeNull();
  });
  it.each([
    [null], [[]], ["x"], [{ ...base, extra: 1 }], [{ ...base, idempotencyKey: "nope" }], [{ ...base, idempotencyKey: 1 }],
    [{ ...base, category: "other" }], [{ ...base, description: "" }], [{ ...base, description: "   " }],
    [{ ...base, description: 5 }], [{ ...base, description: "x".repeat(5001) }], [{ ...base, description: "a\u0001" }],
    [{ ...base, replyEmail: "bad" }], [{ ...base, clientCommit: "abc" }], [{ ...base, pathname: "nope" }],
  ])("rejects %j", input => { expect(() => parseFeedback(input)).toThrow(FeedbackInputError); });
});

describe("sanitizeFeedbackPath", () => {
  it("accepts empties", () => { expect(sanitizeFeedbackPath(undefined)).toBeNull(); expect(sanitizeFeedbackPath(null)).toBeNull(); expect(sanitizeFeedbackPath("")).toBeNull(); });
  it.each([1, "//evil", "/a b", "/a\\b", "/" + "a".repeat(600)])("rejects %j", v => { expect(() => sanitizeFeedbackPath(v)).toThrow(FeedbackInputError); });
  it("rejects a pathname that normalises to protocol-relative", () => { expect(() => sanitizeFeedbackPath("/.//evil")).toThrow(FeedbackInputError); });
});

describe("hashes and ratings", () => {
  it("hash is stable and ignores the idempotency key", () => {
    const a = parseFeedback(base); const b = parseFeedback({ ...base, idempotencyKey: "223e4567-e89b-42d3-a456-426614174000" });
    expect(payloadHash(a)).toBe(payloadHash(b)); expect(ratingTokenHash("t")).toHaveLength(64);
  });
  it("parses a rating", () => { expect(parseRating({ stars: 5, token: "a".repeat(43), revision: 2 })).toEqual({ stars: 5, token: "a".repeat(43), revision: 2 }); });
  it.each([{ stars: 0, token: "a".repeat(43), revision: 1 }, { stars: 6, token: "a".repeat(43), revision: 1 }, { stars: 1.5, token: "a".repeat(43), revision: 1 }, { stars: 3, token: 1, revision: 1 }, { stars: 3, token: "short", revision: 1 }, { stars: 3, token: "a".repeat(43), revision: 0 }, { stars: 3, token: "a".repeat(43), revision: "1" }])("rejects rating %j", r => { expect(() => parseRating(r)).toThrow(FeedbackInputError); });
});

describe("receivingCommit", () => {
  afterEach(() => { delete process.env.VERCEL_GIT_COMMIT_SHA; });
  it("reads a valid sha", () => { process.env.VERCEL_GIT_COMMIT_SHA = "B".repeat(40); expect(receivingCommit()).toBe("b".repeat(40)); });
  it("ignores invalid or missing", () => { expect(receivingCommit()).toBeNull(); process.env.VERCEL_GIT_COMMIT_SHA = "x"; expect(receivingCommit()).toBeNull(); });
});
