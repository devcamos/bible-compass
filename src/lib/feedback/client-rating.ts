export const APP_RATING_KEY = "bible-compass-app-rating";
export type RatingCommand = { stars: number; revision: number };
export type OwnAppRating = { token: string; stars: number | null; revision: number; pending: RatingCommand | null; retryStars: number | null };
let memoryRating: OwnAppRating | null = null;

export function loadOwnAppRating(storage: Pick<Storage, "getItem">): OwnAppRating | null {
  if (memoryRating) return memoryRating;
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
    memoryRating = { token: rating.token, stars: rating.stars as number | null, revision, pending, retryStars };
    return memoryRating;
  } catch { return null; }
}

export function rememberOwnAppRating(value: OwnAppRating): void { memoryRating = value; }

export function saveOwnAppRating(storage: Pick<Storage, "setItem">, value: OwnAppRating): boolean {
  memoryRating = value;
  try { storage.setItem(APP_RATING_KEY, JSON.stringify(value)); return true; }
  catch { return false; }
}

export function recalledOwnAppRating(): OwnAppRating | null { return memoryRating; }

/** Persist before dispatch: replay an uncertain command, order later user choices. */
export function prepareOwnRatingCommand(identity: OwnAppRating, stars: number, now = Date.now()): OwnAppRating {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new Error("Invalid rating");
  if (identity.pending?.stars === stars) return identity;
  const revision = Math.max(1, Math.floor(now), identity.revision + 1);
  if (!Number.isSafeInteger(revision)) throw new Error("Rating sequence exhausted");
  return { ...identity, revision, pending: { stars, revision }, retryStars: null };
}
