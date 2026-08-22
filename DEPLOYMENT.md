# Deployment

Bible Compass is a static-first Next.js app with no database and no secrets.

## Production and `main` (founder GO)

**Founder GO for live latest:** 2026-08-22. [`vercel.json`](./vercel.json) now has:

```json
"git": {
  "deploymentEnabled": {
    "main": true
  }
}
```

| Event | What Vercel does |
| --- | --- |
| Push / PR on a **non-`main` branch** | Builds **Preview** (review surface) |
| Merge / push to **`main`** | Builds **Production** and moves the Production aliases |

Still **never** use `vercel --prod`, `vercel promote`, or MCP deploy that bypasses Git. Hosted path stays GitHub → Vercel Git wrap.

### Current aliases

| Role | URL | Notes |
| --- | --- | --- |
| Production alias | https://bible-compass-three.vercel.app | Live latest after GO |
| Team Production hostname | https://bible-compass-devonte-amos-projects.vercel.app | Same Production deployment |
| GitHub | https://github.com/devcamos/bible-compass | Org **`devcamos`** (c) |
| Local | http://localhost:3003 | In-dev only |

`bible-compass.vercel.app` may be occupied elsewhere — do not assume it is this project.

### Pausing Production again

If live auto-deploy must stop: PR that sets `git.deploymentEnabled.main` back to `false`, merge, confirm no new Production builds on later `main` merges.

## Allowed

1. Local verify: `npm run verify` then `npm run dev` on http://localhost:3003
2. Vercel **Preview** from a GitHub PR branch (Git wrap — no CLI required for Preview)
3. Production from **`main`** after founder GO through git (current state)

## Forbidden

- `vercel --prod`
- `vercel promote`
- `vercel --yes` on a new empty project (can create an unreviewed Production alias)
- Pointing Preview at any Production database or key (this app should have none)

## Health

`GET /health` returns `{ ok: true, product: "bible-compass" }`.

Preview deployments stay `noindex`. Production indexing follows the live alias after GO.

Release UI and the share card must use Nexus brand colours (`refinery-brand`: cream, ink, copper). Do not invent a palette.

## Guardian residual

The first CLI deploy created the Production alias https://bible-compass-three.vercel.app. Founder GO now uses that alias as live latest via Git `main` deploys. Do not recreate Production with CLI.
