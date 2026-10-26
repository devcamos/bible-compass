import { afterEach, describe, expect, it, vi } from "vitest";
import * as D from "../../src/lib/feedback/client-draft";
import * as R from "../../src/lib/feedback/client-rating";
import * as Q from "../../src/lib/feedback/client-request";

const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m }; };
const broken = { getItem: () => { throw new Error(); }, setItem: () => { throw new Error(); }, removeItem: () => { throw new Error(); } };
const key = "123e4567-e89b-42d3-a456-426614174000";
const tok = "a".repeat(43);

describe("client-draft", () => {
  it("origin and empty drafts", () => {
    expect(D.feedbackOrigin("/topics/x")).toBe("/topics/x");
    for (const v of [1, "/api/x", "/feedback", "//x", "/a?b", "x".repeat(600)]) expect(D.feedbackOrigin(v)).toBe("/");
    const d = D.emptyFeedbackDraft("/p", key, 0);
    expect(D.hasFeedbackDraft(d)).toBe(false); expect(D.hasFeedbackDraft({ ...d, includePage: true })).toBe(true);
  });
  it("memory and reload safety", () => {
    const d = { ...D.emptyFeedbackDraft("/", key, 0), description: "x" };
    D.rememberFeedbackDraft(null); expect(D.feedbackReloadSafe()).toBe(true);
    D.rememberFeedbackDraft(d); expect(D.feedbackReloadSafe(0)).toBe(false);
    D.rememberFeedbackDraft(d, true); expect(D.feedbackReloadSafe(0)).toBe(true);
    D.setFeedbackReloadUnsafe(true); expect(D.feedbackReloadSafe(0)).toBe(false); D.setFeedbackReloadUnsafe(false);
    expect(D.recalledFeedbackDraft(0)).toBe(d); expect(D.recalledFeedbackDraft(d.expiresAt + 1)).toBeNull();
  });
  it("loads and saves drafts", () => {
    const s = mem(); const now = 1000;
    const d = { ...D.emptyFeedbackDraft("/", key, now), description: "x" };
    expect(D.loadFeedbackDraft(s, now)).toBeNull();
    expect(D.saveFeedbackDraft(s, d, now)).toBe(true);
    expect(D.loadFeedbackDraft(s, now)?.description).toBe("x");
    expect(D.saveFeedbackDraft(s, { ...d, description: "" }, now)).toBe(true); expect(s.m.size).toBe(0);
    expect(D.saveFeedbackDraft(broken, d)).toBe(false);
    for (const bad of ["x".repeat(80_001), "null", "{bad", JSON.stringify({ ...d, version: 2 }), JSON.stringify({ ...d, attemptedPayload: 1 }), JSON.stringify({ ...d, description: 1 })]) {
      s.setItem(D.FEEDBACK_DRAFT_KEY, bad); expect(D.loadFeedbackDraft(s, now)).toBeNull();
    }
    expect(D.loadFeedbackDraft(broken)).toBeNull();
  });
  it("builds payloads and attempts", () => {
    const d = { ...D.emptyFeedbackDraft("/p", key), description: " a\r\n", reproduction: "r", expected: "e", replyEmail: " x@y.z ", includePage: true };
    expect(D.feedbackPayload(d, "a".repeat(40))).toEqual({ category: "bug", description: "a", reproduction: "r", expected: "e", replyEmail: "x@y.z", pathname: "/p", clientCommit: "a".repeat(40) });
    expect(D.feedbackPayload({ ...d, category: "improvement", replyEmail: "", includePage: false }, "bad")).toEqual({ category: "improvement", description: "a" });
    const first = D.prepareFeedbackAttempt(d, null, () => "new");
    expect(first.idempotencyKey).toBe(key);
    expect(D.prepareFeedbackAttempt(first, "b".repeat(40), () => "new")).toBe(first);
    expect(D.prepareFeedbackAttempt({ ...first, description: "z" }, null, () => "new").idempotencyKey).toBe("new");
    expect(D.prepareFeedbackAttempt({ ...first, attemptedPayload: "{bad" }, null, () => "new").idempotencyKey).toBe("new");
    expect(D.prepareFeedbackAttempt({ ...first, attemptedPayload: "[]" }, null, () => "new").idempotencyKey).toBe("new");
  });
});

