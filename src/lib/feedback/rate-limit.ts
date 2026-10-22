import { createHmac } from "node:crypto";
import type { Pool } from "pg";
import { feedbackDatabase } from "./db";

type Limit = { bucket: string; limit: number; expiresAt: string; retryAfter: number };
export type FeedbackRateScope = "feedback" | "rating" | "summary";

export class FeedbackRateError extends Error {
  constructor(readonly retryAfter: number) { super("Feedback request limit reached"); }
}

export function feedbackLimits(request: Request, scope: FeedbackRateScope, secret: string, now = Date.now()): Limit[] {
  if (secret.length < 32) throw new Error("Feedback rate limits not configured");
  // Vercel supplies/overwrites x-real-ip; never trust arbitrary forwarded-for chains.
  const ip = process.env.VERCEL ? (request.headers.get("x-real-ip") ?? "unknown") : "local";
  const policies = scope === "feedback" ? [[3600, 10, false], [86400, 50, false], [3600, 1000, true]] :
    scope === "rating" ? [[3600, 30, false], [3600, 2000, true]] : [[60, 120, false], [60, 10000, true]];
  return policies.map(([seconds, limit, global]) => {
    const windowSeconds = Number(seconds);
    const start = Math.floor(now / 1000 / windowSeconds) * windowSeconds;
    const end = start + windowSeconds;
    const bucket = createHmac("sha256", secret).update(`${scope}:${windowSeconds}:${start}:${global ? "global" : ip}`).digest("hex");
    return { bucket, limit: Number(limit), expiresAt: new Date(end * 1000).toISOString(), retryAfter: Math.max(1, Math.ceil(end - now / 1000)) };
  });
}

export async function limitFeedbackRequest(request: Request, scope: FeedbackRateScope, db: Pool = feedbackDatabase()): Promise<void> {
  const limits = feedbackLimits(request, scope, process.env.FEEDBACK_RATE_LIMIT_SECRET ?? "");
  const result = await db.query<{ bucket: string; count: number }>(
    `INSERT INTO feedback_rate_limits (bucket, count, expires_at)
     SELECT item.bucket, 1, item.expires_at FROM jsonb_to_recordset($1::jsonb) AS item(bucket text, expires_at timestamptz) ORDER BY item.bucket
     ON CONFLICT (bucket) DO UPDATE SET count = LEAST(feedback_rate_limits.count + 1, 1000000)
     RETURNING bucket, count`,
    [JSON.stringify(limits.map(limit => ({ bucket: limit.bucket, expires_at: limit.expiresAt })))],
  );
  const exceeded = limits.filter(limit => (result.rows.find(row => row.bucket === limit.bucket)?.count ?? Infinity) > limit.limit);
  if (exceeded.length) throw new FeedbackRateError(Math.max(...exceeded.map(limit => limit.retryAfter)));
}
