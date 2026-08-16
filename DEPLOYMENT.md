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

GitHub: https://github.com/devramos/bible-compass

**Review surface (Preview):** https://bible-compass-4ohye1914-devonte-amos-projects.vercel.app  
(earlier hashed URLs remain valid for older builds)
Health: `/health`

Vercel Authentication is on for hashed Preview URLs. Open it signed in to the Vercel team.

Git auto-deploy from `main` stays off. The Vercel GitHub App could not see this new repo yet; later Git Previews need the app granted access to `devramos/bible-compass`.

## Guardian residual

The first CLI deploy still created a Production alias, even with `--target preview`:

- https://bible-compass-three.vercel.app

Leave it up unless the founder asks to take it down. Do not use it as the review surface. Founder waiver: not yet.

## Health

`GET /health` returns `{ ok: true, product: "bible-compass" }`.

Preview deployments stay `noindex`. Production indexing is gated until the founder promotes a named Preview.

Release UI and the share card must use Nexus brand colours (`refinery-brand`: cream, ink, copper). Do not invent a palette.
