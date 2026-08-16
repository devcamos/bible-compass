# Deployment

Bible Compass is a static-first Next.js app with no database and no secrets.

## Allowed

1. Local verify: `npm run verify` then `npm run dev` on http://localhost:3003
2. Vercel **Preview** from a Git branch or `vercel deploy` (never `--prod`)
3. Founder GO, then promote

## Forbidden

- `vercel --prod`
- `vercel --yes` on a new empty project (this can create an unreviewed Production alias)
- Git auto-deploy from `main` to Production until the founder asks — `vercel.json` sets `git.deploymentEnabled.main` to `false`
- Pointing Preview at any Production database or key (this app should have none)

## First Preview

GitHub: https://github.com/devcamos/bible-compass  
Vercel project: `bible-compass` on team `devonte-amos-projects` — Git is connected to that repo.

**Review surface (hashed CLI Preview, still valid):** https://bible-compass-4ohye1914-devonte-amos-projects.vercel.app  
**Git Preview (SSO, this wrap):** https://bible-compass-git-chore-vercel-git-wrap-devonte-amos-projects.vercel.app  
**Live checklist:** https://app.notion.com/p/3be7233a96ec81ac85cfe0fe538094b9  
Git Previews come from non-`main` branches after the Git wrap. Health: `/health`

Vercel Authentication is on for hashed Preview URLs. Open it signed in to the Vercel team.

Git auto-deploy from `main` stays **off** (`vercel.json` `git.deploymentEnabled.main: false`). Production is founder GO only. Do not `vercel --prod`.

## Guardian residual

The first CLI deploy still created a Production alias, even with `--target preview`:

- https://bible-compass-three.vercel.app

Leave it up unless the founder asks to take it down. Do not use it as the review surface. Founder waiver: not yet.

## Pipeline

**PR CI:** `.github/workflows/verify.yml` — `npm run verify` (content contract, typecheck, ESLint, static build).  
**Preview Health:** `.github/workflows/preview-health.yml` — curls **Preview** `/health` only. Shape is API Sandbox [PR #33](https://github.com/devcamos/apisandbox/pull/33). Preview ≠ Production.

How-to: `products/agent-onboarding/PREVIEW-PIPELINE.md`

## Health

`GET /health` returns `{ ok: true, product: "bible-compass" }`.

Preview deployments stay `noindex`. Production indexing is gated until the founder promotes a named Preview.

Release UI and the share card must use Nexus brand colours (`refinery-brand`: cream, ink, copper). Those hexes are the colour reference for **all** UI work, not only release. Do not invent a palette.
