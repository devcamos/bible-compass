import assert from "node:assert/strict";
import { test } from "node:test";
import {
  emptyFeedbackDraft, feedbackOrigin, feedbackPayload, FEEDBACK_DRAFT_KEY, FEEDBACK_DRAFT_TTL_MS,
  feedbackReloadSafe, loadFeedbackDraft, prepareFeedbackAttempt, rememberFeedbackDraft, saveFeedbackDraft, setFeedbackReloadUnsafe,
} from "../src/lib/feedback/client-draft";
import { parseAppRatingSummary, retryAfterAt, randomRatingToken } from "../src/lib/feedback/client-request";
import { APP_RATING_KEY, loadOwnAppRating, prepareOwnRatingCommand, prepareStoredRatingCommand, recalledOwnAppRating, saveOwnAppRating, withRatingIdentityLock } from "../src/lib/feedback/client-rating";

const key = "6dbf653f-c730-4ed6-9464-5d67edc01d33";
const nextKey = "0eb25f60-b275-45d1-b385-05bbebd9b774";
const commitA = "a".repeat(40), commitB = "b".repeat(40);

function storage() {
  const values = new Map<string, string>();
  return { getItem: (name: string) => values.get(name) ?? null, setItem: (name: string, value: string) => { values.set(name, value); }, removeItem: (name: string) => { values.delete(name); } };
}

test("feedback origin cannot become an external return URL or collect query/fragment data", () => {
  assert.equal(feedbackOrigin("/psalms/trust-and-refuge"), "/psalms/trust-and-refuge");
  for (const path of ["//other.example", "https://other.example", "/\\other.example", "/?email=private", "/topics/trust#private", "/api/feedback", "/feedback", "/%2f%2fother.example", "\n/", " ", null]) assert.equal(feedbackOrigin(path), "/");
});

test("same-tab draft expires, malformed storage is removed, and blocked storage never claims persistence", () => {
  const store = storage(), now = 1_000_000;
  const draft = { ...emptyFeedbackDraft("/proverbs", key, now), description: "Keep my place.", replyEmail: "reader@example.test" };
  assert.equal(saveFeedbackDraft(store, draft, now), true);
  assert.deepEqual(loadFeedbackDraft(store, now + 1), draft);
  assert.equal(loadFeedbackDraft(store, now + FEEDBACK_DRAFT_TTL_MS + 1), null);
  assert.equal(store.getItem(FEEDBACK_DRAFT_KEY), null);
  store.setItem(FEEDBACK_DRAFT_KEY, JSON.stringify({ ...draft, includePage: "yes" }));
  assert.equal(loadFeedbackDraft(store, now), null);
  assert.equal(store.getItem(FEEDBACK_DRAFT_KEY), null);
  assert.equal(saveFeedbackDraft({ setItem: () => { throw new Error("Blocked"); }, removeItem: () => {} }, draft, now), false);
  setFeedbackReloadUnsafe(true); assert.equal(feedbackReloadSafe(), false);
  setFeedbackReloadUnsafe(false); assert.equal(feedbackReloadSafe(), true);
});

test("unacknowledged feedback retains payload/key across reload or deployment update; edits get a new key", () => {
  const draft = { ...emptyFeedbackDraft("/psalms", key), description: "  My message.\r\nAnother line.  ", includePage: true };
  const first = prepareFeedbackAttempt(draft, commitA, () => nextKey);
  const retry = prepareFeedbackAttempt(first, commitB, () => nextKey);
  assert.equal(first.idempotencyKey, key);
  assert.equal(retry.idempotencyKey, key);
  assert.equal(retry.attemptedPayload, first.attemptedPayload);
  assert.equal(JSON.parse(retry.attemptedPayload!).clientCommit, commitA);
  assert.equal(JSON.parse(retry.attemptedPayload!).description, "My message.\nAnother line.");
  const edited = prepareFeedbackAttempt({ ...retry, description: "An updated message." }, commitB, () => nextKey);
  assert.equal(edited.idempotencyKey, nextKey);
  assert.equal(JSON.parse(edited.attemptedPayload!).clientCommit, commitB);
  const suggestion = { ...draft, category: "improvement" as const, reproduction: "Hidden detail", expected: "Hidden expectation", includePage: false, replyEmail: "" };
  assert.deepEqual(feedbackPayload(suggestion, null), { category: "improvement", description: "My message.\nAnother line." });
});

test("automatic update cannot lose an expired visible draft or a memory-only draft after SPA Back", () => {
  const now = 1_000_000;
  const draft = { ...emptyFeedbackDraft("/psalms", key, now), description: "Still editing this." };
  rememberFeedbackDraft(draft, true);
  assert.equal(feedbackReloadSafe(now + 1), true);
  assert.equal(feedbackReloadSafe(now + FEEDBACK_DRAFT_TTL_MS + 1), false);
  // Component cleanup clears its pending-write flag, but cannot discard a draft
  // that is remembered only in this JavaScript tab after Back to reading.
  rememberFeedbackDraft(draft, false);
  setFeedbackReloadUnsafe(true);
  setFeedbackReloadUnsafe(false);
  assert.equal(feedbackReloadSafe(now + 1), false);
  rememberFeedbackDraft(null);
  assert.equal(feedbackReloadSafe(now + 1), true);
});

