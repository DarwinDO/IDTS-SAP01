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
| 8 | IDTS-74 to IDTS-76 | DonHV / FE support | Product UI panels for duplicate/similar detection, classification suggestion, and handoff summary if full visual AI acceptance is required |

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
| 8 | IDTS-74 den IDTS-76 | DonHV / FE support | Product UI panel cho duplicate/similar detection, classification suggestion va handoff summary neu can acceptance AI day du theo UI visual |

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
- IDTS-72: Final QA acceptance was reopened for visual evidence after DonHV observed that the visible UI evidence only clearly covered Smart Assign. Fresh local acceptance passed 6/6 suites, and the visual evidence audit now lives under `docs/pm/evidence/idts-72/visual-ai-flows/`. PR #126 merged that evidence into `dev`. IDTS-74 now provides deployed product UI evidence for duplicate/similar review, and IDTS-75 now provides deployed product UI evidence for classification suggestion review. Closure still depends on completing `IDTS-76`, or explicitly accepting API-level evidence for handoff summary.
- IDTS-74: Done. PR #130 was squash-merged into `dev` at `d5e9549`. The Object Page has a `Find Similar Bugs` review entry point that calls the existing `suggestSimilarBugs` action through `DuplicateReview.js`, reuses `AiReviewUi`, and remains review-only with no automatic `DuplicateLinks` write. Render deploy `dep-d97p0sq8qa3s73f4tagg` reached `live`; local focused QA passed 133 checks, local browser smoke passed 6/6, authenticated Render AI smoke passed 25/25, and shared-QA browser evidence captured the deployed dialog and candidate.
- IDTS-75: Done at repository and shared-QA evidence level. PR #132 was squash-merged into `dev` at `1fe23ac`; Render deploy `dep-d97q2d7avr4c73ddtg60` is live; authenticated Render AI API smoke passed `25/0`; and shared-QA browser smoke proves the deployed `Classification Assistance` dialog opens from Object Page, compares current/suggested catalog values, keeps manual-review copy visible, and exposes no internal copy. Evidence is under `docs/pm/evidence/idts-75/`.
- IDTS-76: Created under Epic `IDTS-62` as the bug handoff summary AI review panel follow-up. It blocks full visual closure of `IDTS-72` and relates to backend task `IDTS-68`.
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
- IDTS-72: Final QA acceptance da duoc reopen de bo sung visual evidence sau khi DonHV thay evidence UI nhin thay ro moi cover Smart Assign. Fresh local acceptance pass 6/6 suite, va evidence audit moi nam trong `docs/pm/evidence/idts-72/visual-ai-flows/`. PR #126 da merge evidence nay vao `dev`. IDTS-74 da co evidence UI san pham tren ban deploy cho duplicate/similar review, va IDTS-75 da co evidence UI san pham tren ban deploy cho classification suggestion review. Viec dong task van phu thuoc vao hoan tat `IDTS-76`, hoac chap nhan ro rang API-level evidence cho handoff summary.
- IDTS-74: Done. PR #130 da squash-merge vao `dev` tai `d5e9549`. Object Page co entry `Find Similar Bugs` de review, goi action da co `suggestSimilarBugs` qua `DuplicateReview.js`, reuse `AiReviewUi`, va van chi la review-only, khong tu ghi `DuplicateLinks`. Render deploy `dep-d97p0sq8qa3s73f4tagg` da `live`; focused QA local pass 133 check, browser local pass 6/6, authenticated Render AI smoke pass 25/25, va shared-QA browser evidence da chup dialog cung candidate tren ban deploy.
- IDTS-75: Done o muc repository va shared-QA evidence. PR #132 da squash-merge vao `dev` tai `1fe23ac`; Render deploy `dep-d97q2d7avr4c73ddtg60` dang live; authenticated Render AI API smoke pass `25/0`; va shared-QA browser smoke chung minh dialog `Classification Assistance` da deploy, mo duoc tu Object Page, so sanh current/suggested catalog value, giu copy manual-review va khong lo internal copy. Evidence nam trong `docs/pm/evidence/idts-75/`.
- IDTS-76: Da tao duoi Epic `IDTS-62` lam follow-up panel review AI bug handoff summary. Task nay block viec dong `IDTS-72` theo tieu chi visual day du va relate voi backend task `IDTS-68`.
- IDTS-63 không thêm dependency AI runtime, API, CDS entity hoặc UI mới.
