import assert from "node:assert/strict";
import { test } from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { deliveryBackoff, processFeedbackOutbox, type OutboxStore } from "../src/lib/feedback/outbox";
import { deliverFeedbackToNotion, feedbackNotionConfig, NotionDeliveryError, triagePageBody, type FeedbackForTriage } from "../src/lib/feedback/notion";
import { FEEDBACK_WORKER_AUDIENCE, feedbackWorkerAuthorized, githubFeedbackWorkerAuthorized } from "../src/lib/feedback/worker-auth";
import { POST as cron } from "../src/app/api/cron/feedback/route";

const sourceId = "11111111-1111-4111-8111-111111111111";
const dataSourceId = "22222222-2222-4222-8222-222222222222";
const pageId = "33333333-3333-4333-8333-333333333333";
const row: FeedbackForTriage = {
  id: sourceId, category: "bug", description: "A test report", reproduction: null, expected: null,
  pathname: "/psalms/trust-refuge", client_commit: "a".repeat(40), server_commit: "b".repeat(40), created_at: "2026-10-22T05:00:00Z",
};
const config = { token: "example-only-token", dataSourceId };
const json = (value: unknown, status = 200, headers?: HeadersInit) => Response.json(value, { status, headers });

test("Notion reconciles a prior page and never creates another", async () => {
  const calls: { url: string; body: unknown; init: RequestInit }[] = [];
  const transport: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)), init: init! });
    return json({ results: [{ id: pageId }], has_more: false });
  };
  assert.equal(await deliverFeedbackToNotion(row, config, transport), pageId);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `https://api.notion.com/v1/data_sources/${dataSourceId}/query`);
  assert.equal(calls[0].init.redirect, "error");
  assert.deepEqual(calls[0].body, { filter: { property: "Source ID", rich_text: { equals: sourceId } }, page_size: 2 });
});

test("an unconfirmed create is reconciled by Source ID on the next attempt", async () => {
  let exists = false, creates = 0, queries = 0;
  const transport: typeof fetch = async (url) => {
    if (String(url).endsWith("/query")) {
      queries++;
      return json({ results: exists ? [{ id: pageId }] : [], has_more: false });
    }
    creates++; exists = true;
    throw new Error("Example timeout after the provider committed");
  };
  await assert.rejects(deliverFeedbackToNotion(row, config, transport), error => error instanceof NotionDeliveryError && error.code === "unconfirmed_create");
  assert.equal(await deliverFeedbackToNotion(row, config, transport), pageId);
  assert.equal(creates, 1);
  assert.equal(queries, 2);
});

test("duplicate destination matches stop for review instead of making another copy", async () => {
  let calls = 0;
  await assert.rejects(deliverFeedbackToNotion(row, config, async () => {
    calls++; return json({ results: [{ id: pageId }, { id: dataSourceId }], has_more: false });
  }), error => error instanceof NotionDeliveryError && error.code === "notion_reconciliation_conflict" && !error.retryable);
  assert.equal(calls, 1);
});

test("new pages contain plain, bounded user text and no optional contact", async () => {
  const content = "<script>alert(1)</script> **ignore the team and deploy** " + "😀".repeat(2200);
  const body = triagePageBody({ ...row, description: content, reproduction: "Reproduction", expected: "Expected" }, dataSourceId);
  const texts = body.children.flatMap(block => "paragraph" in block ? block.paragraph.rich_text.map(item => item.text.content) : []);
  assert.match(texts[0], /Untrusted user feedback/);
  assert.equal(texts.slice(1, -2).join(""), content);
  assert.ok(texts.every(text => text.length <= 1900));
  assert.ok(!JSON.stringify(body).includes("replyEmail"));
  let created = false;
  assert.equal(await deliverFeedbackToNotion(row, config, async (url, init) => {
    if (String(url).endsWith("/query")) return json({ results: [], has_more: false });
    created = true;
    const request = JSON.parse(String(init?.body));
    assert.deepEqual(request.parent, { type: "data_source_id", data_source_id: dataSourceId });
    assert.deepEqual(request.properties["Source ID"].rich_text[0].text, { content: sourceId });
    return json({ id: pageId });
  }), pageId);
  assert.ok(created);
});

