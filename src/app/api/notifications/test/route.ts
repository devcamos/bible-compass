import { sendTestNotification } from "@/lib/notifications/test-notification";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== "preview") return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  return sendTestNotification(request);
}
