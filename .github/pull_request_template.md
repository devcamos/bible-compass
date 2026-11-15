## Summary
<!-- Why this exists. 1–3 bullets. Lead with the user outcome. -->

- Product: Bible Compass
- Surface: local / Preview / Production (Production only after founder approval)

## Issue
Closes #<issue>
<!-- Required. One GitHub issue per PR so merge auto-closes it. Do not use this PR for a second issue. GitHub issues are the source of truth for engineering work. -->

## Type
<!-- Pick one and apply the matching repository label (feature, bug, hotfix, revert; chore may use documentation or dependencies). -->
- [ ] feature
- [ ] fix
- [ ] hotfix
- [ ] revert
- [ ] chore

## Planned Change
- Intent:
- Scope:
- Non-goals:
- Acceptance:

## Testing
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

## Risk / rollback
<!-- Remaining risk. What you did not test. How to roll this back if needed. -->

## Release boundary
- [ ] Agent has **not** merged this PR
- [ ] Auto-merge is disabled
- [ ] Founder approval is required before merge
- [ ] Green means **ready for founder review**, not permission to release

## Handoff
- Chat completion: localhost URL (required — Preview does not replace it)
- Preview: (PR review — Vercel Preview URL)
- Local / Wi-Fi: in-dev only (last in Slack/PR)
