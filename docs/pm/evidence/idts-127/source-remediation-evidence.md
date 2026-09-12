# IDTS-127 Source Remediation Evidence

## Gate identity

- Branch: `fix/idts-127-uat-remediation-donhv`
- Frozen base: `origin/dev` at `e019f7799fd30a419fafb048b41653d72a837083`
- Scope: source, focused tests, planning catalog, knowledge mirrors, and this evidence note.
- Excluded: deployment, HANA/live data, provider calls, Jira status mutation, official workbook bytes, and Google Drive.
- Jira inventory refreshed on 2026-09-12: 16 `NOT MET`, 11 `BLOCK`, and 9 `PREPARED` cases remain from IDTS-111.

Local SQLite and source tests are regression evidence only. They do not promote any case to SAP BTP UAT PASS.

## Source changes

1. `UAT-COM-003`: CAP now applies the same 1000-character comment limit to the supported `addComment` action and the internal create path. The 1001-character rejection is HTTP 400 and leaves Comment, History, and Notification counts unchanged.
2. `UAT-BUG-008` / IDTS-119: active UPDATE is now the only owner of Bug-field Edit history. Draft SAVE keeps final validation and attachment auditing, so one title-only Save creates one grouped Edit event instead of two.
3. `UAT-ASG-007`: no runtime patch was needed. A fresh exact local reassignment proves one assignment HistoryEvent, one `REASSIGNED` Notification for the new Developer, and persisted assignee/current-action-owner readback.
4. `UAT-ATT-005`: the current model/plugin contract returns HTTP 413 with the configured 10 MB limit and creates no active attachment metadata. Native Fiori message propagation still requires deployed browser retest; no speculative UI hook was added.
5. `UAT-BUG-010`: the forward UAT catalog was corrected from “PM creates” to “PM cannot create”. The canonical role model, UI session binding, and CAP guard consistently define Tester-only Bug creation.
6. `UAT-UX-003`: the forward UAT catalog now follows SAPUI5 composite-widget keyboard semantics: Tab moves between controls, arrow keys move within a list, and Escape closes the dialog and returns focus to its trigger.
7. Historical UAT manifests and screenshots remain byte-untouched. Only the forward planning catalog was regenerated.

## Fresh verification

| Verification | Result | Supports |
|---|---:|---|
| `npm run qa:comments-attachments:programmatic` | PASS | `UAT-COM-003` boundary and no partial side effects |
| `node scripts/qa/test-idts127-draft-history.js` | PASS | `UAT-BUG-008`, `UAT-ASG-007`, and `UAT-ATT-005` backend boundary |
| `node scripts/qa/test-history-events-programmatic.js edit` | 2 PASS / 0 FAIL | generic active Edit history regression |
| `npm run qa:idts125:programmatic` | 23 PASS / 0 FAIL | attachment authorization, draft SAVE audit, and no-mutation guards |
| `node scripts/qa/test-idts6-programmatic.js` | 31 PASS / 0 FAIL | lifecycle success/reason/invalid-transition source behavior |
| `npm run qa:idts68:programmatic` | 47 PASS / 0 FAIL | grounded and sparse Handoff Summary |
| `npm run qa:idts69:programmatic` | 13 PASS / 0 FAIL | Smart Assign grounding and no mutation |
| `npm run qa:idts91:programmatic` | 19 PASS / 0 FAIL | Accept/Reject/Ignore persistence and repeated-decision rejection |
| `npm run qa:idts93:programmatic` | 35 PASS / 0 FAIL | classification apply, authorization, stale-source, and rollback |
| `npm run qa:idts95:programmatic` | 31 PASS / 0 FAIL | duplicate confirmation authorization and no-mutation guards |
| `npm run qa:idts97:programmatic` | 46 PASS / 0 FAIL | PM-only safe AI metrics and non-PM denial |
| `node scripts/qa/test-idts43-fiori-ux.js` | 18 PASS / 0 FAIL | Tester-only Create binding and current Fiori source contracts |
| `node scripts/qa/generate-idts111-uat-catalog.js --check` | 90 PASS planning cases | regenerated forward catalog is internally consistent |
| `npx cds compile srv -s all --to edmx` | PASS with one known warning | all CAP services compile; existing `NonUpdateableProperties` vocabulary warning remains |
| secret/rule/depth/AI DevKit/diff gates | PASS | no credential-like pattern; 8 agent rules; 8/8 QA Depth; AI DevKit 5/5; clean whitespace |

The legacy IDTS-110 atomic runner was intentionally not used as current-baseline proof: it rejects any baseline other than `6eb6f73840d7150598a993f8656d2b44e5b0cd4b`.

