# Home Screen and daily verse reminders

Bible Compass is installable through `/manifest.webmanifest`. The manifest uses
the existing Nexus paper/copper book mark at 192px and 512px, plus a maskable
512px version with extra safe space. The existing Apple touch icon is retained.
The reader's routes, theme, preferences, and content stay intact.

The service worker `/sw.js` only receives push and handles notification taps.
It does not intercept requests, cache pages, force updates, or provide offline
reading. Installation still works independently of notification availability.

## User flow

Open Your Profile → Verse of the day reminders → Enable daily verse. Permission
is requested only from that button. On iPhone/iPad, first save the app through
Share → Add to Home Screen and open the icon; web push requires iOS/iPadOS 16.4+.
Other supported browsers may allow push without installing first.

The first version sends at **08:00 UTC**, not the user's local time. Vercel's
scheduler and device delivery are best effort (Hobby cron may run within the
scheduled hour). Personal schedules and delivery guarantees are not included.
Turn reminders off in the same panel; device settings can also block them.

## Architecture

1. The browser creates a push subscription and a random device management token.
2. The same-origin API stores the endpoint, encryption keys, and a hash of that
   token in Postgres. No account, name, email, or reading history is stored.
3. A Vercel cron calls `/api/cron/daily-verse` with `Authorization: Bearer CRON_SECRET`.
4. The job selects the existing UTC editorial verse rotation, atomically claims
   one delivery per device/day, and sends through standard Web Push with VAPID.
5. A tap opens `/verse-of-the-day?date=YYYY-MM-DD` so delayed notifications open
   the verse they referred to. The new page is rendered at request time. Existing
   home-page caching is unchanged; the dedicated daily page is authoritative.

No Notion requests or database calls are added to reader page rendering. The
database and notification dependencies are confined to the notification API.
The existing verse collection and its translation labels are reused unchanged;
editorial licensing/attribution for that collection remains the release owner's
responsibility.

## Storage and configuration

Schema is versioned in `migrations/001_notifications.sql`. Apply each statement
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
broadcasting; Vercel schedules cron only for Production. All deployments follow
the repository's GitHub → Vercel flow and founder-approved merge boundary.

## Safety and operations

- Only same-origin subscription mutations are accepted; JSON bodies are limited
  to 4KB, with validated key sizes and an allowlist of Apple, Mozilla, and FCM
  HTTPS push hosts. Endpoint redirects are not followed by the push client.
- A random device token is required for updates/deletion. Store only its hash
  server-side. Endpoints and keys must never be printed to logs.
- Subscription creation is limited to 20 requests per salted IP hash/day. The
  browser must support local storage for management-token persistence.
- Delivery claims have a unique `(subscription_id, day)` key. Replaying the job
  does not resend claimed messages. This is **at-most-once attempts**, not exactly
  once delivery: a crash or transient push failure may skip that day's verse.
- Each invocation claims at most 1,000 devices and sends in batches of 50, with
  a five-second push timeout. `remaining > 0` returns 503 so an operator can
  replay the authenticated endpoint that day to drain the next batch. Before
  exceeding 1,000 subscribers, replace this launch-sized cron with durable
  queued fan-out. Failed claimed deliveries are not automatically retried.
- HTTP 404/410 push responses delete expired subscriptions. Daily housekeeping
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

Founder-local development remains http://localhost:3003. Cloud agents use the
Vercel Preview for browser validation and do not start the development server.
