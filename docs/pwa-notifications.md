# Home Screen and daily verse reminders

Bible Compass is installable through `/manifest.webmanifest`. The manifest uses
the existing Nexus paper/copper book mark at 192px and 512px, plus a maskable
512px version with extra safe space. The existing Apple touch icon is retained.
The reader's routes, theme, preferences, and content stay intact.

The service worker `/sw.js` only receives push and handles notification taps.
It does not intercept requests, cache pages, force updates, or provide offline
reading. Installation still works independently of notification availability.

## User flow

Open Your Profile → turn on Daily verse reminder → choose a time and timezone → Save time. Permission
is requested only from that button. On iPhone/iPad, first save the app through
Share → Add to Home Screen and open the icon; web push requires iOS/iPadOS 16.4+.
Other supported browsers may allow push without installing first.

New reminders default to **08:00 in the device's detected timezone**. The user
can choose another time and IANA timezone and save changes without re-subscribing.
Existing subscriptions retain their original 08:00 UTC until changed. The selected
timezone follows daylight saving automatically and stays fixed while traveling;
users can update it in Profile. GitHub checks for due reminders about every five
minutes. Scheduler and device delivery can be delayed; timing is best effort.
Turn reminders off in the same panel; device settings can also block them.

## Architecture

1. The browser creates a push subscription and a random device management token.
2. The same-origin API stores the endpoint, encryption keys, and a hash of that
   token, the chosen time/timezone, and the next UTC delivery instant in Postgres.
   No account, name, email, or reading history is stored.
3. The existing GitHub pipeline runs `.github/workflows/daily-verse.yml` about
   every five minutes on `main` and calls the Production endpoint
   `/api/cron/daily-verse` with a short-lived GitHub OIDC identity token. The API
   verifies GitHub's signature, audience, repository ID, `main` ref, exact workflow
   path and scheduled/manual event type. No checkout or third-party action runs
   with the token. This avoids a paid Vercel
   cron frequency requirement. Workflow dispatch supports a manual recovery run.
4. The job locks due subscriptions, atomically advances their next delivery,
   claims one delivery per device/local-calendar-day, and sends through standard
   Web Push with VAPID. The existing verse rotation is indexed by that local
   date, so timezone boundaries and delayed opens refer to a stable verse.
5. A tap opens `/?verse=YYYY-MM-DD#verse-of-the-day-heading`: the usual home-page
   verse card, with its existing Explore further link. There is no separate verse
   or reminders page. The older `/verse-of-the-day` URL redirects here. The small
   client wrapper selects the notification's verse after hydration; normal home
   rendering remains static-first and refreshes the current verse on returning to
   the tab. Reminder settings stay in Your Profile.

No Notion requests or database calls are added to reader page rendering. The
database and notification dependencies are confined to the notification API.
The existing verse collection and its translation labels are reused unchanged.

## Storage and configuration

Schema is versioned in `migrations/001_notifications.sql` and
`migrations/002_personal_reminder_times.sql`. Apply them in order, each statement
to a notification database using a direct connection before enabling reminders.
The application uses a pooled Postgres URL and a small Fluid-compatible pool.
Do not run migrations from request handlers or during a build.

Required server-only variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled notification database connection |
| `VAPID_PUBLIC_KEY` | Public subscription key, returned by the config endpoint |
| `VAPID_PRIVATE_KEY` | Secret signing key; keep stable for existing subscriptions |
| `VAPID_SUBJECT` | Public HTTPS contact URL identifying Bible Compass |
| `CRON_SECRET` | Random secret for scheduler authentication and rate-limit salt |

Generate a VAPID pair with `web-push.generateVAPIDKeys()` and use a cryptographic
random secret for cron. Store private values only in environment secrets, never
in Git or `NEXT_PUBLIC_` variables. Missing configuration hides the enable button
and leaves reading/installation available.

Use separate databases and VAPID/cron keys for Preview and Production. Scope
Preview credentials to its feature branch. Preview cron calls always skip
broadcasting; the scheduler targets only the fixed Production hostname. All deployments follow
the repository's GitHub → Vercel flow and founder-approved merge boundary.

