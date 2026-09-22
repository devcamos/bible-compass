---
name: wait-for-pr-checks
description: "After opening a draft PR, watch CI until every required check on the current head is green, then mark the PR ready for review (not draft). Use before nexus-pr-review handoff."
---

# wait-for-pr-checks

Path (repo mirror): `.cursor/skills/wait-for-pr-checks/SKILL.md`  
Pack: agent-onboarding · Related: `nexus-pr-review` · `fix-broken-pipeline`

## Rule (verbatim)

After raising a PR, the agent should wait and check the pipeline to ensure all checks have passed.

Raising the PR is not done. Own the remote gate until it is green **and the PR is open (not draft)**, or blocked with evidence.

## Order

1. Record PR URL + head SHA (after push).
2. Watch until terminal on the **current** head SHA:
   - Prefer `cursor-subscriptions-subscribe_github_ci` (GitHub) or `cursor-subscriptions-subscribe_origin_ci` (Origin) after push; on wake, re-read checks on the PR head.
   - Or poll: `gh pr checks <n> --watch` (exit 8 = pending); use backoff from `nexus-pr-review` when not subscribing.
3. **When every required non-skipped check is green on that SHA** → mark the PR ready for review:
   - Cloud Agent: `ManagePullRequest` with `action: update_pr`, `branch_name` (or `pr_url`), and **`draft: false`**.
   - CLI: `gh pr ready <n>`.
   - Do not seek human review while the PR is still draft.
4. Green + open → continue with `nexus-pr-review` handoff (Preview URL, confirm table, localhost last).
5. Red → `fix-broken-pipeline`, fix, push, restart from step 1 with the new head SHA.

## Done only when

- Every reported non-skipped, non-neutral check on the **current** PR head SHA is green, **and**
- The PR is **open** (not draft) when those checks are green, **or**
- A genuine blocker is reported with the next human action.

Empty check list right after open ≠ green.

## Hard no’s

- Hand off “PR opened” without watching checks
- Claim green while checks are pending or the head SHA moved
- **Leave the PR in draft after required checks on the current head are green**
- Merge solely because the watch finished
- Weaken gates / skip hooks to go green
