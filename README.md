# Bible Compass

Public, static-first reader for Scripture-backed paths. Notion stays the private editorial workspace. Readers never need a Notion account.

## Operating runbook

**Checklist (live):** [Bible Compass Web App v0.1](https://app.notion.com/p/3be7233a96ec81ac85cfe0fe538094b9)  
Tick boxes on Notion. Do not copy the checklist into git.

**Local:** http://localhost:3003  
**GitHub:** https://github.com/devcamos/bible-compass  
**Git Preview (SSO):** https://bible-compass-git-chore-vercel-git-wrap-devonte-amos-projects.vercel.app  
**Verify:** `npm run verify` · **Health:** `/health`  
**Pipeline:** PR [verify](https://github.com/devcamos/bible-compass/actions/workflows/verify.yml) · Preview Health [preview-health.yml](https://github.com/devcamos/bible-compass/actions/workflows/preview-health.yml). Preview ≠ Production.  
**Surface:** local + Vercel Preview. Production still waits on GO. Template: [Released app runbook](https://app.notion.com/p/3be7233a96ec8100bf7ed4d7ce997fb1).

## Public routes

Home, `/how-to-use`, `/health`, and a `/topics/[slug]` page for every path on the Notion Bible Compass hub — peace and inner life, work, family, Bible foundations, doctrine, teachings, and people worth studying.

See `src/content/` for the full slug list. `npm run verify` fails if a hub path is missing from the reader or from home navigation.

## Run

```bash
npm install
npm run dev
```

```bash
npm run verify
```

`verify` runs the content contract tests, TypeScript, ESLint (`--max-warnings=0`), and `next build`. Unit coverage is **Not measured**; the contract tests gate content completeness.

## Content import

Named editorial pages are copied into `src/content/`. Do not fetch Notion at runtime and do not paste live Notion links into the reader.

Theological guardrail: **grace is not earned through effort.** Every topic carries `graceGuardrail`.

## Out of scope

Accounts, comments, payments, database, AI chat, native app, newsletter sending, and Production release.
