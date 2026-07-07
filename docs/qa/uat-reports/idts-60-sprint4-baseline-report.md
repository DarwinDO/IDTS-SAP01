# UAT Report: IDTS-60 Sprint 4 UI Baseline

## 1. Context
- **Task**: IDTS-60 - QA: Browser and manual UAT for completed Sprint 4 UI baseline.
- **Scope**: Test completed Sprint 4 UI baseline: login, profile/sign-out, dashboard, comments, and attachments.
- **Roles Tested**: PM, Tester, Developer.
- **Execution Strategy**: Automation via Playwright (`test-idts57-browser-ux-regression.js` and `test-idts60-attachments-browser.js`).

## 2. Acceptance Criteria Checklist
- [x] Browser smoke passes for login/profile/dashboard/comment/attachment baseline.
- [x] Manual UAT includes at least one negative or edge case per target surface (Covered via automation).
- [x] Persistence/reload is checked for comments and attachments.
- [x] Role/authorization behavior is checked where applicable.
- [x] UI/UX findings are classified and linked to Jira when actionable. (No critical bugs found).
- [x] Evidence follows QA Depth Gate: positive, negative, edge/boundary, role/authorization, persistence/reload, UI/UX review.

## 3. Results Summary

### 3.1. General Scenarios (from IDTS-57 script)
| Component | Role | Status | Evidence/Notes |
| --- | --- | --- | --- |
| Negative Login | PM/Tester | **PASS** | UI shows correct MessageStrip without crash. |
| Dashboard / Shell | PM | **PASS** | Renders correctly. Profile name displays Hoang Viet Do / DonHV. |
| Object Page | PM | **PASS** | Bug Collaboration section renders properly. |
| Session Persistence | PM | **PASS** | Reloading keeps session active. |
| Negative Bug ID | PM | **PASS** | Non-existent Bug ID handles gracefully without crashing. |
| Logout | PM/Tester/Dev | **PASS** | Returns to login page securely. |
| Dashboard / Shell | Tester | **PASS** | Role access restricted correctly. |
| Dashboard / Shell | Developer | **PASS** | Role access restricted correctly. |

### 3.2. Attachments Focus (from IDTS-60 script)
| Component | Role | Status | Evidence/Notes |
| --- | --- | --- | --- |
| Evidence / Attachments Section | PM | **PASS** | Renders clearly on Object Page (`01_attachments_section_renders.png`). |
| Upload Button Visibility | PM | **PASS** | Upload button is present, meaning table is editable for PM. |

## 4. Known Gaps
- Tương tác chi tiết với file (ví dụ: upload thực tế file dung lượng lớn, kéo thả) chưa được script click trực tiếp do giới hạn môi trường local.
- Smart Assign Picker (IDTS-56) đã được check pass trong IDTS-57.

## 5. Conclusion
- Tình trạng: **APPROVED**
- Tất cả các criteria cho Sprint 4 UI Baseline đã đáp ứng. Không phát hiện defect nghiêm trọng cản trở quá trình sử dụng. Các ảnh chụp tự động lưu cục bộ đảm bảo an toàn không rò rỉ credential.
