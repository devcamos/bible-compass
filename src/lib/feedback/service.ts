import type { Pool } from "pg";
import { feedbackDatabase } from "./db";
import { payloadHash, ratingTokenHash, receivingCommit } from "./validation";
import type { FeedbackInput, RatingInput, RatingSummary } from "./types";

export class FeedbackConflictError extends Error {}
export class RatingConflictError extends Error {}

export async function saveFeedback(input: FeedbackInput, db: Pool = feedbackDatabase()): Promise<{ reference: string }> {
  const client = await db.connect();
  let broken = false;
  try {
    await client.query("BEGIN");
    const digest = payloadHash(input);
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO feedback_submissions (idempotency_key, payload_hash, category, description, reproduction, expected, pathname, client_commit, server_commit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (idempotency_key) DO NOTHING RETURNING id`,
      [input.idempotencyKey, digest, input.category, input.description, input.reproduction, input.expected, input.pathname, input.clientCommit, receivingCommit()],
    );
    let id: string;
    if (inserted.rowCount) {
      id = inserted.rows[0].id;
      if (input.replyEmail) await client.query("INSERT INTO feedback_contacts (feedback_id, reply_email) VALUES ($1,$2)", [id, input.replyEmail]);
      await client.query("INSERT INTO feedback_outbox (feedback_id) VALUES ($1)", [id]);
    } else {
      // A concurrent unique-key inserter has committed before this statement's fresh snapshot.
      const existing = await client.query<{ id: string; payload_hash: string }>("SELECT id, payload_hash FROM feedback_submissions WHERE idempotency_key=$1", [input.idempotencyKey]);
      if (!existing.rowCount || existing.rows[0].payload_hash !== digest) throw new FeedbackConflictError("Submission key already used for different feedback");
      id = existing.rows[0].id;
    }
    await client.query("COMMIT");
    return { reference: "FB-" + id.toUpperCase() };
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch { broken = true; }
    throw error;
  } finally { client.release(broken); }
}

export async function saveRating(input: RatingInput, db: Pool = feedbackDatabase()): Promise<{ stars: number; revision: number }> {
  const result = await db.query<{ stars: number; revision: string }>(
    `INSERT INTO app_ratings (token_hash, stars, revision) VALUES ($1,$2,$3)
     ON CONFLICT (token_hash) DO UPDATE SET stars=EXCLUDED.stars, revision=EXCLUDED.revision,
       updated_at=CASE WHEN app_ratings.revision=EXCLUDED.revision THEN app_ratings.updated_at ELSE now() END
     WHERE app_ratings.revision < EXCLUDED.revision
       OR (app_ratings.revision=EXCLUDED.revision AND app_ratings.stars=EXCLUDED.stars)
     RETURNING stars, revision::text`,
    [ratingTokenHash(input.token), input.stars, input.revision],
  );
  if (!result.rowCount) throw new RatingConflictError("A newer rating request has already been saved");
  return { stars: result.rows[0].stars, revision: Number(result.rows[0].revision) };
}

export async function loadRatingSummary(db: Pool = feedbackDatabase()): Promise<RatingSummary> {
  const result = await db.query<{ rating_count: string; average: string | null; one: string; two: string; three: string; four: string; five: string; as_of: Date }>(
    `SELECT count(*)::text AS rating_count, round(avg(stars), 1)::text AS average,
     count(*) FILTER (WHERE stars=1)::text AS one, count(*) FILTER (WHERE stars=2)::text AS two,
     count(*) FILTER (WHERE stars=3)::text AS three, count(*) FILTER (WHERE stars=4)::text AS four,
     count(*) FILTER (WHERE stars=5)::text AS five, statement_timestamp() AS as_of FROM app_ratings`,
  );
  const row = result.rows[0];
  return {
    average: row.average === null ? null : Number(row.average), ratingCount: Number(row.rating_count),
    distribution: { "1": Number(row.one), "2": Number(row.two), "3": Number(row.three), "4": Number(row.four), "5": Number(row.five) },
    asOf: new Date(row.as_of).toISOString(),
  };
}
