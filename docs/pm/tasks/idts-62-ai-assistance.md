# IDTS-62 - AI Assistance Work Package

Last updated: 2026-07-08

## Purpose

Track the approved AI suggestion capabilities without turning IDTS into an autonomous workflow agent. The authoritative guardrail baseline is `docs/ba/discovery/idts-63-ai-assistance-guardrails.md`.

Vietnamese: Work package này theo dõi các khả năng AI suggestion đã duyệt nhưng không biến IDTS thành autonomous workflow agent. Baseline guardrail chính thức nằm tại `docs/ba/discovery/idts-63-ai-assistance-guardrails.md`.

## Delivery order

| Order | Jira | Owner | Result required |
| --- | --- | --- | --- |
| 1 | IDTS-63 | DonHV | Scope, data boundary, fallback, human review, and audit baseline |
| 2 | IDTS-64 | DonHV | Disabled-by-default provider abstraction and mock provider |
| 3 | IDTS-65 | DonHV | Read-safe suggestion audit model and backend-owned write path |
| 4 | IDTS-66 to IDTS-69 | Feature owners | Four approved AI capabilities implemented incrementally |
| 5 | IDTS-70 | DatDT | SAP Fiori review UI for suggestions |
| 6 | IDTS-71 | DonHV | Security and prompt-misuse review |
| 7 | IDTS-72 | NhanT | Final QA acceptance |

Vietnamese:

| Thứ tự | Jira | Owner | Kết quả bắt buộc |
| --- | --- | --- | --- |
| 1 | IDTS-63 | DonHV | Chốt scope, data boundary, fallback, human review và audit baseline |
| 2 | IDTS-64 | DonHV | Provider abstraction mặc định tắt và mock provider |
| 3 | IDTS-65 | DonHV | Suggestion audit model read-safe và chỉ backend được ghi |
| 4 | IDTS-66 đến IDTS-69 | Các feature owner | Triển khai dần bốn khả năng AI đã duyệt |
| 5 | IDTS-70 | DatDT | SAP Fiori review UI cho suggestion |
| 6 | IDTS-71 | DonHV | Review security và prompt misuse |
| 7 | IDTS-72 | NhanT | QA acceptance cuối |

## Sprint decision

Only IDTS-63 is added to Sprint 4. Runtime implementation starts in Sprint 5 after Sprint 4 stabilization and Render PostgreSQL continuity work. IDTS-64 and IDTS-65 may proceed in parallel only after IDTS-63 is Done; feature tasks wait until both foundations are accepted.

Vietnamese: Chỉ IDTS-63 được đưa vào Sprint 4. Phần runtime bắt đầu ở Sprint 5 sau khi hoàn tất stabilization Sprint 4 và bảo đảm tính liên tục của Render PostgreSQL. IDTS-64 và IDTS-65 chỉ được làm song song sau khi IDTS-63 Done; các feature task phải chờ cả hai nền tảng được accept.

## Current status

- IDTS-63: Done at repository handoff level. PR #93 was merged into `dev` on 2026-07-07 with `qa-depth-gate` passing.
- IDTS-64: Done at repository handoff level. PR #106 was merged into `dev` on 2026-07-08 with `qa-depth-gate` passing. Backend AI now has a disabled-by-default provider abstraction, deterministic mock provider, sanitized failure/timeout behavior, private config placeholders, focused programmatic evidence, and knowledge mirrors.
- IDTS-65 to IDTS-72: Planned after IDTS-64 foundation; Jira due dates should be realigned when Sprint 5 is created if they remain outside the active Sprint 4 focus.
- No runtime AI dependency, API, CDS entity, or UI has been added under IDTS-63.

Vietnamese:

- IDTS-63: Done ở mức handoff repository. PR #93 đã merge vào `dev` ngày 2026-07-07 và `qa-depth-gate` đã pass.
- IDTS-64: Done ở mức repository handoff. PR #106 đã merge vào `dev` ngày 2026-07-08 và `qa-depth-gate` đã pass. Backend AI hiện có provider abstraction mặc định tắt, mock provider deterministic, failure/timeout đã sanitize, private config placeholder, evidence programmatic tập trung và knowledge mirrors.
- IDTS-65 đến IDTS-72: Làm sau foundation IDTS-64; due date Jira nên realign khi tạo Sprint 5 nếu các task này không thuộc focus active Sprint 4.
- IDTS-63 không thêm dependency AI runtime, API, CDS entity hoặc UI mới.
