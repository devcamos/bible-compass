# Deployment

Bible Compass is a static-first Next.js app with no database and no secrets.

## Current release model

Bible Compass currently uses GitHub → Vercel Git integration.

| Event | Expected behaviour |
| --- | --- |
| Push / PR on a non-`main` branch | Vercel builds Preview |
| Pull request CI | GitHub verifies tests, types, lint, build and local runtime smoke tests |
| Founder-approved merge to `main` | Vercel starts Production deployment |
| Push to `main` | GitHub re-verifies the exact merged revision |
| Production completion | GitHub proves the live `/health` endpoint reports the exact `main` commit |

Agents must stop at a green pull request and provide the PR link. Agents do not merge, enable auto-merge, or approve their own release.

## Release gates

### Gate 1 — Engineering quality

Required before review:

- `npm ci`
- content contract tests
- generated Next route types
- TypeScript
- ESLint with zero warnings
- `next build`
- local runtime smoke test of `/` and `/health`

### Gate 2 — Product approval

Required before merge:

- Vercel Preview deployment green
- requested behaviour reviewed
- no unexpected product/content changes
- founder approval

For Bible Compass today, founder approval to merge is also the release approval because Production tracks `main`.

### Gate 3 — Release proof

After an approved merge:

1. GitHub runs the complete verification suite against the exact `main` revision.
2. Vercel builds Production through its Git integration.
3. GitHub polls `https://bible-compass-three.vercel.app/health`.
4. The release is proven only when the health response is healthy **and** its `commit` equals the exact GitHub `main` SHA.
5. If the expected SHA never becomes live, the release check fails visibly rather than accepting a stale Production alias.

This protects against the failure mode where a previous Production deployment remains healthy while the new deployment has actually failed.

## Reproducibility

Vercel and GitHub both install dependencies with `npm ci`, using the committed lockfile. Do not replace this with `npm install` in CI/Production builds.

Target principle: **build once, promote many**. The current Vercel Git flow still performs an environment build, so Bible Compass does not yet claim literal immutable-artifact promotion. Until that is introduced deliberately, deterministic installs, exact-revision verification and deployed-commit proof are mandatory controls.

## Current aliases

| Role | URL | Notes |
| --- | --- | --- |
| Production alias | https://bible-compass-three.vercel.app | Live alias |
| Team Production hostname | https://bible-compass-devonte-amos-projects.vercel.app | Same Production project |
| GitHub | https://github.com/devcamos/bible-compass | Repository |
| Local | http://localhost:3003 | Local development |

`bible-compass.vercel.app` may be occupied elsewhere. Do not assume it is this project.

## Allowed

1. Feature branch changes
2. GitHub pull request
3. `npm run verify`
4. GitHub Actions verification
5. Vercel Preview from the PR
6. Founder-approved merge
7. Production through Vercel Git integration after that merge

## Forbidden

- Direct push to `main`
- Agent merge or auto-merge
- `vercel --prod`
- `vercel promote`
- direct MCP/CLI deployment bypassing Git
- `vercel --yes` on a new empty project
- silencing a failed test/check
- claiming a release is healthy only because an old Production alias still returns 200

## Health

`GET /health` returns release identity as well as liveness, including:

```json
{
  "ok": true,
  "product": "bible-compass",
  "version": "0.1.0",
  "surface": "production",
  "commit": "<VERCEL_GIT_COMMIT_SHA>"
}
```

Local execution reports `surface: "local"` and `commit: "local"`.

## Recovery

If a Production deployment fails:

1. Do not merge another speculative fix.
2. Capture the failed deployment ID and Vercel build logs.
3. Confirm whether the failure is source, dependency/build, environment or Vercel/platform related.
4. Repair on a new branch.
5. Require GitHub verification and Vercel Preview green.
6. Obtain founder approval.
7. Merge only the reviewed repair.
8. Confirm the exact merged SHA is reported by Production `/health`.

Production is not considered recovered until the expected commit is serving successfully.
