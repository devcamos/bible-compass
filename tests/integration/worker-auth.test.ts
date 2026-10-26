import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from "jose";
import { FEEDBACK_WORKER_AUDIENCE, feedbackWorkerAuthorized, githubFeedbackWorkerAuthorized } from "../../src/lib/feedback/worker-auth";

let keys: JWTVerifyGetKey; let sign: (claims: Record<string, unknown>) => Promise<string>;
const good = { repository: "devcamos/bible-compass", repository_id: "1335846005", repository_owner_id: "196340576", ref: "refs/heads/main", sub: "repo:devcamos/bible-compass:ref:refs/heads/main", workflow_ref: "devcamos/bible-compass/.github/workflows/feedback-triage.yml@refs/heads/main", event_name: "schedule" };

beforeAll(async () => {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  keys = createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), alg: "RS256" }] });
  sign = claims => new SignJWT(claims).setProtectedHeader({ alg: "RS256" }).setIssuer("https://token.actions.githubusercontent.com").setAudience(FEEDBACK_WORKER_AUDIENCE).setIssuedAt().setExpirationTime("5m").sign(privateKey);
});

describe("GitHub OIDC worker auth", () => {
  it("accepts the main-branch triage workflow", async () => {
    expect(await githubFeedbackWorkerAuthorized(await sign(good), keys)).toBe(true);
    expect(await githubFeedbackWorkerAuthorized(await sign({ ...good, event_name: "workflow_dispatch" }), keys)).toBe(true);
  });
  it.each([{ event_name: "push" }, { ref: "refs/heads/dev" }, { sub: "repo:other" }, { workflow_ref: "x" }, { repository_id: "1" }])("rejects %j", async bad => {
    expect(await githubFeedbackWorkerAuthorized(await sign({ ...good, ...bad }), keys)).toBe(false);
  });
  it("rejects garbage tokens", async () => { expect(await githubFeedbackWorkerAuthorized("nope", keys)).toBe(false); });
});

describe("feedbackWorkerAuthorized", () => {
  afterEach(() => { delete process.env.FEEDBACK_WORKER_SECRET; });
  const r = (auth?: string) => new Request("https://app.test", { method: "POST", headers: auth ? { authorization: auth } : {} });
  it("rejects missing or oversized headers", async () => {
    expect(await feedbackWorkerAuthorized(r())).toBe(false);
    expect(await feedbackWorkerAuthorized(r("Bearer " + "a".repeat(20_001)))).toBe(false);
  });
  it("accepts the manual bearer secret", async () => {
    process.env.FEEDBACK_WORKER_SECRET = "k".repeat(32);
    expect(await feedbackWorkerAuthorized(r("Bearer " + "k".repeat(32)))).toBe(true);
  });
  it("falls back to OIDC when the secret mismatches or is weak", async () => {
    process.env.FEEDBACK_WORKER_SECRET = "k".repeat(32);
    expect(await feedbackWorkerAuthorized(r("Bearer wrong"))).toBe(false);
    process.env.FEEDBACK_WORKER_SECRET = "short";
    expect(await feedbackWorkerAuthorized(r("Bearer short"))).toBe(false);
  });
});
