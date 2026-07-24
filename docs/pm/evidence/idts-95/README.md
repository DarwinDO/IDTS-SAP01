# IDTS-95 - Confirm Accepted Similar Bug Suggestion

## English

Date: 2026-07-24

Owner: SangVN

Branch: `feature/idts-95-confirm-duplicate-suggestion-sangvn`

Dependency baseline: PR #167, `feature/idts-91-93-implementation-datdt`

### Scope verified

- A Tester or PM can confirm one candidate from an accepted, current `DUPLICATE_DETECTION` suggestion.
- Candidate membership and relation type come only from the persisted safe suggestion payload.
- Self-links, candidates outside the payload, missing Bugs, inactive relation types, and existing links in either direction are rejected.
- Pending, rejected, ignored, expired, and wrong-feature suggestions cannot create a link.
- Developer confirmation is rejected with HTTP 403.
- Confirmation creates exactly one `DuplicateLink` and does not change Bug status or assignee.
- A forced post-handler failure rolls the insert back.
- Existing suggestion generation, review actions, classification application, and AI security behavior remain green.

### Verification

| Command | Result |
| --- | --- |
| `npm run qa:idts95:programmatic` | PASS, 31/31 |
| `npm run qa:idts66:programmatic` | PASS, 34/34 |
| `npm run qa:idts91:programmatic` | PASS, 19/19 |
| `npm run qa:idts93:programmatic` | PASS, 35/35 |
| `npm run qa:idts71:programmatic` | PASS, 31/31 |
| `npx cds compile srv --to edmx -s all` | Exit 0; existing attachment capability warning only |
| `npm run qa:secret-scan` | PASS |
| `npm run qa:agent-rules` | PASS, 8 required rules |
| `npm run qa:ownership-gate` | PASS, 5/5 runner checks |
| `node --check srv/ai/duplicate-confirmation.js` | Exit 0 |
| `node --check scripts/qa/test-idts95-confirm-duplicate-suggestion.js` | Exit 0 |
| `git diff --check` | Exit 0 |

### Limitations and handoff

- This is a backend-only Jira task; no new Fiori/UI5 control or browser flow was added.
- No shared-QA deployment was performed because the dependency PR is still open.
- SangVN requested that the Ownership Knowledge Gate be deferred. Repository policy permits supervised implementation, but this branch must not merge and Jira IDTS-95 must not move to Done until an equivalent retest records PASS.
- OfficeCLI was not installed (`OFFICECLI_NOT_FOUND`). It has no Markdown editing support in this environment, so repository-native tools were used after the mandatory preflight.
- `npm ci --include=dev` reported Node `v24.13.0` outside the declared `>=20 <23` engine range and 21 existing audit findings. No dependency changes were made in this task.

## Vietnamese

Ngày: 2026-07-24

Owner: SangVN

Branch: `feature/idts-95-confirm-duplicate-suggestion-sangvn`

Dependency baseline: PR #167, `feature/idts-91-93-implementation-datdt`

### Phạm vi đã verify

- Tester hoặc PM có thể xác nhận một candidate từ suggestion `DUPLICATE_DETECTION` đã Accept và còn hiệu lực.
- Candidate membership và relation type chỉ lấy từ safe suggestion payload đã persist.
- Self-link, candidate ngoài payload, Bug không tồn tại, relation type inactive và link đã có theo cả hai chiều đều bị chặn.
- Suggestion pending, rejected, ignored, hết hạn hoặc sai feature không thể tạo link.
- Developer bị chặn với HTTP 403.
- Confirmation chỉ tạo đúng một `DuplicateLink`, không đổi status hoặc assignee của Bug.
- Lỗi cưỡng bức sau handler rollback lệnh insert.
- Generation, review action, classification apply và AI security hiện có vẫn xanh.

### Bằng chứng verify

| Lệnh | Kết quả |
| --- | --- |
| `npm run qa:idts95:programmatic` | PASS, 31/31 |
| `npm run qa:idts66:programmatic` | PASS, 34/34 |
| `npm run qa:idts91:programmatic` | PASS, 19/19 |
| `npm run qa:idts93:programmatic` | PASS, 35/35 |
| `npm run qa:idts71:programmatic` | PASS, 31/31 |
| `npx cds compile srv --to edmx -s all` | Exit 0; chỉ còn warning attachment capability đã có |
| `npm run qa:secret-scan` | PASS |
| `npm run qa:agent-rules` | PASS, 8 rule bắt buộc |
| `npm run qa:ownership-gate` | PASS, 5/5 check của runner |
| `node --check srv/ai/duplicate-confirmation.js` | Exit 0 |
| `node --check scripts/qa/test-idts95-confirm-duplicate-suggestion.js` | Exit 0 |
| `git diff --check` | Exit 0 |

### Giới hạn và handoff

- Đây là task backend-only; không thêm control Fiori/UI5 hoặc browser flow.
- Chưa deploy shared QA vì dependency PR vẫn đang mở.
- SangVN yêu cầu defer Ownership Knowledge Gate. Rule repo cho phép implementation dưới supervision, nhưng branch này không được merge và Jira IDTS-95 không được chuyển Done cho đến khi retest tương đương ghi PASS.
- OfficeCLI chưa được cài (`OFFICECLI_NOT_FOUND`). Môi trường này không có hỗ trợ edit Markdown qua OfficeCLI, nên đã dùng tool nội bộ repo sau preflight bắt buộc.
- `npm ci --include=dev` báo Node `v24.13.0` ngoài engine `>=20 <23` và 21 audit finding có sẵn. Task này không thay đổi dependency.
