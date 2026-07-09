# IDTS-62 - AI Assistance Work Package

Last updated: 2026-07-09

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
- IDTS-65: Done at repository and Jira handoff level. PR #108 was merged into `dev` on 2026-07-08 at `a9c56b4` with `qa-depth-gate` passing, Jira comment `10422`, and Jira status Done. Backend AI now has a durable suggestion audit model, read-only OData projection, backend-owned sanitized writer, seed data, focused QA, evidence, and knowledge mirrors.
- IDTS-66: Done at repository and Jira handoff level. PR #110 was squash-merged into `dev` on 2026-07-08 at `ea0b370`; final `qa-depth-gate` passed, focused QA passed `30/0`, Jira closure comment is `10426`, and Jira status is Done. Backend exposes authenticated suggestion-only hybrid ranking, safe deterministic fallback, source-linked sanitized audit, and no-auto-link behavior.
- IDTS-67: Done at repository and Jira handoff level. PR #113 was squash-merged into `dev` at `d167613`; final `qa-depth-gate` passed, focused QA passed `22/0`, Jira closure comment is `10430`, and Jira status is Done. Backend now exposes suggestion-only classification recommendations with strict active-catalog validation, low-confidence/invalid statuses, sanitized source-linked audit, and no mutation of `Bugs`.
- IDTS-68: Done at repository handoff level. PR #115 was squash-merged into `dev` at `d5e4297`; final `qa-depth-gate` passed, focused QA passed `28/0`, AI regression IDTS-64 to IDTS-68 passed, Jira evidence comment is `10431`, and backend now exposes grounded bug/handoff summary suggestions with provider/fallback handling, sanitized `BUG_SUMMARY` audit, and no mutation of `Bugs`.
- IDTS-69: Done at repository and Jira handoff level. PR #117 was squash-merged into `dev` at `ccaab62`; final `qa-depth-gate` passed, focused QA passed IDTS-69 `6/0` and IDTS-56 `13/0`, AI regression IDTS-64 to IDTS-68 remained green, Jira comments `10433` and `10434` record evidence/closure, and Jira status is Done. Smart Assign now shows reviewable AI explanations while keeping manual assignment and backend validation as final authority.
- IDTS-70: Done at repository and Jira handoff level. PR #119 was squash-merged into `dev` at `05f46b1`; final `qa-depth-gate` passed, focused QA passed IDTS-70 `7/0` and IDTS-56 `13/0`, Jira comment `10435` records evidence/closure, and Jira status is Done. The UI now has reusable Fiori AI review mapping in `AiReviewUi.js`, Smart Assign uses it for explanation status/copy, and user-facing AI copy avoids internal/dev-facing terms.
- IDTS-71: Repository implementation and shared-QA Render smoke are complete at handoff level. PR #121 was merged into `dev` at `003230b`; shared QA Render deploy reached `live`; local security review passed `qa:idts71:programmatic` with `31 PASS / 0 FAIL`; authenticated Render smoke passed `qa:idts71:render-smoke` with `25 PASS / 0 FAIL`. One follow-up PR is being opened only to harden the smoke script's OData filter encoding and prevent bearer-token values from being written into evidence.
- IDTS-72: Planned after IDTS-71 completion; next step is final QA acceptance.
- No runtime AI dependency, API, CDS entity, or UI has been added under IDTS-63.

Vietnamese:

- IDTS-63: Done ở mức handoff repository. PR #93 đã merge vào `dev` ngày 2026-07-07 và `qa-depth-gate` đã pass.
- IDTS-64: Done ở mức repository handoff. PR #106 đã merge vào `dev` ngày 2026-07-08 và `qa-depth-gate` đã pass. Backend AI hiện có provider abstraction mặc định tắt, mock provider deterministic, failure/timeout đã sanitize, private config placeholder, evidence programmatic tập trung và knowledge mirrors.
- IDTS-65: Done ở mức repository và Jira handoff. PR #108 đã merge vào `dev` ngày 2026-07-08 tại `a9c56b4`, `qa-depth-gate` pass, Jira có comment `10422` và status Done. Backend AI hiện có suggestion audit model bền vững, OData projection read-only, backend-owned sanitized writer, seed data, focused QA, evidence và knowledge mirrors.
- IDTS-66: Done o muc repository va Jira handoff. PR #110 da squash-merge vao `dev` ngay 2026-07-08 tai `ea0b370`; final `qa-depth-gate` pass, focused QA pass `30/0`, Jira closure comment la `10426` va Jira status la Done. Backend expose suggestion-only hybrid ranking co authentication, deterministic fallback an toan, source-linked audit da sanitize va no-auto-link.
- IDTS-67: Done o muc repository va Jira handoff. PR #113 da squash-merge vao `dev` tai `d167613`; final `qa-depth-gate` pass, focused QA pass `22/0`, Jira closure comment la `10430` va Jira status la Done. Backend expose classification recommendation theo co che suggestion-only, validate AI provider output voi active catalog, co status low-confidence/invalid, audit da sanitize khi co source bug va khong mutate `Bugs`.
- IDTS-68: Done o muc repository handoff. PR #115 da squash-merge vao `dev` tai `d5e4297`; final `qa-depth-gate` pass, focused QA pass `28/0`, AI regression IDTS-64 den IDTS-68 pass, Jira evidence comment la `10431`, va backend hien expose suggestion bug/handoff summary co can cu voi provider/fallback handling, audit `BUG_SUMMARY` da sanitize, va khong mutate `Bugs`.
- IDTS-69: Done o muc repository va Jira handoff. PR #117 da squash-merge vao `dev` tai `ccaab62`; final `qa-depth-gate` pass, focused QA IDTS-69 `6/0` va IDTS-56 `13/0` pass, AI regression IDTS-64 den IDTS-68 van green, Jira comments `10433` va `10434` ghi evidence/closure, va Jira status la Done. Smart Assign hien co AI explanation de review nhung van giu manual assignment va backend validation la lop quyet dinh cuoi.
- IDTS-70: Done o muc repository va Jira handoff. PR #119 da squash-merge vao `dev` tai `05f46b1`; final `qa-depth-gate` pass, focused QA IDTS-70 `7/0` va IDTS-56 `13/0` pass, Jira comment `10435` ghi evidence/closure, va Jira status la Done. UI hien co reusable Fiori AI review mapping trong `AiReviewUi.js`, Smart Assign dung helper nay cho explanation status/copy, va AI copy user-facing tranh cac tu noi bo/dev-facing.
- IDTS-71: Implementation repository va Render shared-QA smoke da xong o muc handoff. PR #121 da merge vao `dev` tai `003230b`; Render shared QA da deploy `live`; local security review pass `qa:idts71:programmatic` voi `31 PASS / 0 FAIL`; authenticated Render smoke pass `qa:idts71:render-smoke` voi `25 PASS / 0 FAIL`. Dang mo mot PR follow-up nho chi de harden script smoke: sua OData filter encoding va khong ghi bearer-token value vao evidence.
- IDTS-72: Len ke hoach sau khi IDTS-71 xong; buoc tiep theo la final QA acceptance.
- IDTS-63 không thêm dependency AI runtime, API, CDS entity hoặc UI mới.
