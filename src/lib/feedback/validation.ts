import { createHash } from "node:crypto";
import type { FeedbackInput, RatingInput } from "./types";

export class FeedbackInputError extends Error {}

function object(value: unknown, allowed: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new FeedbackInputError("Invalid input");
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some(key => !allowed.includes(key))) throw new FeedbackInputError("Invalid input");
  return result;
}

function text(value: unknown, maximum: number, required = false): string | null {
  if (value === undefined || value === null || value === "") {
    if (required) throw new FeedbackInputError("Description required");
    return null;
  }
  if (typeof value !== "string" || value.length > maximum || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw new FeedbackInputError("Invalid text");
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  if (!normalized && required) throw new FeedbackInputError("Description required");
  return normalized || null;
}

export function sanitizeFeedbackPath(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 512 || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(value)) throw new FeedbackInputError("Invalid page context");
  const url = new URL(value, "https://feedback.invalid");
  if (url.origin !== "https://feedback.invalid" || url.pathname.length > 512 || url.pathname.startsWith("//")) throw new FeedbackInputError("Invalid page context");
  return url.pathname;
}

export function parseFeedback(value: unknown): FeedbackInput {
  const input = object(value, ["idempotencyKey", "category", "description", "reproduction", "expected", "replyEmail", "pathname", "clientCommit"]);
  if (typeof input.idempotencyKey !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.idempotencyKey)) throw new FeedbackInputError("Invalid submission key");
  if (input.category !== "bug" && input.category !== "improvement") throw new FeedbackInputError("Invalid category");
  const replyEmail = text(input.replyEmail, 254);
  if (replyEmail && (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(replyEmail) || /[\r\n\t]/.test(replyEmail))) throw new FeedbackInputError("Invalid email");
  const clientCommit = text(input.clientCommit, 40);
  if (clientCommit && !/^[a-f0-9]{40}$/i.test(clientCommit)) throw new FeedbackInputError("Invalid client version");
  const reproduction = text(input.reproduction, 3000);
  const expected = text(input.expected, 2000);
  return {
    idempotencyKey: input.idempotencyKey.toLowerCase(),
    category: input.category,
    description: text(input.description, 5000, true)!,
    reproduction: input.category === "bug" ? reproduction : null,
    expected: input.category === "bug" ? expected : null,
    replyEmail,
    pathname: sanitizeFeedbackPath(input.pathname),
    clientCommit: clientCommit?.toLowerCase() ?? null,
  };
}

export function payloadHash(input: FeedbackInput): string {
  // Receive-time deployment changes must not invalidate a lost-acknowledgement retry.
  return createHash("sha256").update(JSON.stringify([
    input.category, input.description, input.reproduction, input.expected,
    input.replyEmail, input.pathname, input.clientCommit,
  ])).digest("hex");
}

export function parseRating(value: unknown): RatingInput {
  const input = object(value, ["stars", "token", "revision"]);
  if (!Number.isInteger(input.stars) || Number(input.stars) < 1 || Number(input.stars) > 5 || typeof input.token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(input.token)
    || !Number.isSafeInteger(input.revision) || Number(input.revision) < 1) throw new FeedbackInputError("Invalid rating");
  return { stars: Number(input.stars), token: input.token, revision: Number(input.revision) };
}

export function ratingTokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function receivingCommit(): string | null {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA;
  return commit && /^[a-f0-9]{40}$/i.test(commit) ? commit.toLowerCase() : null;
}