describe("client-rating", () => {
  const base = { token: tok, stars: 3, revision: 2, pending: null, retryStars: null };
  it("validates stored ratings", () => {
    const s = mem();
    expect(R.saveOwnAppRating(s, base)).toBe(true);
    expect(R.loadOwnAppRating(s)).toEqual(base);
    for (const bad of ["x".repeat(501), "1", "{bad", JSON.stringify({ ...base, token: "x" }), JSON.stringify({ ...base, stars: 9 }), JSON.stringify({ ...base, revision: -1 }),
      JSON.stringify({ ...base, pending: { stars: 9, revision: 2 } }), JSON.stringify({ ...base, pending: { stars: 3, revision: 1 } }), JSON.stringify({ ...base, retryStars: 9 })]) {
      s.setItem(R.APP_RATING_KEY, bad); expect(R.loadOwnAppRating(s)).toEqual(base);
    }
    s.setItem(R.APP_RATING_KEY, JSON.stringify({ token: tok, stars: null })); expect(R.loadOwnAppRating(s)).toEqual(base);
    s.setItem(R.APP_RATING_KEY, JSON.stringify({ token: "b".repeat(43), stars: null })); expect(R.loadOwnAppRating(s)?.revision).toBe(0);
    s.setItem(R.APP_RATING_KEY, JSON.stringify({ ...base, pending: { stars: 2, revision: 2 }, retryStars: 4 })); expect(R.loadOwnAppRating(s)?.retryStars).toBe(4);
    R.rememberOwnAppRating(base); expect(R.recalledOwnAppRating()).toBe(base);
    expect(R.saveOwnAppRating(broken, base)).toBe(false);
  });
  it("prepares commands", () => {
    expect(() => R.prepareOwnRatingCommand(base, 0)).toThrow();
    expect(() => R.prepareOwnRatingCommand({ ...base, revision: Number.MAX_SAFE_INTEGER }, 2, 0)).toThrow();
    const p = R.prepareOwnRatingCommand(base, 4, 10);
    expect(p.pending).toEqual({ stars: 4, revision: 10 }); expect(R.prepareOwnRatingCommand(p, 4)).toBe(p);
    const s = mem();
    expect(R.prepareStoredRatingCommand(s, null, 5, () => tok, 1).identity.token).toBe(tok);
    expect(R.prepareStoredRatingCommand(s, { ...base, revision: 99 }, 2, () => "x", 1).identity.revision).toBe(100);
    expect(R.prepareStoredRatingCommand({ getItem: broken.getItem, setItem: s.setItem }, base, 1, () => tok, 1).persisted).toBe(true);
  });
  it("locks identity creation", async () => {
    expect(await R.withRatingIdentityLock(undefined, () => 1)).toBe(1);
    expect(await R.withRatingIdentityLock({ request: (async (_n: string, cb: () => unknown) => cb()) as never }, () => 2)).toBe(2);
    expect(await R.withRatingIdentityLock({ request: (async () => { throw new Error(); }) as never }, () => 3)).toBe(3);
    await expect(R.withRatingIdentityLock({ request: (async (_n: string, cb: () => unknown) => cb()) as never }, () => { throw new Error("boom"); })).rejects.toThrow("boom");
  });
});

describe("client-request", () => {
  afterEach(() => vi.restoreAllMocks());
  it("parses retry-after", () => {
    expect(Q.retryAfterAt(null)).toBeNull(); expect(Q.retryAfterAt("2", 0)).toBe(2000);
    expect(Q.retryAfterAt("nope", 0)).toBeNull(); expect(Q.retryAfterAt(new Date(1e12).toUTCString(), 0)).toBe(86_400_000);
  });
  it("fetches with bounds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({ ok: 1 })).mockResolvedValueOnce(new Response("", { status: 429, headers: { "retry-after": "1" } })).mockResolvedValueOnce(new Response("", { status: 500 }));
    const c = new AbortController();
    expect(await Q.feedbackRequest("/x", {}, c.signal)).toEqual({ ok: 1 });
    await expect(Q.feedbackRequest("/x")).rejects.toMatchObject({ status: 429 });
    const aborted = new AbortController(); aborted.abort();
    await expect(Q.feedbackRequest("/x", undefined, aborted.signal)).rejects.toMatchObject({ status: 500, retryAt: null });
  });
  it("validates summaries", () => {
    const ok = { average: 4, ratingCount: 1, distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 0 }, asOf: "2026-01-01T00:00:00Z" };
    expect(Q.parseAppRatingSummary(ok).ratingCount).toBe(1);
    expect(Q.parseAppRatingSummary({ ...ok, average: null, ratingCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }).average).toBeNull();
    for (const bad of [null, { ...ok, ratingCount: -1 }, { ...ok, distribution: { ...ok.distribution, 1: -1 } }, { ...ok, ratingCount: 2 }, { ...ok, average: 9 }, { ...ok, asOf: "x" }]) expect(() => Q.parseAppRatingSummary(bad)).toThrow();
    expect(Q.randomRatingToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});
