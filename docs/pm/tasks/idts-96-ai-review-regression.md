# IDTS-96: QA: Add automated regression for AI review and apply actions

## Context
AI Phase 2 introduces persisted review and controlled apply actions that require deterministic regression before UI or Shared QA sign-off.

**Owner:** NhanT
**Support:** DatDT, SangVN, DonHV
**Status:** DONE
**Due date:** 2026-07-30

## Scope
* Add API/programmatic tests for Accept, Reject, Ignore, repeat review, authorization, missing suggestion, and rollback.
* Add coverage for classification apply and duplicate confirmation as those contracts become available.
* Verify AI review never mutates unrelated workflow state.
* Store sanitized evidence in the repo and prepare Jira attachments.

## Acceptance Criteria
- [x] Positive review transition tests pass.
- [x] Invalid state, missing ID, malformed data, and unauthorized role tests pass.
- [x] Classification apply validation/rollback tests pass.
- [x] Duplicate confirmation self-link/duplicate/candidate validation tests pass.
- [x] No-mutation assertions cover handoff and Smart Assign review.
- [x] Tests are deterministic and independent of a live provider.
- [x] Evidence follows QA Depth Gate.

## Resolution
The backend foundation task (IDTS-91) by DatDT included the programmatic verification (IDTS-91, IDTS-93, IDTS-95). QA verified the execution of these programmatic regression tests locally without a live provider. Sanitized output evidence was stored under `docs/pm/evidence/idts-96/README.md`. Task is considered Done.
