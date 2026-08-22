# Deployment

Bible Compass is a static-first Next.js app with no database and no secrets.

## Why Production does not update on merge to `main`

This is **intentional**, not a broken GitHub ↔ Vercel link.

[`vercel.json`](./vercel.json) sets:

```json
"git": {
  "deploymentEnabled": {
    "main": false
  }
}
```

| Event | What Vercel does |
| --- | --- |
| Push / PR on a **non-`main` branch** | Builds **Preview** (review surface) |
| Merge / push to **`main`** | **Does not** create or move **Production** |
| Founder GO for live latest | Enable `main` Production through git (see below), then merge — never `vercel --prod` / `vercel promote` |

So the Vercel UI filter **Environment = Production** stays on the last Production deployment until a founder-approved Production build runs. Recent merges still show under **Preview**.

### Current aliases (as of this doc)

| Role | URL | Notes |
| --- | --- | --- |
| Accidental Production alias | https://bible-compass-three.vercel.app | Created by an early CLI deploy; still the Production target alias |
| Team Production hostname | https://bible-compass-devonte-amos-projects.vercel.app | Same Production deployment |
| GitHub | https://github.com/devcamos/bible-compass | Org **`devcamos`** (c) |
| Local | http://localhost:3003 | In-dev only |

`bible-compass.vercel.app` may be occupied elsewhere — do not assume it is this project.

### How to ship live latest (founder GO only)

Follow [`sync-repo`](../../.cursor/skills/sync-repo/SKILL.md) / Nexus Guardian:

1. Preview green on the feature PR; merge to `main` as usual (Production still frozen).
2. On **explicit founder GO** for live latest: open a PR that sets `git.deploymentEnabled.main` to `true`, merge it, and wait until the Production alias SHA equals `origin/main`.
3. Do **not** use `vercel deploy --prod`, `vercel promote`, or MCP Production deploy to bypass git.

Until that GO, treat **Preview** (and localhost) as the review surfaces.

## Allowed

1. Local verify: `npm run verify` then `npm run dev` on http://localhost:3003
2. Vercel **Preview** from a GitHub PR branch (Git wrap — no CLI required for Preview)
3. Founder GO through git for Production (see above)

## Forbidden

- `vercel --prod`
- `vercel promote`
- `vercel --yes` on a new empty project (can create an unreviewed Production alias)
- Enabling `git.deploymentEnabled.main: true` without founder GO
- Pointing Preview at any Production database or key (this app should have none)

## Health

`GET /health` returns `{ ok: true, product: "bible-compass" }`.

Preview deployments stay `noindex`. Production indexing waits until a founder-approved Production release.

Release UI and the share card must use Nexus brand colours (`refinery-brand`: cream, ink, copper). Do not invent a palette.

## Guardian residual

The first CLI deploy still created a Production alias, even with `--target preview`:

- https://bible-compass-three.vercel.app

Leave it up unless the founder asks to take it down. Do not use it as the review surface unless it has been deliberately refreshed via founder GO.
