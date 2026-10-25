# Repository rules — bible-compass

## Product application
Public static-first reader. Preserve approved content, graceGuardrail and Gospel foundations. Notion is private editorial input, not a runtime dependency; do not expose private links or inspect unrelated personal trees. Retain the approved notification-only database/scheduler exception and all other existing product scope limits.

## Verification
Current commands (package.json is authoritative):

```text
npm run verify
npm audit --audit-level=high
```

## Boundaries and evidence
Cloud follows the existing Preview-only runtime validation path; do not start dev/browser tests on localhost in the VM. Record unrun local checks and exact-head CI evidence honestly. Founder-local URL http://localhost:3003; cloud handoff leads with Preview. Manual push acceptance is not proof of banners/taps/scheduled delivery. When affected, verify scheduler identity, authorization, timing, expiry, failure and actual device behavior. Update/offline changes must preserve data and avoid private/auth response caching. Keep the approved Git-only deployment path and named-PR merge approval.

Use feature PRs; no direct main push, auto-merge, gate bypass or unapproved merge/release. Shared timing/permissions apply with only explicit scoped exceptions. Preserve stricter existing controls. Documentation-only changes check links/paths/commands; they do not change runtime behavior, gates, credentials or migrations.
