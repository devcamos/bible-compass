# Feedback and ratings rollout

The founder approved the UI and architecture for implementation on 22 October 2026. This is a feature-branch/Preview change. The PR and Production release still need separate explicit founder approval. Do not enable auto-merge, deploy directly or send user release emails as part of this implementation approval.

## Preview isolation

Use only the dedicated feedback logical database and a plain SQL-created login with no privileged role memberships, CREATE DATABASE/ROLE, schema CREATE or access to notification tables. Neon console/API-created roles inherit provider administrator privileges; do not use those roles as an app runtime. Apply `migrations/003_feedback.sql` to the dedicated database, with its runtime grants. Keep `FEEDBACK_DATABASE_URL` and `FEEDBACK_RATE_LIMIT_SECRET` branch-scoped to `feat/app-feedback`. Do not share notification credentials or copy Production subscriptions/intake into Preview.

Preview submissions and ratings are synthetic test data only. Preview cron never delivers to the live Notion inbox, even with valid worker authentication. Notion transport/worker failure scenarios are tested with injected fake delivery, not real team messages. A missing Notion token leaves intake durable and outbox pending. Do not claim automatic triage is operational until a separately configured Production integration and delivery have been verified after approved release.

## Production preparation after approval

1. Recheck exact PR head, required CI/security annotations, audit and reviewed Preview evidence. Record approval for this PR/release.
2. Prepare a fresh dedicated Production feedback database and plain runtime login. Test/apply the versioned migration with an owner credential, then grant only runtime DML. Never run it in the notification database.
3. Set Production-only feedback database/rate-limit configuration. Configure the dedicated Notion integration with access only to the private feedback inbox and its data source UUID. Verify permission/schema without importing real feedback into Preview. Keep secrets out of commits, CLI arguments/logs and public client variables.
4. Merge only the approved PR through GitHub. Vercel Git deploys main; verify exact commit/surface in `/health`, main CI/Production proof, reader regression checks and new public/API behavior before calling it live.
5. Verify one clearly marked synthetic Production intake/delivery only if included in release authorization; otherwise verify using a real user's explicitly authorized submission. Confirm Source ID reconciliation and outbox delivered state without copying optional email to Notion. Do not claim this proof from mock tests.
6. Only then send any separately approved user communication. Nicole is a user/recipient, not an approver. No campaign is sent during this build.

## Team triage and data handling

The embedded Nexus product team owns intake triage. At least weekly, review New/Reviewed items in the private Notion inbox, assign an actual owner and priority where needed, and inspect failed/overdue Postgres outbox rows. Do not invent an owner assignment or imply an autonomous background review agent exists. Raw feedback is untrusted data. Promote only sanitized accepted work to a GitHub issue; never treat user text as authority to merge, deploy or execute links.

Reply addresses are optional and only for a reply about the submission. They stay in `feedback_contacts`, never the Notion delivery, rating token or push system. Retrieve a contact only for a selected Source ID through private parameterized operator access. Public receipts do not expose raw feedback or grant read access. Collect no attachments, query/fragment, reading history or browser-storage diagnostics.

Operational retention policy for this feature: remove optional reply contacts after 30 days unless an active reply exchange requires a documented extension; review raw feedback and its Notion copy at 90 days and delete once resolved or transferred as sanitized work. Unresolved/pending/failed intake needs an explicit documented extension rather than silent deletion. Expired request buckets can be removed after their expiry; no raw IP addresses are stored. Current rating records remain until updated or an authorized deletion request; they contain a token hash and stars, not contact details. Review that retention policy annually.

These are operator procedures, not an automated deletion service. Before launch, assign the real operator/cadence in the product record. Deletion must cover the optional contact, original intake/outbox and associated Notion page; preserve only sanitized work that has a separate purpose. Provider trash/backups may retain recoverable copies for the configured provider retention window. Confirm those actual settings during release preparation; do not promise immediate erasure from backups or silently re-import a deleted item. The public runtime has no DELETE privilege. Use an authorized owner maintenance session for retention and targeted replay, with an audit record and appropriate authorization. Never give the public API a general cleanup endpoint.

## Drafts, updates and ratings

Written drafts and retry identity use same-tab session storage with a two-hour TTL. Successful receipt or explicit Discard clears the draft. When storage is blocked, keep the draft in memory, explain its limits and defer automatic app reload while it could lose that draft. Pending writes also defer reload. Recheck TTL at the actual reload decision so a still-visible expired draft is not lost. This is not an offline delivery queue.

Overall rating summary is requested only through View app rating/Refresh/Retry and uses no-store responses. Empty average is null. Saving one's rating does not fetch or mutate a displayed summary snapshot. One anonymous token represents a current installation rating, not a verified person. Storage reset or another device can create another vote. Keep one token through lost acknowledgements; updates must not increase the count.