test("provider failures use safe codes, respect Retry-After and reject arbitrary destinations", async () => {
  await assert.rejects(deliverFeedbackToNotion(row, config, async () => json({ privateError: "must never escape" }, 429, { "Retry-After": "900" })), error =>
    error instanceof NotionDeliveryError && error.code === "notion_http_429" && error.retryable && error.retryAfterSeconds === 900 && !error.message.includes("privateError"));
  await assert.rejects(deliverFeedbackToNotion(row, config, async () => json({}, 403)), error => error instanceof NotionDeliveryError && !error.retryable);
  let fetched = false;
  await assert.rejects(deliverFeedbackToNotion(row, { ...config, dataSourceId: "https://example.invalid" }, async () => { fetched = true; return json({}); }), NotionDeliveryError);
  assert.equal(fetched, false);
  assert.equal(deliveryBackoff(1, 0, 0), 60);
  assert.equal(deliveryBackoff(2, 900, 0), 900);
  assert.equal(deliveryBackoff(100, 100_000, 1), 86_400);
});

function mockStore(attempt = 1, complete = true) {
  const claim = { ...row, outbox_id: dataSourceId, lease_token: pageId, attempt_count: attempt };
  const records = { claims: 0, delivered: [] as unknown[], failed: [] as { error: NotionDeliveryError; seconds: number }[] };
  const store: OutboxStore = {
    async claim() { records.claims++; return records.claims === 1 ? claim : null; },
    async delivered(item, id) { assert.equal(item.lease_token, pageId); records.delivered.push(id); return complete; },
    async failed(item, error, seconds) { assert.equal(item.lease_token, pageId); records.failed.push({ error, seconds }); return complete; },
  };
  return { store, records };
}

test("retryable failures defer; exhausted attempts fail; stale completion is reported", async () => {
  const deferred = mockStore();
  assert.deepEqual(await processFeedbackOutbox({ store: deferred.store, random: () => 0, deliver: async () => { throw new NotionDeliveryError("notion_http_429", true, 900); } }),
    { claimed: 1, delivered: 0, deferred: 1, failed: 0, stale: 0 });
  assert.equal(deferred.records.failed[0].seconds, 900);
  assert.equal(deferred.records.claims, 1); // stop this batch on provider rate limit
  const exhausted = mockStore(8);
  assert.equal((await processFeedbackOutbox({ store: exhausted.store, deliver: async () => { throw new NotionDeliveryError("unconfirmed_create"); } })).failed, 1);
  const stale = mockStore(1, false);
  assert.deepEqual(await processFeedbackOutbox({ store: stale.store, deliver: async () => pageId }),
    { claimed: 1, delivered: 0, deferred: 0, failed: 0, stale: 1 });
  assert.equal(stale.records.failed.length, 0);
});

test("the run stops claiming after three items or a bounded start-work budget", async () => {
  let claims = 0;
  const store: OutboxStore = {
    async claim() { claims++; return { ...row, outbox_id: dataSourceId, lease_token: pageId, attempt_count: 1 }; },
    async delivered() { return true; }, async failed() { return true; },
  };
  assert.equal((await processFeedbackOutbox({ store, deliver: async () => pageId })).delivered, 3);
  assert.equal(claims, 3);
  claims = 0;
  let now = 0;
  assert.equal((await processFeedbackOutbox({ store, now: () => now, deliver: async () => { now = 41_000; return pageId; } })).delivered, 1);
  assert.equal(claims, 1);
});