For the initial rollout, notification storage is in Neon project
`bible-compass-notifications` (`odd-union-85602248`). The feature Preview uses
the empty isolated branch `preview/pwa-daily-verse` (`br-flat-hat-bao4fvg4`).
Production uses the separate `production` branch. Never copy device subscriptions
between these environments.

No GitHub repository secret is required. The workflow has only `id-token: write`
permission and becomes scheduled only after it reaches `main`. `CRON_SECRET`
remains a server-side manual recovery credential; it is not shared with GitHub.
GitHub can delay or drop scheduled runs under load and disables schedules in
public repositories after 60 days of inactivity. Monitor failed/missing runs and
re-enable the workflow after inactivity. A managed scheduler can replace this
trigger later without changing the app's reminder API.

Postgres `next_push_delivery()` calculates the next instant from the IANA zone.
For a nonexistent spring-forward time, delivery moves forward by the gap; for a
repeated fall-back time it uses the standard-time occurrence. Local-date delivery
claims prevent a second message if a user changes the time later the same day.
Missed runs catch up only with the current local day's verse, not a backlog.

## Safety and operations

- Only same-origin subscription mutations are accepted; JSON bodies are limited
  to 4KB, with validated key sizes and an allowlist of Apple, Mozilla, and FCM
  HTTPS push hosts. Endpoint redirects are not followed by the push client.
- A random device token is required for updates/deletion. Store only its hash
  server-side. Endpoints and keys must never be printed to logs.
- Subscription creation is limited to 20 requests per salted IP hash/day. The
  browser must support local storage for management-token persistence.
- Delivery claims have a unique `(subscription_id, local day)` key. Replaying the job
  does not resend claimed messages. This is **at-most-once attempts**, not exactly
  once delivery: a crash or transient push failure may skip that day's verse.
- Each invocation claims at most 1,000 devices and sends in batches of 50, with
  a five-second push timeout. `remaining > 0` returns 503 so an operator can
  replay the authenticated endpoint to drain the next batch; the next scheduled
  check also drains due subscriptions. Before exceeding 1,000 subscribers due in
  one interval, replace this launch-sized dispatcher with durable queued fan-out.
  Failed claimed deliveries are not automatically retried that day.
- HTTP 404/410 push responses delete expired subscriptions. Housekeeping
  deletes expired rate-limit buckets and delivery history older than 30 days.
- Turning reminders off revokes the browser subscription first, then removes
  the database record. If cleanup fails offline, later expiry handling removes it.

## Verification

`npm run verify` includes request-validation, cron authentication, service-worker
fallback, safe click navigation, and no-reader-cache regression checks, followed
by types, lint, and a production build. GitHub also smoke-tests the manifest,
icons, worker, daily verse route, and existing reader pages.

On the Vercel Preview, verify profile/permission states, manifest/icon responses,
service-worker activation, subscription creation/deletion against the isolated
database, and that Preview cannot broadcast. Before founder release, use a real
iPhone Home Screen installation and an Android installation to confirm OS push
delivery and tap navigation. Headless browser checks cannot prove OS delivery.

Run `PREVIEW_URL=https://… node scripts/preview-pwa-smoke.mjs` to check the
profile, worker, manifest, date navigation, and actual isolated subscription and
schedule persistence. Use an origin-scoped temporary `PREVIEW_BYPASS` if needed.
`CHROMIUM_PATH` selects a system browser. The browser runs with its sandbox
enabled. In a managed proxy environment, install the configured proxy CA in the
browser's trust store; certificate validation stays enabled. Screenshots contain
no credentials.

## Dependency security

Next.js and its ESLint configuration are pinned to 16.4.2. The Next ESLint plugin's
directory-glob dependency is overridden with `tinyglobby` 0.2.17, which exposes
the `globSync` / `onlyDirectories` interface used by the plugin. This removes the
unpatched `braces` dependency without downgrading Next.js or disabling lint rules.
Recheck this narrow override when upgrading the Next ESLint plugin.
GitHub verification also runs `npm audit --audit-level=high`, so high and critical
dependency advisories fail CI even if the external SonarQube app is disconnected.

Founder-local development remains http://localhost:3003. Cloud agents use the
Vercel Preview for browser validation and do not start the development server.
