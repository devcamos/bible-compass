<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Bible Compass — agent rules

Public static-first reader. Notion is private editorial source, never a runtime dependency.

- Do not add accounts, comments, payments, a database, AI chat, newsletter sending, or a native app in v0.1.
- No direct pushes to Production or Preview. Every change must use a feature branch and GitHub pull request.
- **Agents must not merge pull requests, enable auto-merge, or bypass founder approval.** An agent may create a PR, repair failing checks, and report the PR only when required CI and Vercel checks are green. Founder approval is required before merge.
- Founder GO 2026-08-22 enabled `git.deploymentEnabled.main: true`, so Bible Compass currently treats an approved merge to `main` as the Production release action. Do not change that release mapping without a new founder decision.
- Do not `vercel deploy`, `vercel --prod`, `vercel promote`, or first-deploy `--yes`. Preview and Production stay on the GitHub → Vercel Git path.
- Do not publish live Notion URLs in the reader. Import named topics into `src/content/`.
- Do not walk personal Notion trees. v0.1 source is the named routes on the Nexus Products item.
- **Grace is not earned through effort.** Every topic must keep a `graceGuardrail`. Jesus and the Gospel stays the foundational route.
- Keep Slack / Notion DNA (calm paper, soft callouts, simple icons). Colours on the reader and the share card must come from the Nexus kit (`refinery-brand`). Do not invent a palette on release.
- Do not restyle away from that DNA in layout or chrome.
- Verify with `npm run verify`. Local URL: http://localhost:3003
- After completing work in this chat, include http://localhost:3003 in the reply. Preview does not replace localhost.
