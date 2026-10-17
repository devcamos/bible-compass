import { notificationsReady } from "@/lib/notifications/db";

export const dynamic = "force-dynamic";
export function GET() {
  const enabled = notificationsReady();
  return Response.json({ enabled, canSendTest: process.env.VERCEL_ENV === "preview", scheduled: process.env.VERCEL_ENV === "production", publicKey: enabled ? process.env.VAPID_PUBLIC_KEY : null }, { headers: { "Cache-Control": "no-store" } });
}