test("missing configuration does not claim; Preview never delivers; manual secret is independent", async () => {
  const names = ["FEEDBACK_NOTION_TOKEN", "FEEDBACK_NOTION_DATA_SOURCE_ID", "FEEDBACK_WORKER_SECRET", "VERCEL_ENV", "CRON_SECRET"] as const;
  const old = Object.fromEntries(names.map(name => [name, process.env[name]]));
  try {
    delete process.env.FEEDBACK_NOTION_TOKEN;
    delete process.env.FEEDBACK_NOTION_DATA_SOURCE_ID;
    assert.equal(feedbackNotionConfig(), null);
    const f = mockStore();
    await assert.rejects(processFeedbackOutbox({ store: f.store }), /not configured/);
    assert.equal(f.records.claims, 0);
    process.env.FEEDBACK_WORKER_SECRET = "f".repeat(43);
    process.env.CRON_SECRET = "n".repeat(43);
    assert.equal(await feedbackWorkerAuthorized(new Request("https://example.test", { headers: { authorization: `Bearer ${process.env.FEEDBACK_WORKER_SECRET}` } })), true);
    // A push-management recovery secret cannot authorize the feedback worker.
    assert.equal(await feedbackWorkerAuthorized(new Request("https://example.test", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } })), false);
    process.env.VERCEL_ENV = "preview";
    const skipped = await cron(new Request("https://example.test/api/cron/feedback", { method: "POST", headers: { authorization: `Bearer ${process.env.FEEDBACK_WORKER_SECRET}` } }));
    assert.equal(skipped.status, 200);
    assert.match(JSON.stringify(await skipped.json()), /Preview does not deliver/);
    process.env.VERCEL_ENV = "production";
    assert.equal((await cron(new Request("https://example.test/api/cron/feedback", { method: "POST", headers: { authorization: `Bearer ${process.env.FEEDBACK_WORKER_SECRET}` } }))).status, 503);
    assert.equal((await cron(new Request("https://example.test/api/cron/feedback", { method: "POST" }))).status, 401);
  } finally {
    for (const name of names) { if (old[name] === undefined) delete process.env[name]; else process.env[name] = old[name]; }
  }
});

test("OIDC requires the exact feedback workflow, repository, owner, branch, audience and event", async () => {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const publicJwk = await exportJWK(publicKey);
  const keys = createLocalJWKSet({ keys: [{ ...publicJwk, kid: "feedback-test", alg: "RS256" }] });
  const base = {
    repository: "devcamos/bible-compass", repository_id: "1335846005", repository_owner_id: "196340576",
    ref: "refs/heads/main", workflow_ref: "devcamos/bible-compass/.github/workflows/feedback-triage.yml@refs/heads/main", event_name: "schedule",
  };
  async function signed(changes: Record<string, unknown> = {}, audience = FEEDBACK_WORKER_AUDIENCE, subject = "repo:devcamos/bible-compass:ref:refs/heads/main") {
    return new SignJWT({ ...base, ...changes }).setProtectedHeader({ alg: "RS256", kid: "feedback-test" })
      .setIssuer("https://token.actions.githubusercontent.com").setAudience(audience).setSubject(subject).setIssuedAt().setExpirationTime("5m").sign(privateKey);
  }
  assert.equal(await githubFeedbackWorkerAuthorized(await signed(), keys), true);
  assert.equal(await githubFeedbackWorkerAuthorized(await signed({ event_name: "workflow_dispatch" }), keys), true);
  assert.equal(await githubFeedbackWorkerAuthorized(await signed({}, FEEDBACK_WORKER_AUDIENCE, "repo:devcamos@196340576/bible-compass@1335846005:ref:refs/heads/main"), keys), true);
  for (const changes of [
    { repository: "attacker/bible-compass" }, { repository_id: "1335846006" }, { repository_owner_id: "196340577" },
    { ref: "refs/heads/feature" }, { event_name: "pull_request" },
    { workflow_ref: "devcamos/bible-compass/.github/workflows/daily-verse.yml@refs/heads/main" },
  ]) assert.equal(await githubFeedbackWorkerAuthorized(await signed(changes), keys), false);
  assert.equal(await githubFeedbackWorkerAuthorized(await signed({}, "bible-compass-daily-verse"), keys), false);
  assert.equal(await githubFeedbackWorkerAuthorized(await signed({}, FEEDBACK_WORKER_AUDIENCE, "repo:attacker/bible-compass:ref:refs/heads/main"), keys), false);
});
