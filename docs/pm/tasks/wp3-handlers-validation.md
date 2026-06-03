# WP3 - Handler Rules and Validation

Status: Ready after WP1 and WP2
Owner workstream: Backend CAP
Last updated: 2026-06-01

## Goal

Implement backend rules that protect business-critical transitions and ownership changes.

## Inputs

- `docs/ba/03-status-transition-matrix.md`
- `docs/ba/04-requirement-backlog.md`
- WP1 data model.
- WP2 service contract.

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| WP3-T01 | Implement create/update validation for required fields and classification. | Ready after WP2 |
| WP3-T02 | Implement assignment filtering/validation using Developer Responsibility. | Ready after WP2 |
| WP3-T03 | Implement status transition validation. | Ready after WP2 |
| WP3-T04 | Implement nextProcessor auto-update rules. | Ready after WP2 |
| WP3-T05 | Create history logs for important changes. | Ready after WP2 |
| WP3-T06 | Enforce Rejected follow-up rules: rejection reason, nextProcessor, allowed follow-up transitions. | Ready after WP2 |
| WP3-T07 | Add focused backend tests or repeatable manual verification. | Ready after WP2 |

## Definition of Done

- Invalid transitions are rejected in backend.
- nextProcessor is not manually required for normal flow.
- Assignment rules are enforced beyond the UI.
- Important changes are auditable.
- Rejected bugs cannot remain without reason, owner, and next action.

Vietnamese:

- Backend phải chặn trường hợp bug chuyển sang `Rejected` mà không có lý do, owner xử lý tiếp và action tiếp theo.
