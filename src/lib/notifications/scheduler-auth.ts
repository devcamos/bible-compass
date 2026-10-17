import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { secretEquals } from "./validation";

const githubKeys = createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"));
export const SCHEDULER_AUDIENCE = "bible-compass-daily-verse";

export async function githubSchedulerAuthorized(token: string, keys: JWTVerifyGetKey = githubKeys): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: "https://token.actions.githubusercontent.com",
      audience: SCHEDULER_AUDIENCE,
      maxTokenAge: "10m",
      clockTolerance: 30,
      algorithms: ["RS256"],
      requiredClaims: ["exp", "iat", "sub"],
    });
    return payload.repository === "devcamos/bible-compass" && payload.repository_id === "1335846005" &&
      payload.ref === "refs/heads/main" && payload.sub === "repo:devcamos/bible-compass:ref:refs/heads/main" &&
      payload.workflow_ref === "devcamos/bible-compass/.github/workflows/daily-verse.yml@refs/heads/main" &&
      (payload.event_name === "schedule" || payload.event_name === "workflow_dispatch");
  } catch { return false; }
}

export async function schedulerAuthorized(request: Request): Promise<boolean> {
  const authorization = request.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (secret && secretEquals(authorization, `Bearer ${secret}`)) return true;
  if (!authorization.startsWith("Bearer ") || authorization.length > 20_000) return false;
  return githubSchedulerAuthorized(authorization.slice(7));
}
