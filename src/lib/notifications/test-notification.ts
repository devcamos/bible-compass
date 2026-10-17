import { randomUUID } from "node:crypto";
import { database, notificationsReady } from "./db";
import { pushClient } from "./push";
import { readBody } from "./request";
import { hash, parseSubscription, sameOrigin, validToken } from "./validation";
import { getVerseOfTheDay } from "../verse-of-the-day";

// Only stored subscriptions owned by the caller can receive a test.
export async function sendTestNotification(request: Request, dependencies = { database, notificationsReady, pushClient }) {
  if (!sameOrigin(request)) return Response.json({ error: "Origin rejected" }, { status: 403 });
  if (!dependencies.notificationsReady()) return Response.json({ error: "Reminders are unavailable" }, { status: 503 });
  let input: { id?: unknown; token?: unknown };
  try {
    input = await readBody(request) as typeof input;
    if (!input || typeof input.id !== "string" || !/^[a-f0-9]{64}$/.test(input.id) || !validToken(input.token)) throw new Error("Invalid request");
  } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
  try {
    const db = dependencies.database();
    const owned = await db.query<{ endpoint: string; p256dh: string; auth: string; day: string }>(
      "SELECT endpoint, p256dh, auth, to_char(now() AT TIME ZONE time_zone, 'YYYY-MM-DD') AS day FROM push_subscriptions WHERE id = $1 AND token_hash = $2",
      [input.id, hash(input.token as string)],
    );
    if (!owned.rowCount) return Response.json({ error: "Subscription not found" }, { status: 404 });
    const bucket = hash(`test:${input.id}:${Math.floor(Date.now() / 300_000)}`);
    const rate = await db.query<{ count: number }>("INSERT INTO push_rate_limits (bucket, expires_at) VALUES ($1, now() + interval '10 minutes') ON CONFLICT (bucket) DO UPDATE SET count = push_rate_limits.count + 1 RETURNING count", [bucket]);
    if (rate.rows[0].count > 3) return Response.json({ error: "Please wait five minutes" }, { status: 429 });
    const row = owned.rows[0];
    // Revalidate stored endpoints as well: never turn this route into an HTTP proxy.
    const subscription = parseSubscription({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth }, token: input.token });
    const verse = getVerseOfTheDay(new Date(`${row.day}T00:00:00Z`));
    try {
      await dependencies.pushClient().sendNotification(subscription, JSON.stringify({
        body: `${verse.reference} (${verse.translation}) — ${verse.text}`, date: row.day, testId: randomUUID(),
      }), { TTL: 60, timeout: 5000 });
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await db.query("DELETE FROM push_subscriptions WHERE id = $1 AND token_hash = $2", [input.id, hash(input.token as string)]);
        return Response.json({ error: "Subscription expired" }, { status: 410 });
      }
      throw error;
    }
    // Acceptance by the push service does not prove delivery or OS banner display.
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Could not send test notification" }, { status: 503 }); }
}
