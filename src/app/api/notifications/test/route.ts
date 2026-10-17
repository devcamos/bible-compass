import { sendTestNotification } from "@/lib/notifications/test-notification";

export const runtime = "nodejs";
export async function POST(request: Request) {
  return sendTestNotification(request);
}
