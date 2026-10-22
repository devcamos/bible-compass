import { feedbackReady } from "./db";
import { FeedbackRateError, limitFeedbackRequest } from "./rate-limit";
import { feedbackJson, FeedbackRequestError, readFeedbackBody, sameFeedbackOrigin } from "./request";
import { FeedbackConflictError, loadRatingSummary, RatingConflictError, saveFeedback, saveRating } from "./service";
import { FeedbackInputError, parseFeedback, parseRating } from "./validation";

const safeProviderCodes = new Set([
  "08000", "08001", "08003", "08004", "08006", "08007", "08P01", "0A000",
  "22001", "22003", "22007", "22P02", "23502", "23503", "23505", "23514", "25006",
  "28000", "28P01", "3D000", "3F000", "40001", "40P01", "42501", "42601", "42703", "42P01",
  "53300", "53400", "55000", "57014", "57P01", "57P02", "57P03", "58000",
  "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EHOSTUNREACH", "ENETUNREACH",
  "ERR_TLS_CERT_ALTNAME_INVALID", "DEPTH_ZERO_SELF_SIGNED_CERT", "CERT_HAS_EXPIRED",
]);

/** Fixed diagnostic codes only: never log provider messages, SQL, request data or credentials. */
export function feedbackFailureCode(error: unknown): string {
  const code = error && typeof error === "object" ? (error as { code?: unknown }).code : undefined;
  return typeof code === "string" && safeProviderCodes.has(code) ? code : "UNKNOWN";
}

function failure(error: unknown): Response {
  if (error instanceof FeedbackRateError) return feedbackJson({ error: "Please wait before trying again." }, 429, { "Retry-After": String(error.retryAfter) });
  if (error instanceof FeedbackConflictError) return feedbackJson({ error: "This submission key was already used. Start a new submission for edited feedback." }, 409);
  if (error instanceof RatingConflictError) return feedbackJson({ error: "This rating changed in another request. Please try again." }, 409);
  if (error instanceof FeedbackRequestError) return feedbackJson({ error: "Invalid request. Please check your feedback and try again." }, error.status);
  if (error instanceof FeedbackInputError) return feedbackJson({ error: "Invalid input. Please check your feedback and try again." }, 400);
  console.error("feedback_service_unavailable", { code: feedbackFailureCode(error) });
  return feedbackJson({ error: "The service is temporarily unavailable. Please try again." }, 503);
}

export async function feedbackPost(request: Request): Promise<Response> {
  if (!sameFeedbackOrigin(request)) return feedbackJson({ error: "Origin rejected" }, 403);
  if (!feedbackReady()) return failure(null);
  try {
    const input = parseFeedback(await readFeedbackBody(request));
    await limitFeedbackRequest(request, "feedback");
    return feedbackJson(await saveFeedback(input));
  } catch (error) { return failure(error); }
}

export async function ratingPut(request: Request): Promise<Response> {
  if (!sameFeedbackOrigin(request)) return feedbackJson({ error: "Origin rejected" }, 403);
  if (!feedbackReady()) return failure(null);
  try {
    const input = parseRating(await readFeedbackBody(request));
    await limitFeedbackRequest(request, "rating");
    return feedbackJson(await saveRating(input));
  } catch (error) { return failure(error); }
}

export async function ratingSummaryGet(request: Request): Promise<Response> {
  if (!feedbackReady()) return failure(null);
  try {
    await limitFeedbackRequest(request, "summary");
    return feedbackJson(await loadRatingSummary());
  } catch (error) { return failure(error); }
}
