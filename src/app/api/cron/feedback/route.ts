import { feedbackWorkerAuthorized } from "@/lib/feedback/worker-auth";
import { feedbackNotionConfig } from "@/lib/feedback/notion";
import { processFeedbackOutbox } from "@/lib/feedback/outbox";

export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (!await feedbackWorkerAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  // An authenticated Preview invocation must never write to the team's live inbox.
  if (process.env.VERCEL_ENV !== "production") return Response.json({ skipped: "Preview does not deliver feedback to the team inbox" }, { headers });
  if (!process.env.FEEDBACK_DATABASE_URL || !feedbackNotionConfig()) return Response.json({ error: "Feedback triage is not configured" }, { status: 503, headers });
  try {
    const result = await processFeedbackOutbox();
    return Response.json({ checkedAt: new Date().toISOString(), ...result }, { status: result.failed || result.deferred ? 503 : 200, headers });
  } catch { return Response.json({ error: "Feedback triage is temporarily unavailable" }, { status: 503, headers }); }
}
