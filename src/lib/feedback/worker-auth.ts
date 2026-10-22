import { createHash, timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

export const FEEDBACK_WORKER_AUDIENCE = "bible-compass-feedback";
const githubKeys = createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"));
const allowedSubjects = new Set([
  "repo:devcamos/bible-compass:ref:refs/heads/main",
  "repo:devcamos@196340576/bible-compass@1335846005:ref:refs/heads/main",
]);

export async function githubFeedbackWorkerAuthorized(token: string, keys: JWTVerifyGetKey = githubKeys): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: "https://token.actions.githubusercontent.com",
      audience: FEEDBACK_WORKER_AUDIENCE,
      algorithms: ["RS256"],
      maxTokenAge: "10m",
      clockTolerance: 30,
      requiredClaims: ["exp", "iat", "sub"],
    });
    return payload.repository === "devcamos/bible-compass" && payload.repository_id === "1335846005"
      && payload.repository_owner_id === "196340576" && payload.ref === "refs/heads/main"
      && typeof payload.sub === "string" && allowedSubjects.has(payload.sub)
      && payload.workflow_ref === "devcamos/bible-compass/.github/workflows/feedback-triage.yml@refs/heads/main"
      && (payload.event_name === "schedule" || payload.event_name === "workflow_dispatch");
  } catch { return false; }
}

export async function feedbackWorkerAuthorized(request: Request): Promise<boolean> {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ") || authorization.length > 20_000) return false;
  const secret = process.env.FEEDBACK_WORKER_SECRET;
  if (secret && secret.length >= 32) {
    const digest = (value: string) => createHash("sha256").update(value).digest();
    if (timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`))) return true;
  }
  return githubFeedbackWorkerAuthorized(authorization.slice(7));
}
