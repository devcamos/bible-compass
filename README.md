# Bible Compass

Public, static-first reader for Scripture-backed paths. Notion stays the private editorial workspace. Readers never need a Notion account.

**Local:** http://localhost:3003  
**GitHub:** https://github.com/devramos/bible-compass  
**Preview:** https://bible-compass-39elm4g42-devonte-amos-projects.vercel.app  
**Backlog:** [Bible Compass Web App v0.1](https://app.notion.com/p/3be7233a96ec81ac85cfe0fe538094b9)  
**Surface:** local + Vercel Preview. Production is founder-gated.

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
