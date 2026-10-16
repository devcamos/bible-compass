import { database, notificationsReady } from "@/lib/notifications/db";
import { pushClient } from "@/lib/notifications/push";
import { schedulerAuthorized } from "@/lib/notifications/scheduler-auth";
import { getVerseOfTheDay } from "@/lib/verse-of-the-day";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!await schedulerAuthorized(request)) return new Response("Unauthorized", { status: 401 });
  if (!notificationsReady()) return new Response("Reminders not configured", { status: 503 });
  // Preview never broadcasts, even if someone invokes its cron URL manually.
  if (process.env.VERCEL_ENV !== "production") return Response.json({ skipped: "Preview does not send scheduled notifications" });
  const now = new Date();
  const db = database();
  const push = pushClient();
  let sent = 0;
  let failed = 0;
  // Atomic claims make overlapping/replayed cron calls safe. Claim-before-send
  // deliberately favors avoiding duplicates over retrying an ambiguous send.
  const result = await db.query<{ id: string; endpoint: string; p256dh: string; auth: string; day: string; ttl: number }>(`
    WITH candidates AS (
      SELECT s.id FROM push_subscriptions s WHERE s.next_send_at <= $1::timestamptz
      ORDER BY s.next_send_at LIMIT 1000 FOR UPDATE SKIP LOCKED
    ), advanced AS (
      UPDATE push_subscriptions s SET next_send_at = next_push_delivery(s.reminder_time, s.time_zone, $1::timestamptz)
      FROM candidates c WHERE s.id = c.id
      RETURNING s.id, s.endpoint, s.p256dh, s.auth,
        to_char(($1::timestamptz AT TIME ZONE s.time_zone)::date, 'YYYY-MM-DD') AS day,
        EXTRACT(EPOCH FROM (((($1::timestamptz AT TIME ZONE s.time_zone)::date + 1)::timestamp AT TIME ZONE s.time_zone) - $1::timestamptz))::integer AS ttl
    ), claims AS (
      INSERT INTO push_deliveries (subscription_id, day)
      SELECT id, day::date FROM advanced ON CONFLICT DO NOTHING RETURNING subscription_id
    ) SELECT a.* FROM advanced a JOIN claims c ON c.subscription_id = a.id`, [now.toISOString()]);
  for (let start = 0; start < result.rows.length; start += 50) {
    await Promise.all(result.rows.slice(start, start + 50).map(async (row) => {
      try {
        const verse = getVerseOfTheDay(new Date(`${row.day}T00:00:00Z`));
        await push.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          JSON.stringify({ date: row.day, body: `${verse.reference} (${verse.translation}) — ${verse.text}` }),
          { TTL: Math.max(1, Math.min(row.ttl, 86400)), timeout: 5000 });
        await db.query("UPDATE push_deliveries SET status = 'sent' WHERE subscription_id = $1 AND day = $2", [row.id, row.day]);
        sent++;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await db.query("DELETE FROM push_subscriptions WHERE id = $1", [row.id]);
        else await db.query("UPDATE push_deliveries SET status = 'failed' WHERE subscription_id = $1 AND day = $2", [row.id, row.day]);
        failed++;
      }
    }));
  }
  await db.query("DELETE FROM push_rate_limits WHERE expires_at < now()");
  await db.query("DELETE FROM push_deliveries WHERE day < CURRENT_DATE - 30");
  const remaining = await db.query<{ count: string }>("SELECT count(*) FROM push_subscriptions WHERE next_send_at <= $1::timestamptz", [now.toISOString()]);
  return Response.json({ checkedAt: now.toISOString(), sent, failed, remaining: Number(remaining.rows[0].count) }, { status: failed || Number(remaining.rows[0].count) ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
