## Summary

<!-- What changed and why? Link the Jira issue. -->

## Positive Evidence

<!-- Happy-path proof. Include command output, browser screenshot reference, or manual evidence link. -->

## Negative Evidence

<!-- How did you try to break the change? Invalid input, unauthorized user, bad state, missing config, etc. -->

## Edge/Boundary Evidence

<!-- Boundary values, empty state, repeated action, interrupted action, large/small payload, stale/reload case, etc. -->

## Roles/Authorization

<!-- Tester / Developer / PM behavior. If not applicable, write "N/A - <reason>". -->

## Persistence/Reload

<!-- Save -> reload -> read back proof, DB/API state proof, or "N/A - <reason>". -->

## UI/UX Review

<!-- Layout, wording, affordance, error feedback, accessibility, responsive behavior, or "N/A - <reason>". -->

## Ponytail Simplicity

<!-- Required for code changes: list ponytail skill(s) used, the simplest accepted approach, and what was intentionally not added. For non-code changes, write "N/A - documentation-only change". -->

## Ownership Knowledge Gate

<!-- Required from 2026-07-13 unless this PR is a valid Learning Material Bootstrap below. Copy/uncomment and complete this exact block; do not complete both declarations. -->
<!--
Member:
Date:
Ownership flow:
Base questions:
Inactive-day questions:
Additional-flow questions:
Score:
Critical questions:
Debug exercise:
Teach-back:
Evidence:
Result:
-->

## Learning Material Bootstrap

<!-- Alternative only for the first agent-created source-comment + knowledge-mirror rollout. Copy/uncomment and complete this block; do not complete both declarations. This declaration is invalid for any runtime, schema, service, manifest, test, dependency, or configuration change. -->
<!--
Purpose:
Runtime behavior changed: NO
Scope verified: Source comments and knowledge mirrors only
Learner:
Follow-up Knowledge Gate:
Evidence:
-->

## Known Gaps

<!-- Known limitations, untested areas, follow-up Jira links. If none, say "None". -->

## Jira/Evidence Links

<!-- Jira task, linked bugs, screenshots, test log, PR dependency. -->

## Checklist

- [ ] I tested at least one non-happy path.
- [ ] I checked role/authorization behavior or explained why it is N/A.
- [ ] I checked persistence/reload behavior or explained why it is N/A.
- [ ] I checked UI/UX consistency or explained why it is N/A.
- [ ] I applied the required Ponytail skill or explained why this is a non-code change.
- [ ] I completed the Ownership Knowledge Gate or explained why this PR predates 2026-07-13.
- [ ] I recorded actionable defects in Jira or explained why none were found.
