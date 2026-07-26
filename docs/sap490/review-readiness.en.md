# SU26SAP01 / GSU26SAP01 SAP490 Review Readiness Register

> **IDTS-104 note (2026-07-26):** This is a historical 2026-07-10 readiness snapshot. Current versions/status are governed by PM handover, the current test pack, and `docs/sap490/generated-archive-manifest-20260726.md`; do not use the old versions below as a mentor-ready claim.

Snapshot date: 2026-07-10
Owner: DonHV / IDTS SAP01 Team
Review status: evidence-backed draft; not a final-submission declaration

## 0. Delivery Naming and Source Authority

Repository Markdown remains the canonical source. The Google Drive review root and its review copies use the `SU26SAP01_GSU26SAP01_<deliverable>_<language>_<version>_<YYYYMMDD>` naming convention. Local Office filenames may retain a generator-oriented name; they are not the Drive naming authority.

The current Drive readback confirmed the project/group root, the EN/VI review artifacts, and the Team Contribution Matrix. The root is shared as `Anyone with the link: Reader`. No Drive identifier, credential, or local sync configuration is stored in this repository.

## 1. Review Baseline

This register is the handoff map for the next SAP490 review. It was consolidated from the current CAP/Fiori source, canonical BA documents, QA scripts, and all member status files in `docs/pm/status/`.

The implemented baseline covers structured bug creation, classification, responsibility-aware assignment, lifecycle validation, comments, draft attachments, history/audit, notification records, PM monitoring, and optional AI assistance. AI remains advisory and human-review only. The optional real provider is disabled until approved private configuration and live-provider evidence are available.

## 2. Evidence Reviewed

| Evidence group | Canonical source / fresh result | Review implication |
| --- | --- | --- |
| Business and requirements | BRD v1.3, SRS v1.2, FRS v1.3 (EN/VI); project scope, business rules, diagrams, BA discovery. | Scope, roles, human authority, and AI guardrails are synchronized. |
| Source and security | CAP compile passed; secret scan passed for tracked-source scope. Local `.cdsrc-private.json` is ignored and is never uploaded. | No credential is included in the review pack. Active local credential rotation remains an external owner action. |
| Functional/AI regression | Selected auth, validation, attachment, AI provider, AI safety, and AI UI programmatic suites passed before the secret-scan gate. | Evidence supports implemented flows; it does not replace UAT sign-off. |
| Defect consolidation | All member status files were reviewed. | Only confirmed product defects are included in Test & Fix Bug; tooling, environment, data, and test-harness items remain in member status unless critical. |

## 3. Deliverable Matrix

The final column applies only after a new approved source change. It is not a claim that the listed review artifact is currently missing from Drive.

| SAP490 artifact | Current review disposition | Source and template rule | Required next action |
| --- | --- | --- | --- |
| BRD (EN/VI DOCX) | Ready for Drive review | `docs/ba/brd/*.md` regenerated to `*.docx`. | Upload timestamped raw DOCX copies. |
| SRS (EN/VI DOCX) | Ready for Drive review | `docs/ba/srs/*.md` regenerated to `*.docx`. | Upload timestamped raw DOCX copies. |
| FRS (EN/VI DOCX) | Ready for Drive review | `docs/ba/frs/*.md` regenerated to `*.docx`. | Upload timestamped raw DOCX copies. |
| Test and Fix Bug (EN/VI XLSX) | Ready for Drive review | Copied from `Test_And_Fix_Bug.xlsx`; v0.4 contains 12 confirmed product defects only. | Upload raw XLSX copies; keep member status as full issue log. |
| Blueprint (EN/VI DOCX) | Ready for Drive review | v0.2 copies v0.1/template layout and updates cover/history/current baseline without rebuilding the document. | Upload raw DOCX copies. |
| Functional Specification (EN/VI XLSX) | Synced in place; review-ready | v0.4 preserves all original workbook sheets and maps the current workflow, attachments, PM monitoring, and advisory-AI behavior. OfficeCLI validation and format/content scans are clean. | Review the existing Drive files; regenerate only after an approved source/artifact change. |
| Technical Specification (EN/VI XLSX) | Synced in place; review-ready | v0.2 maps CAP/Fiori components, standards, screen behavior, safe AI boundary, and messages. Technical cover semantics, template metadata, narrative areas, and field tables were repaired without changing the template sheet set. OfficeCLI validation and format/content scans are clean. | Review the existing Drive files; retain Markdown/source as canonical and regenerate only after an approved source/artifact change. |
| Test Scenario, Unit Test, Functional Test, Test Report | Ready for Drive review | New v0.3/v0.2 template-derived artifacts preserve their workbook structures and cover six fresh programmatic suites. | Upload raw XLSX copies. UAT remains separate. |
| UAT | Prepared only; not a completed-evidence claim | Template-derived v0.1 contains six mentor/user cases and explicitly says not executed. | Upload only as a prepared plan; record only real results/sign-off after UAT. |
| Configuration Note | Ready as a secret-free review draft | Template-derived v0.1 records CAP/Fiori configuration decisions without credentials. | Upload raw XLSX copy; update only after approved configuration changes. |
| TR Management | Ready as a CAP/Fiori change tracker | Template-derived v0.1 adapts the classic transport tracker without claiming SAP transport execution. | Upload raw XLSX copy; replace planned dates/statuses only with real release evidence. |
| Workshop deck | Out of scope for the current review pack | Preserve the school template and any existing Drive copies without modification. | No action requested. Do not regenerate, upload, rename, or delete it in this work item. |
| Final Project Report | Not ready for final submission | Preserve `Final Project Report_FHU.docx`. | Do not label as final until UAT, mentor feedback, final screenshots, and conclusion are complete. |
| SAP490 guide / naming convention | Reference only | Read-only school-provided source. | Do not edit or upload as a team-authored deliverable. |

## 4. Product-Defect Rule

`Test_And_Fix_Bug_IDTS_SAP01_*_v0.4.xlsx` contains only these confirmed product defects: `IDTS-13`, `IDTS-19`, `IDTS-32`, `IDTS-35`, `IDTS-41`, `IDTS-49`, `IDTS-52`, `IDTS-53`, `IDTS-55`, `IDTS-56`, `IDTS-58`, and `IDTS-78`.

Environment, tooling, test-harness, process, and minor data issues are not copied into that workbook. They remain in the appropriate member status file unless a serious risk requires escalation.

## 5. Drive Distribution Rule

Drive is a review/distribution copy, never the source of truth. Normally upload a new timestamped raw Office file to the `SU26SAP01_GSU26SAP01` review root only after an approved source/artifact change; do not delete prior mentor-review files. When the review owner explicitly requires stable Drive IDs/links, replace the raw Office bytes in place only after local validation and fresh metadata readback. Read the folder/file metadata back after each upload. Record any returned URL/ID only in the approved operational handover channel, never in Git-tracked source.
