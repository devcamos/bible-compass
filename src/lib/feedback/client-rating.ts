export const APP_RATING_KEY = "bible-compass-app-rating";
export type RatingCommand = { stars: number; revision: number };
export type OwnAppRating = { token: string; stars: number | null; revision: number; pending: RatingCommand | null; retryStars: number | null };
let memoryRating: OwnAppRating | null = null;

function readStoredRating(storage: Pick<Storage, "getItem">): OwnAppRating | null {
  const raw = storage.getItem(APP_RATING_KEY);
  if (!raw || raw.length > 500) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const rating = value as Partial<OwnAppRating>;
    if (typeof rating.token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(rating.token)
      || !(rating.stars === null || Number.isInteger(rating.stars) && Number(rating.stars) >= 1 && Number(rating.stars) <= 5)) return null;
    const revision = rating.revision ?? 0;
    if (!Number.isSafeInteger(revision) || revision < 0) return null;
    const pending = rating.pending ?? null;
    if (pending !== null && (typeof pending !== "object" || !Number.isInteger(pending.stars) || pending.stars < 1 || pending.stars > 5
      || !Number.isSafeInteger(pending.revision) || pending.revision < 1 || pending.revision !== revision)) return null;
    const retryStars = rating.retryStars ?? null;
    if (retryStars !== null && (!Number.isInteger(retryStars) || retryStars < 1 || retryStars > 5)) return null;
    return { token: rating.token, stars: rating.stars as number | null, revision, pending, retryStars };
  } catch { return null; }
}

export function loadOwnAppRating(storage: Pick<Storage, "getItem">): OwnAppRating | null {
  const stored = readStoredRating(storage);
  if (stored && (!memoryRating || stored.token !== memoryRating.token || stored.revision >= memoryRating.revision)) memoryRating = stored;
  return memoryRating;
}

export function rememberOwnAppRating(value: OwnAppRating): void { memoryRating = value; }

export function saveOwnAppRating(storage: Pick<Storage, "setItem">, value: OwnAppRating): boolean {
  memoryRating = value;
  try { storage.setItem(APP_RATING_KEY, JSON.stringify(value)); return true; }
  catch { return false; }
}

export function recalledOwnAppRating(): OwnAppRating | null { return memoryRating; }

/** Re-read shared identity at dispatch time, rather than trusting a tab's mount snapshot. */
export function prepareStoredRatingCommand(storage: Pick<Storage, "getItem" | "setItem">, cached: OwnAppRating | null,
  stars: number, createToken: () => string, now = Date.now()): { identity: OwnAppRating; persisted: boolean } {
  let stored: OwnAppRating | null = null;
  try { stored = readStoredRating(storage); } catch { /* Blocked storage keeps the current tab's identity. */ }
  const latest = stored && !(cached && cached.token === stored.token && cached.revision > stored.revision) ? stored : cached;
  const identity = prepareOwnRatingCommand(latest ?? { token: createToken(), stars: null, revision: 0, pending: null, retryStars: null }, stars, now);
  return { identity, persisted: saveOwnAppRating(storage, identity) };
}

/** Serialize first-token persistence across tabs where Web Locks is available. */
export async function withRatingIdentityLock<T>(locks: Pick<LockManager, "request"> | undefined, prepare: () => T): Promise<T> {
  if (!locks) return prepare();
  let entered = false;
  try { return await locks.request(APP_RATING_KEY, () => { entered = true; return prepare(); }); }
  catch (error) { if (entered) throw error; return prepare(); }
}

/** Persist before dispatch: replay an uncertain command, order later user choices. */
export function prepareOwnRatingCommand(identity: OwnAppRating, stars: number, now = Date.now()): OwnAppRating {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new Error("Invalid rating");
  if (identity.pending?.stars === stars) return identity;
  const revision = Math.max(1, Math.floor(now), identity.revision + 1);
  if (!Number.isSafeInteger(revision)) throw new Error("Rating sequence exhausted");
  return { ...identity, revision, pending: { stars, revision }, retryStars: null };
}
