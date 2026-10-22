export const FEEDBACK_DRAFT_KEY = "bible-compass-feedback-draft";
export const FEEDBACK_DRAFT_TTL_MS = 2 * 60 * 60 * 1000;

export type FeedbackDraft = {
  version: 1;
  expiresAt: number;
  originPath: string;
  category: "bug" | "improvement";
  description: string;
  reproduction: string;
  expected: string;
  replyEmail: string;
  includePage: boolean;
  idempotencyKey: string;
  attemptedPayload: string | null;
};

let reloadUnsafe = false;
let memoryDraft: FeedbackDraft | null = null;
let memoryDraftPersisted = false;
export function setFeedbackReloadUnsafe(value: boolean): void { reloadUnsafe = value; }
export function feedbackReloadSafe(now = Date.now()): boolean {
  return !reloadUnsafe && (!memoryDraft || !hasFeedbackDraft(memoryDraft)
    || memoryDraftPersisted && memoryDraft.expiresAt >= now);
}
export function rememberFeedbackDraft(value: FeedbackDraft | null, persisted = false): void {
  memoryDraft = value;
  memoryDraftPersisted = value !== null && persisted;
}
export function recalledFeedbackDraft(now = Date.now()): FeedbackDraft | null {
  if (memoryDraft && memoryDraft.expiresAt >= now) return memoryDraft;
  memoryDraft = null;
  memoryDraftPersisted = false;
  return null;
}

/** Only internal reader paths; never preserve query strings, fragments or arbitrary return URLs. */
export function feedbackOrigin(value: unknown): string {
  if (typeof value !== "string" || value.length > 512 || !/^\/[A-Za-z0-9/_-]*$/.test(value)
    || value.startsWith("//") || /^\/(?:api|feedback)(?:\/|$)/.test(value)) return "/";
  return value;
}

export function emptyFeedbackDraft(originPath: string, idempotencyKey: string, now = Date.now()): FeedbackDraft {
  return { version: 1, expiresAt: now + FEEDBACK_DRAFT_TTL_MS, originPath: feedbackOrigin(originPath),
    category: "bug", description: "", reproduction: "", expected: "", replyEmail: "", includePage: false,
    idempotencyKey, attemptedPayload: null };
}

export function hasFeedbackDraft(draft: FeedbackDraft): boolean {
  return Boolean(draft.description || draft.reproduction || draft.expected || draft.replyEmail || draft.includePage || draft.attemptedPayload);
}

export function loadFeedbackDraft(storage: Pick<Storage, "getItem" | "removeItem">, now = Date.now()): FeedbackDraft | null {
  try {
    const text = storage.getItem(FEEDBACK_DRAFT_KEY);
    if (!text) return null;
    if (text.length > 80_000) throw new Error("Draft too large");
    const draft: unknown = JSON.parse(text);
    if (!draft || typeof draft !== "object") throw new Error("Invalid draft");
    const value = draft as Partial<FeedbackDraft>;
    if (value.version !== 1 || typeof value.expiresAt !== "number" || value.expiresAt < now
      || value.expiresAt > now + FEEDBACK_DRAFT_TTL_MS || value.originPath !== feedbackOrigin(value.originPath)
      || !["bug", "improvement"].includes(value.category ?? "") || typeof value.includePage !== "boolean"
      || typeof value.idempotencyKey !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.idempotencyKey)
      || ![[value.description, 5000], [value.reproduction, 3000], [value.expected, 2000], [value.replyEmail, 254]].every(([text, max]) => typeof text === "string" && text.length <= Number(max))
      || !(value.attemptedPayload === null || typeof value.attemptedPayload === "string" && value.attemptedPayload.length <= 30_000)) throw new Error("Invalid draft");
    return value as FeedbackDraft;
  } catch {
    try { storage.removeItem(FEEDBACK_DRAFT_KEY); } catch { /* Storage may be blocked. */ }
    return null;
  }
}

export function saveFeedbackDraft(storage: Pick<Storage, "setItem" | "removeItem">, draft: FeedbackDraft, now = Date.now()): boolean {
  try {
    if (!hasFeedbackDraft(draft)) storage.removeItem(FEEDBACK_DRAFT_KEY);
    else storage.setItem(FEEDBACK_DRAFT_KEY, JSON.stringify({ ...draft, expiresAt: now + FEEDBACK_DRAFT_TTL_MS }));
    return true;
  } catch { return false; }
}

/** Normalised fields define retry identity; hidden bug details are not sent for suggestions. */
export function feedbackPayload(draft: FeedbackDraft, clientCommit: string | null) {
  const clean = (text: string) => text.replace(/\r\n?/g, "\n").trim();
  return {
    category: draft.category,
    description: clean(draft.description),
    ...(draft.category === "bug" && clean(draft.reproduction) ? { reproduction: clean(draft.reproduction) } : {}),
    ...(draft.category === "bug" && clean(draft.expected) ? { expected: clean(draft.expected) } : {}),
    ...(draft.replyEmail.trim() ? { replyEmail: draft.replyEmail.trim() } : {}),
    ...(draft.includePage ? { pathname: draft.originPath } : {}),
    ...(clientCommit && /^[a-f0-9]{40}$/i.test(clientCommit) ? { clientCommit } : {}),
  };
}

export function prepareFeedbackAttempt(draft: FeedbackDraft, clientCommit: string | null, makeKey: () => string): FeedbackDraft {
  const payload = JSON.stringify(feedbackPayload(draft, clientCommit));
  // An app update must not turn an unchanged, unacknowledged submission into a
  // second message just because the receiving page now has a newer build ID.
  if (draft.attemptedPayload !== null) {
    try {
      const previous: unknown = JSON.parse(draft.attemptedPayload);
      if (previous && typeof previous === "object" && !Array.isArray(previous)) {
        const withoutBuild = (value: Record<string, unknown>) => JSON.stringify(Object.entries(value).filter(([key]) => key !== "clientCommit").sort(([a], [b]) => a.localeCompare(b)));
        if (withoutBuild(previous as Record<string, unknown>) === withoutBuild(feedbackPayload(draft, clientCommit))) return draft;
      }
    } catch { /* Replace a malformed local attempt with the validated form fields. */ }
  }
  return { ...draft, idempotencyKey: draft.attemptedPayload !== null && draft.attemptedPayload !== payload ? makeKey() : draft.idempotencyKey,
    attemptedPayload: payload };
}
