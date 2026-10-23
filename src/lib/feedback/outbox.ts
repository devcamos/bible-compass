import { randomUUID } from "node:crypto";
import { feedbackDatabase } from "./db";
import { deliverFeedbackToNotion, feedbackNotionConfig, NotionDeliveryError, type FeedbackForTriage } from "./notion";

export const MAX_DELIVERY_ATTEMPTS = 8;
type Claim = FeedbackForTriage & { outbox_id: string; lease_token: string; attempt_count: number };
type Result = { claimed: number; delivered: number; deferred: number; failed: number; stale: number };
export interface OutboxStore {
  claim(): Promise<Claim | null>;
  delivered(claim: Claim, pageId: string): Promise<boolean>;
  failed(claim: Claim, error: NotionDeliveryError, delaySeconds: number): Promise<boolean>;
}

/** Keep retry-after and exponential backoff bounded; jitter reduces synchronized retries. */
export function deliveryBackoff(attempt: number, retryAfterSeconds = 0, random = Math.random()): number {
  const exponential = Math.min(21_600, 60 * 2 ** Math.max(0, Math.min(8, attempt - 1)));
  return Math.min(86_400, Math.max(Math.ceil(exponential * (1 + Math.max(0, Math.min(1, random)) * 0.2)), retryAfterSeconds));
}

export function postgresOutboxStore(): OutboxStore {
  const db = feedbackDatabase();
  return {
    async claim() {
      // An exhausted final attempt can crash before completion. Release it to a visible failed state.
      await db.query(`WITH exhausted AS (
        SELECT id, lease_token FROM feedback_outbox
        WHERE state = 'processing' AND lease_until <= now() AND attempt_count >= $1
        ORDER BY lease_until LIMIT 100 FOR UPDATE SKIP LOCKED
      ) UPDATE feedback_outbox o SET state = 'failed', lease_until = NULL, lease_token = NULL,
        last_error_code = 'attempts_exhausted'
        FROM exhausted e WHERE o.id = e.id AND o.lease_token = e.lease_token`, [MAX_DELIVERY_ATTEMPTS]);
      const result = await db.query<Claim>(`WITH candidate AS (
        SELECT id FROM feedback_outbox
        WHERE attempt_count < $1 AND ((state = 'pending' AND next_attempt_at <= now())
          OR (state = 'processing' AND lease_until <= now()))
        ORDER BY next_attempt_at LIMIT 1 FOR UPDATE SKIP LOCKED
      ), claimed AS (
        UPDATE feedback_outbox o SET state = 'processing', attempt_count = attempt_count + 1,
          lease_until = now() + interval '5 minutes', lease_token = $2
        FROM candidate c WHERE o.id = c.id
        RETURNING o.id AS outbox_id, o.feedback_id, o.lease_token, o.attempt_count
      ) SELECT c.outbox_id, c.lease_token, c.attempt_count, s.id, s.category, s.description,
        s.reproduction, s.expected, s.pathname, s.client_commit, s.server_commit, s.created_at
        FROM claimed c JOIN feedback_submissions s ON s.id = c.feedback_id`, [MAX_DELIVERY_ATTEMPTS, randomUUID()]);
      return result.rows[0] ?? null;
    },
    async delivered(claim, pageId) {
      const result = await db.query(`UPDATE feedback_outbox SET state = 'delivered', notion_page_id = $3,
        delivered_at = now(), lease_until = NULL, lease_token = NULL, last_error_code = NULL
        WHERE id = $1 AND lease_token = $2 AND state = 'processing'`, [claim.outbox_id, claim.lease_token, pageId]);
      return result.rowCount === 1;
    },
    async failed(claim, error, delaySeconds) {
      const terminal = !error.retryable || claim.attempt_count >= MAX_DELIVERY_ATTEMPTS;
      const result = await db.query(`UPDATE feedback_outbox SET state = $3,
        next_attempt_at = now() + $4::integer * interval '1 second',
        lease_until = NULL, lease_token = NULL, last_error_code = $5
        WHERE id = $1 AND lease_token = $2 AND state = 'processing'`,
      [claim.outbox_id, claim.lease_token, terminal ? "failed" : "pending", delaySeconds, error.code]);
      return result.rowCount === 1;
    },
  };
}

export async function processFeedbackOutbox(options: {
  store?: OutboxStore;
  deliver?: (row: FeedbackForTriage) => Promise<string>;
  now?: () => number;
  random?: () => number;
} = {}): Promise<Result> {
  // Check credentials before constructing a pool or claiming anything. Intake remains independent.
  const config = feedbackNotionConfig();
  if (!options.deliver && !config) throw new Error("Feedback triage not configured");
  const store = options.store ?? postgresOutboxStore();
  const deliver = options.deliver ?? (row => deliverFeedbackToNotion(row, config!));
  const now = options.now ?? Date.now;
  const started = now();
  const result: Result = { claimed: 0, delivered: 0, deferred: 0, failed: 0, stale: 0 };
  // Three sequential claims bound provider calls; do not pre-lease work the run may not reach.
  for (let index = 0; index < 3 && now() - started < 40_000; index++) {
    const claim = await store.claim();
    if (!claim) break;
    result.claimed++;
    try {
      const pageId = await deliver(claim);
      if (await store.delivered(claim, pageId)) result.delivered++;
      else result.stale++;
    } catch (error) {
      const deliveryError = error instanceof NotionDeliveryError ? error : new NotionDeliveryError("notion_unavailable");
      const delay = deliveryBackoff(claim.attempt_count, deliveryError.retryAfterSeconds, options.random?.());
      if (!await store.failed(claim, deliveryError, delay)) result.stale++;
      else if (!deliveryError.retryable || claim.attempt_count >= MAX_DELIVERY_ATTEMPTS) result.failed++;
      else result.deferred++;
      // A rate limit or credential/configuration error affects the destination; stop this batch.
      if (deliveryError.code === "notion_http_429" || !deliveryError.retryable) break;
    }
  }
  return result;
}
