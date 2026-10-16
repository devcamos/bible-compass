import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

let pool: Pool | undefined;
export function database(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("Notification storage not configured");
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 5000 });
    attachDatabasePool(pool);
  }
  return pool;
}

export function notificationsReady(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT && process.env.CRON_SECRET);
}
