import { Pool, type PoolConfig } from "pg";
import { attachDatabasePool } from "@vercel/functions";

let pool: Pool | undefined;

export function feedbackPoolConfig(connectionString: string): PoolConfig {
  return {
    connectionString,
    max: 3,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 5_000,
    query_timeout: 6_000,
    application_name: "bible-compass-feedback",
    // PgBouncer rejects statement_timeout/idle timeout in startup parameters.
    // Configure those server-side defaults on the dedicated runtime role instead.
  };
}

export function feedbackReady(): boolean {
  return Boolean(process.env.FEEDBACK_DATABASE_URL && (process.env.FEEDBACK_RATE_LIMIT_SECRET?.length ?? 0) >= 32);
}

export function feedbackDatabase(): Pool {
  if (!feedbackReady()) throw new Error("Feedback storage not configured");
  if (!pool) {
    pool = new Pool(feedbackPoolConfig(process.env.FEEDBACK_DATABASE_URL!));
    attachDatabasePool(pool);
  }
  return pool;
}
