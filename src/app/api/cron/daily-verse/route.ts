import { database, notificationsReady } from "@/lib/notifications/db";
import { pushClient } from "@/lib/notifications/push";
import { secretEquals } from "@/lib/notifications/validation";
import { getVerseOfTheDay } from "@/lib/verse-of-the-day";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !secretEquals(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) return new Response("Unauthorized", { status: 401 });
  if (!notificationsReady()) return new Response("Reminders not configured", { status: 503 });
  // Preview never broadcasts, even if someone invokes its cron URL manually.
  if (process.env.VERCEL_ENV !== "production") return Response.json({ skipped: "Preview does not send scheduled notifications" });
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const verse = getVerseOfTheDay(now);
  const db = database();
  const push = pushClient();
  let sent = 0;
  let failed = 0;
  // Atomic claims make overlapping/replayed cron calls safe. Claim-before-send
  // deliberately favors avoiding duplicates over retrying an ambiguous send.
  const result = await db.query<{ id: string; endpoint: string; p256dh: string; auth: string }>(`
    WITH candidates AS (
      SELECT s.id FROM push_subscriptions s
      WHERE NOT EXISTS (SELECT 1 FROM push_deliveries d WHERE d.subscription_id = s.id AND d.day = $1)
      ORDER BY s.id LIMIT 1000
    ), claims AS (
      INSERT INTO push_deliveries (subscription_id, day)
      SELECT id, $1 FROM candidates ON CONFLICT DO NOTHING RETURNING subscription_id
    ) SELECT s.id, s.endpoint, s.p256dh, s.auth FROM push_subscriptions s JOIN claims c ON c.subscription_id = s.id`, [day]);
  for (let start = 0; start < result.rows.length; start += 50) {
    await Promise.all(result.rows.slice(start, start + 50).map(async (row) => {
      try {
        await push.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          JSON.stringify({ date: day, body: `${verse.reference} (${verse.translation}) — ${verse.text}` }),
          { TTL: 86400 - now.getUTCHours() * 3600 - now.getUTCMinutes() * 60 - now.getUTCSeconds(), timeout: 5000 });
        await db.query("UPDATE push_deliveries SET status = 'sent' WHERE subscription_id = $1 AND day = $2", [row.id, day]);
        sent++;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await db.query("DELETE FROM push_subscriptions WHERE id = $1", [row.id]);
        else await db.query("UPDATE push_deliveries SET status = 'failed' WHERE subscription_id = $1 AND day = $2", [row.id, day]);
        failed++;
      }
    }));
  }
  await db.query("DELETE FROM push_rate_limits WHERE expires_at < now()");
  await db.query("DELETE FROM push_deliveries WHERE day < CURRENT_DATE - 30");
  const remaining = await db.query<{ count: string }>("SELECT count(*) FROM push_subscriptions s WHERE NOT EXISTS (SELECT 1 FROM push_deliveries d WHERE d.subscription_id = s.id AND d.day = $1)", [day]);
  return Response.json({ day, sent, failed, remaining: Number(remaining.rows[0].count) }, { status: failed || Number(remaining.rows[0].count) ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