test("summary validation distinguishes a valid empty result from errors/malformed aggregates", () => {
  const asOf = "2026-10-22T05:00:00.000Z";
  const empty = { average: null, ratingCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, asOf };
  assert.deepEqual(parseAppRatingSummary(empty), empty);
  const full = { average: 4.4, ratingCount: 25, distribution: { 1: 1, 2: 1, 3: 2, 4: 4, 5: 17 }, asOf };
  assert.deepEqual(parseAppRatingSummary(full), full);
  for (const invalid of [null, { error: "Storage failed" }, { ...empty, average: 0 }, { ...full, ratingCount: 26 }, { ...full, average: 6 }, { ...full, asOf: "invalid" }, { ...full, distribution: { 1: 0 } }]) assert.throws(() => parseAppRatingSummary(invalid));
});

test("Retry-After supports seconds and dates, rejects malformed values and bounds a wait", () => {
  const now = Date.parse("2026-10-22T05:00:00.000Z");
  assert.equal(retryAfterAt("30", now), now + 30_000);
  assert.equal(retryAfterAt("Thu, 22 Oct 2026 05:00:40 GMT", now), now + 40_000);
  assert.equal(retryAfterAt("999999", now), now + 86_400_000);
  assert.equal(retryAfterAt("unknown", now), null);
});

test("rating updates preserve the anonymous management token, with truthful memory fallback", () => {
  const token = randomRatingToken();
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  const store = storage();
  store.setItem(APP_RATING_KEY, JSON.stringify({ token, stars: 3 }));
  assert.deepEqual(loadOwnAppRating(store), { token, stars: 3, revision: 0, pending: null, retryStars: null });
  assert.equal(saveOwnAppRating(store, { token, stars: 4, revision: 1, pending: null, retryStars: null }), true);
  assert.deepEqual(loadOwnAppRating(store), { token, stars: 4, revision: 1, pending: null, retryStars: null });
  assert.equal(saveOwnAppRating({ setItem: () => { throw new Error("Blocked"); } }, { token, stars: 5, revision: 2, pending: null, retryStars: null }), false);
  assert.deepEqual(recalledOwnAppRating(), { token, stars: 5, revision: 2, pending: null, retryStars: null });
});

test("lost-ack rating retry preserves command revision and later selection issues a strictly newer command", () => {
  const token = randomRatingToken();
  const initial = { token, stars: 4, revision: 100, pending: null, retryStars: null };
  const first = prepareOwnRatingCommand(initial, 5, 1000);
  assert.deepEqual(first.pending, { stars: 5, revision: 1000 });
  assert.equal(first.stars, 4);
  const retry = prepareOwnRatingCommand(first, 5, 2000);
  assert.deepEqual(retry, first);
  // Reverting to the previously confirmed 4 must supersede an uncertain 5.
  const changed = prepareOwnRatingCommand(first, 4, 999);
  assert.deepEqual(changed.pending, { stars: 4, revision: 1001 });
  assert.equal(changed.token, first.token);
  const afterConflict = prepareOwnRatingCommand({ ...changed, pending: null, retryStars: 4 }, 4, 900);
  assert.equal(afterConflict.pending!.revision, 1002);
  assert.equal(afterConflict.retryStars, null);
});

test("already-open feedback tabs reuse the installation identity persisted by the first tab", () => {
  const shared = storage();
  const firstToken = randomRatingToken();
  let tokenCreations = 0;
  const first = prepareStoredRatingCommand(shared, null, 4, () => { tokenCreations++; return firstToken; }, 1000);
  // The second panel mounted before the first save and still has a null snapshot.
  const second = prepareStoredRatingCommand(shared, null, 5, () => { tokenCreations++; return randomRatingToken(); }, 1001);
  assert.equal(second.identity.token, first.identity.token);
  assert.equal(tokenCreations, 1);
  assert.equal(second.identity.revision, 1001);
  assert.equal(loadOwnAppRating(shared)!.token, firstToken);
  // Another tab's fresher persisted state wins over a stale in-memory token.
  const replacement = { ...second.identity, token: randomRatingToken(), stars: 5, revision: 1002, pending: null };
  shared.setItem(APP_RATING_KEY, JSON.stringify(replacement));
  assert.equal(loadOwnAppRating(shared)!.token, replacement.token);
});

test("simultaneous first saves serialize identity creation, with a safe unsupported-lock fallback", async () => {
  const shared = storage();
  let queue: Promise<unknown> = Promise.resolve();
  const locks = { request: (_name: string, callback: () => unknown) => {
    const result = queue.then(callback); queue = result.catch(() => {}); return result;
  } } as Pick<LockManager, "request">;
  let creations = 0;
  const prepare = (stars: number) => prepareStoredRatingCommand(shared, null, stars, () => { creations++; return randomRatingToken(); }, 1000);
  const [first, second] = await Promise.all([withRatingIdentityLock(locks, () => prepare(4)), withRatingIdentityLock(locks, () => prepare(5))]);
  assert.equal(first.identity.token, second.identity.token);
  assert.equal(creations, 1);
  assert.equal(second.identity.revision, first.identity.revision + 1);
  assert.equal(await withRatingIdentityLock(undefined, () => "fallback"), "fallback");
});
