---
name: idts-handover-and-issue-logging
description: PM handover, member status, Jira hygiene, and SAP490 issue-source rules.
applies_to: every work session, PM, QA, bugs, tests, SAP490
priority: required
---

# Handover and Issue Logging

- At task start read `docs/project-context.md`, `docs/pm/current-status.md`, `docs/pm/task-board.md`, the executing member status, relevant work package, and the risk/decision log when scope, priority, ownership, or durable risk changes.
- DonHV may coordinate/consolidate other members. For any bug/test/SAP490 sync, read **all** `docs/pm/status/*.md` files before selecting evidence.
- Record every observed product, environment, tooling, test-harness, data, documentation, or process issue in the executing member status immediately, with symptom, location, root cause, fix/open state, evidence, and owner.
- The SAP490 **Test and Fix Bug** workbook contains only product defects. Keep non-product issues out of that workbook; retain minor resolved ones only in member status. Escalate non-product issues to Jira/risk log only when they block delivery, weaken evidence, create security/data risk, or need team action.
- Search Jira before creating a tracking issue. Jira summaries start with `Backend`, `FE`, `QA`, `DevOps`, `Security`, `Docs`, `UX`, `PM`, or `Bug`; include owner, due date, scope, acceptance checks, evidence, dependencies, and a no-secret note when applicable.
- Update member status after the work session; update task/work-package, board, current status, and risk log only when their purpose requires it.
