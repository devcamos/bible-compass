import { database, notificationsReady } from "@/lib/notifications/db";
import { hash, parseSubscription, sameOrigin, validToken } from "@/lib/notifications/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!id || !/^[a-f0-9]{64}$/.test(id) || !validToken(token)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await database().query<{ reminder_time: string; time_zone: string }>("SELECT reminder_time, time_zone FROM push_subscriptions WHERE id = $1 AND token_hash = $2", [id, hash(token)]);
    if (!result.rowCount) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ reminderTime: result.rows[0].reminder_time, timeZone: result.rows[0].time_zone }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Could not load reminder time" }, { status: 503 }); }
}

async function readBody(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("JSON required");
  if (Number(request.headers.get("content-length")) > 4096) throw new Error("Body too large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Body required");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 4096) { await reader.cancel(); throw new Error("Body too large"); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Origin rejected" }, { status: 403 });
  if (!notificationsReady()) return Response.json({ error: "Reminders are not available yet" }, { status: 503 });
  let input;
  try { input = parseSubscription(await readBody(request)); }
  catch { return Response.json({ error: "Invalid subscription" }, { status: 400 }); }
  try {
    const db = database();
    // Vercel overwrites x-real-ip. Only a salted hash survives in storage.
    const ip = request.headers.get("x-real-ip") ?? "local";
    const bucket = hash(`${process.env.CRON_SECRET}:${ip}:${new Date().toISOString().slice(0, 10)}`);
    const rate = await db.query<{ count: number }>(`INSERT INTO push_rate_limits (bucket, expires_at) VALUES ($1, now() + interval '1 day') ON CONFLICT (bucket) DO UPDATE SET count = push_rate_limits.count + 1 RETURNING count`, [bucket]);
    if (rate.rows[0].count > 20) return Response.json({ error: "Please try again tomorrow" }, { status: 429 });
    const saved = await db.query(`INSERT INTO push_subscriptions (id, endpoint, p256dh, auth, token_hash, reminder_time, time_zone, next_send_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, next_push_delivery($6, $7, now()))
      ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth,
      reminder_time = EXCLUDED.reminder_time, time_zone = EXCLUDED.time_zone,
      next_send_at = CASE WHEN push_subscriptions.reminder_time = EXCLUDED.reminder_time AND push_subscriptions.time_zone = EXCLUDED.time_zone THEN push_subscriptions.next_send_at ELSE EXCLUDED.next_send_at END,
      updated_at = now()
      WHERE push_subscriptions.token_hash = EXCLUDED.token_hash RETURNING id`,
    [hash(input.endpoint), input.endpoint, input.keys.p256dh, input.keys.auth, hash(input.token), input.reminderTime, input.timeZone]);
    if (!saved.rowCount) return Response.json({ error: "Turn reminders off on this device, then enable them again" }, { status: 409 });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Could not save reminders. Please try again." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Origin rejected" }, { status: 403 });
  let input: { endpoint?: unknown; token?: unknown };
  try {
    input = await readBody(request) as typeof input;
    if (!input || typeof input.endpoint !== "string" || input.endpoint.length > 2048 || !validToken(input.token)) throw new Error("Invalid unsubscribe request");
  } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
  try {
    await database().query("DELETE FROM push_subscriptions WHERE id = $1 AND token_hash = $2", [hash(input.endpoint as string), hash(input.token as string)]);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Could not remove reminders. Please try again." }, { status: 503 }); }
}