OfficeCLI preflight: `officecli --version` returned `1.0.148`. OfficeCLI does not natively edit repository Markdown, so `apply_patch` performed the reviewed Markdown changes. CAP/Fiori/UI5 MCP servers were searched for the required read-only probe but were not callable in this session; local CAP compile, maintained source contracts, and focused runtime tests were used instead.

## Disposition of all 36 remaining cases

### A. Product remediation and deployed retest — 16

| Case | Source-gate disposition | Required next evidence |
|---|---|---|
| `UAT-BUG-008` | Runtime fix implemented; exact local draft protocol PASS | Deploy SHA plus one live Edit/Save/reload trace |
| `UAT-ASG-007` | Current source exact local reassignment PASS; no patch needed | Live reassignment with one History and one Notification |
| `UAT-LIFE-002` | Current lifecycle source suite PASS | Live role/routing/readback |
| `UAT-LIFE-009` | Current lifecycle source suite PASS | Live close action/readback and exact side effects |
| `UAT-LIFE-014` | Blank reasons rejected locally with no successful transition | Live UI field message and no-mutation readback |
| `UAT-COM-003` | Runtime boundary fix implemented; local 1000/1001 PASS | Live UI 1000/1001 boundary and reload |
| `UAT-ATT-005` | HTTP 413/10 MB/no-active-metadata PASS locally | Live native Fiori message and storage readback |
| `UAT-AI-005` | Review plus allowlisted classification apply PASS locally | Deployed suggestion fixture and reload |
| `UAT-AI-008` | Sparse Handoff Summary PASS locally | Deployed sparse Bug screenshot/readback |
| `UAT-AI-009` | Grounded Smart Assign/no mutation PASS locally | Deployed candidate fixture and Cancel readback |
| `UAT-AI-010` | Review decision/reload contract PASS locally | Deployed immutable suggestion ID and reload |
| `UAT-AI-014` | Reject persistence/no business mutation PASS locally | Deployed Reject/reload evidence |
| `UAT-AI-015` | Ignore persistence/no business mutation PASS locally | Deployed Ignore/reload evidence |
| `UAT-BUG-010` | Catalog corrected; PM Create hidden and CAP denial source contracts PASS | Live PM UI plus sanitized direct HTTP 403/no-row proof |
| `UAT-UX-002` | Former label clipping not reproduced in current source; candidate reason uses wrapping controls | Tablet 834×1112 with a real multi-candidate fixture; keep IDTS-120 open until then |
| `UAT-UX-003` | Catalog corrected to Tab/arrow/Escape semantics; no speculative UI patch | Physical-keyboard desktop run with visible focus |

### B. Controlled identity/environment prerequisites — 11

These are not source failures and remain blocked until disposable fixtures are approved:

- Identity/session: `UAT-AUTH-002`, `UAT-AUTH-003`, `UAT-AUTH-004`.
- Classification/assignment: `UAT-CLS-003`, `UAT-ASG-006`.
- Storage: `UAT-ATT-003`.
- Email: `UAT-EMAIL-001`, `UAT-EMAIL-002`.
- AI/provider/security: `UAT-AI-011`, `UAT-AI-012`, `UAT-AI-016`.

No fixture was created and no provider, identity, email, S3, or HANA state was changed in this source gate.

### C. SAP BTP direct-request execution — 9

- `UAT-ASG-008`
- `UAT-LIFE-011`
- `UAT-LIFE-012`
- `UAT-LIFE-013`
- `UAT-MON-005`
- `UAT-AI-003`
- `UAT-AI-006`
- `UAT-BUG-011`
- `UAT-ATT-007`

Current local suites cover the relevant authorization, invalid-state, duplicate-request, metric, AI, Bug-create, and attachment no-mutation contracts. Final disposition still requires sanitized requests against the deployed SHA through an approved BTP runner.

## Rollout stop conditions

Stop and do not update the official workbook if any of these occurs:

- deployed SHA differs from the reviewed source head;
- CAP/AppRouter/HANA readiness is not `DEMO READY`;
- a negative case cannot prove both the expected rejection and unchanged persisted state;
- a success case produces duplicate History or Notification rows;
- the tablet candidate fixture is missing;
- evidence contains a token, cookie, private endpoint, credential, raw provider payload, or personal data.

## Tóm tắt tiếng Việt

Source gate đã sửa đúng hai lỗi runtime: comment quá 1000 ký tự và duplicate Edit history khi Save draft. Reassignment hiện tại đã đúng nên chỉ thêm exact regression test. Hai case `UAT-BUG-010` và `UAT-UX-003` là lỗi kỳ vọng/catalog, không phải lý do để mở rộng quyền PM hoặc viết custom keyboard code. Attachment quá 10 MB đã đúng ở backend nhưng vẫn phải kiểm tra message trên Fiori live. Mười một case fixture và chín case direct-request vẫn chưa được phép đổi thành PASS trước khi có deployed SHA và evidence BTP tương ứng.
