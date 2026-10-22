import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

let pool: Pool | undefined;

export function feedbackReady(): boolean {
  return Boolean(process.env.FEEDBACK_DATABASE_URL && (process.env.FEEDBACK_RATE_LIMIT_SECRET?.length ?? 0) >= 32);
}

export function feedbackDatabase(): Pool {
  if (!feedbackReady()) throw new Error("Feedback storage not configured");
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.FEEDBACK_DATABASE_URL,
      max: 3,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 5_000,
      statement_timeout: 5_000,
      query_timeout: 6_000,
      options: "-c idle_in_transaction_session_timeout=10000",
      application_name: "bible-compass-feedback",
    });
    attachDatabasePool(pool);
  }
  return pool;
}
