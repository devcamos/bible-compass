export const FEEDBACK_REQUEST_TIMEOUT_MS = 15_000;

export class FeedbackRequestError extends Error {
  constructor(public status: number, public retryAt: number | null = null) { super("Request failed"); }
}

export function retryAfterAt(value: string | null, now = Date.now()): number | null {
  if (!value) return null;
  const numeric = /^\d+$/.test(value) ? now + Number(value) * 1000 : Date.parse(value);
  return Number.isFinite(numeric) ? Math.min(now + 86_400_000, Math.max(now, numeric)) : null;
}

/** Same-origin, bounded, explicitly requested transport. No polling or automatic retries. */
export async function feedbackRequest(url: string, init: RequestInit = {}, externalSignal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (externalSignal?.aborted) abort();
  externalSignal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, FEEDBACK_REQUEST_TIMEOUT_MS);
  try {
    const result = await fetch(url, { ...init, credentials: "same-origin", cache: "no-store", redirect: "error", signal: controller.signal });
    if (!result.ok) throw new FeedbackRequestError(result.status, result.status === 429 ? retryAfterAt(result.headers.get("retry-after")) : null);
    return await result.json();
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", abort);
  }
}

export type AppRatingSummary = { average: number | null; ratingCount: number; distribution: Record<string, number>; asOf: string };

/** Reject malformed summaries rather than interpreting failure as an empty rating set. */
export function parseAppRatingSummary(input: unknown): AppRatingSummary {
  if (!input || typeof input !== "object") throw new Error("Invalid summary");
  const value = input as Partial<AppRatingSummary>;
  if (!Number.isSafeInteger(value.ratingCount) || Number(value.ratingCount) < 0 || !value.distribution || typeof value.distribution !== "object"
    || typeof value.asOf !== "string" || !Number.isFinite(Date.parse(value.asOf))) throw new Error("Invalid summary");
  const distribution: Record<string, number> = {};
  for (const stars of [1, 2, 3, 4, 5]) {
    const count = value.distribution[stars];
    if (!Number.isSafeInteger(count) || count < 0) throw new Error("Invalid summary");
    distribution[stars] = count;
  }
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  if (total !== value.ratingCount || (total === 0 ? value.average !== null : typeof value.average !== "number" || !Number.isFinite(value.average) || value.average < 1 || value.average > 5)) throw new Error("Invalid summary");
  return { average: value.average as number | null, ratingCount: total, distribution, asOf: value.asOf };
}

export function randomRatingToken(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
