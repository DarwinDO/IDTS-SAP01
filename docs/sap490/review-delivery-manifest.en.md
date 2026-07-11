# SU26SAP01 / GSU26SAP01 SAP490 Review Delivery Manifest

Snapshot date: 2026-07-11
Owner: DonHV / GSU26SAP01

## Purpose

This manifest links the review deliverables to their canonical repository sources without storing Drive IDs, credentials, or local sync configuration. It is a traceability record, not a final-submission claim.

## Naming and access evidence

- The Google Drive review root and review artifacts use `SU26SAP01_GSU26SAP01_<deliverable>_<language>_<version>_<YYYYMMDD>`.
- A 2026-07-10 Drive metadata readback confirmed the review root is shared as `Anyone with the link: Reader`.
- A folder readback confirmed EN/VI review artifacts and the native Team Contribution Matrix under its dedicated team-contributions folder.
- Drive IDs and URLs remain outside Git-tracked documents. Use the approved operational handover channel when a reviewer needs a direct link.

## Canonical source map

| Deliverable family | Canonical repository source | Review artifact rule |
| --- | --- | --- |
| BRD, SRS, FRS (EN/VI) | `docs/ba/brd/`, `docs/ba/srs/`, `docs/ba/frs/` Markdown | Regenerate editable DOCX from approved Markdown; use a new timestamped Drive review copy. |
| Blueprint, functional/technical specification | `docs/project-context.md`, canonical BA documents, `docs/sap490/review-readiness.*.md` | Copy the school template before filling; preserve cover, history, sheets, and layout. |
| Test Scenario, Unit Test, Functional Test, Test Report, UAT | `docs/pm/evidence/`, `docs/pm/status/`, QA scripts, test-workbook generators | Preserve workbook structure and formulas. UAT stays prepared until real execution/sign-off exists. |
| Test and Fix Bug | Confirmed product defects and their evidence | Include product defects only. Tooling, environment, data, and test-harness issues remain in member status unless escalation is required. |
| Team Contribution Matrix | `scripts/sap490/build-team-contribution-matrix.mjs`, Git/Jira/task/status evidence | Keep member work, Jira/PR references, and evidence links auditable in the dedicated Drive folder. |
| Diagram Pack | `docs/diagrams/*.md`, `docs/diagrams/rendered/manifest.json`, rendered SVG and source fragments | Keep 21 canonical diagrams, editable source, SVG review assets, and a native Google Slides review deck together in the timestamped Diagram Pack folder. |

## Update and review procedure

1. Approve and commit the canonical Markdown/source change.
2. Regenerate the affected Office artifact from a copied template; do not edit a school template in place.
3. Verify document pages, spreadsheet layout/formulas, or slide rendering as applicable.
4. Upload a new timestamped review copy whose name begins with `SU26SAP01_GSU26SAP01`.
5. Read back the Drive folder and update the PM handover outside Git with any direct links.

## Current limitations

This source update corrects traceability and naming rules. Workshop decks are explicitly outside this work item and are left untouched. A new Review Readiness DOCX/Drive version is required only after this source branch is approved for release; no existing mentor-review file is overwritten by this branch.
