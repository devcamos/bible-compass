## Summary
<!-- Why this exists. 1–3 bullets. Lead with the user outcome. -->

- Product: Bible Compass
- Backlog / issue: https://app.notion.com/p/3be7233a96ec81ac85cfe0fe538094b9
- Surface: local / Preview / Production (Production only after founder approval)

## Planned Change
- Intent:
- Scope:
- Non-goals:
- Acceptance:

## Test plan
- [ ] DoR was met before implementation
- [ ] Product verify command passed (`npm run verify`)
- [ ] Runtime smoke test passed for `/` and `/health`
- [ ] E2E journey from `products/agent-onboarding/E2E.md` clicked on local
- [ ] Vercel Preview status is green
- [ ] Preview URL checked (PR review surface — not localhost)
- [ ] Nexus brand colours on UI + share/Open Graph card (`refinery-brand`; no invented palette)
- [ ] Tests updated; new code covered (target ≥90% where coverage is measured — currently **Not measured**)
- [ ] Docs updated only if this is a large architecture change
- [ ] No Production DB/keys used from Preview
- [ ] No secrets, broker keys, or raw tokens in the diff
- [ ] Auth-scoped data access unchanged or reviewed
- [ ] Docs / backlog updated
- [ ] How-to / Preview / practice / Nexus ops change: Notion + `#reality-orbit` card + products `agent-onboarding/HOW-TO-UPDATES.md` (not Slack-only)

## Release boundary
- [ ] Agent has **not** merged this PR
- [ ] Auto-merge is disabled
- [ ] Founder approval is required before merge
- [ ] Green means **ready for founder review**, not permission to release

## Risk
<!-- Remaining risk. What you did not test. -->

## Handoff
- Chat completion: localhost URL (required — Preview does not replace it)
- Preview: (PR review — Vercel Preview URL)
- Local / Wi-Fi: in-dev only (last in Slack/PR)
