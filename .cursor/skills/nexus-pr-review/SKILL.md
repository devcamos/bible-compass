+---
name: nexus-pr-review
description: >-
  Poll PR checks until settled, confirm the branch is healthy, and request human
  review only after the current checks are green.
---

# Skill: nexus-pr-review

Use this flow after a feature branch has been pushed to a pull request and before
asking a human to review it. The review surface is GitHub; repository-specific
instructions and release rules always take precedence.

## Happy path

1. Push the feature branch and open the pull request as a draft when practical.
2. Retry-poll the pull request checks until they reach a terminal state.
3. Only when the checks are green, mark the pull request ready for review.
4. Then post the review request with the pull request URL and the relevant preview
   or local verification link.

Do not request review while required checks are pending or failing.

## Retry and backoff

Do not take a one-shot snapshot of CI. Run:

\`\`\`bash
gh pr checks <number> --repo <owner/repo>
gh pr view <number> --repo <owner/repo> --json statusCheckRollup
\`\`\`

Use this simple backoff schedule:

| Polls | Wait before the next poll |
| --- | --- |
| 1–6 | 20 seconds |
| 7–20 | 30 seconds |

This gives CI about 9 minutes to settle while avoiding unnecessary API traffic.
Stop when no check remains \`pending\`, \`queued\`, \`in_progress\`, or
\`EXPECTED\`.

Green means:

- every required check has passed;
- skipped optional checks are not treated as failures;
- every other reported check is passed or explicitly documented as non-blocking;
- an empty check set is not treated as success.

If a required check fails, do not keep retrying the failure. Reproduce the cause,
fix it on the branch, push the fix, and restart polling from poll 1. If the pull
request head SHA changes, discard the previous green result and verify the new
head from the beginning.

## Review handoff

Before requesting review:

- confirm the pull request is still open and conflict-free;
- re-read the current head SHA and check results;
- include the pull request URL first;
- include the Preview URL when the repository provides one;
- include localhost or Wi-Fi URLs only as in-development links;
- summarize validation and any skipped or non-blocking checks.

Do not merge, enable auto-merge, deploy directly, or bypass the repository's Git
release path unless the repository instructions and an explicit owner decision
authorize it.

