import { feedbackReady } from "./db";
import { FeedbackRateError, limitFeedbackRequest } from "./rate-limit";
import { feedbackJson, FeedbackRequestError, readFeedbackBody, sameFeedbackOrigin } from "./request";
import { FeedbackConflictError, loadRatingSummary, RatingConflictError, saveFeedback, saveRating } from "./service";
import { FeedbackInputError, parseFeedback, parseRating } from "./validation";

function failure(error: unknown): Response {
  if (error instanceof FeedbackRateError) return feedbackJson({ error: "Please wait before trying again." }, 429, { "Retry-After": String(error.retryAfter) });
  if (error instanceof FeedbackConflictError) return feedbackJson({ error: "This submission key was already used. Start a new submission for edited feedback." }, 409);
  if (error instanceof RatingConflictError) return feedbackJson({ error: "This rating changed in another request. Please try again." }, 409);
  if (error instanceof FeedbackRequestError) return feedbackJson({ error: "Invalid request. Please check your feedback and try again." }, error.status);
  if (error instanceof FeedbackInputError) return feedbackJson({ error: "Invalid input. Please check your feedback and try again." }, 400);
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
