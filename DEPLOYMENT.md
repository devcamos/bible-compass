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

Create GitHub `devramos/bible-compass`, add the Vercel project first (`vercel project add`), link it, then `vercel deploy` without `--prod`. Record the Preview URL on the Notion item and in `#nexus-trace`.

## Health

`GET /health` returns `{ ok: true, product: "bible-compass" }`.

Preview deployments stay `noindex`. Production indexing is gated until the founder promotes a named Preview.
