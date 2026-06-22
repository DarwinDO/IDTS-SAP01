# SangVN Status - Fiori/UI5 Support

Last updated: 2026-06-22

Vietnamese: Trạng thái của SangVN - hỗ trợ Fiori/UI5 cho Sprint 02.

## Member Identity

| Field | Value |
| --- | --- |
| Member | SangVN |
| Primary lane | Fiori/UI5 Support |
| Shared delivery responsibility | May receive Backend CAP, Fiori/UI5, or QA/Verification tasks as assigned, but Sprint 02 priority is Fiori/UI5 support and shared delivery assistance |
| Leader support | DonHV can support or unblock this lane when needed |

Vietnamese:

| Trường | Giá trị |
| --- | --- |
| Thành viên | SangVN |
| Mảng chính | Hỗ trợ Fiori/UI5 |
| Trách nhiệm delivery chung | Có thể nhận task Backend CAP, Fiori/UI5 hoặc QA/Verification khi được phân công, nhưng ưu tiên của Sprint 02 là hỗ trợ Fiori/UI5 và hỗ trợ delivery chung khi cần |
| Leader hỗ trợ | DonHV có thể hỗ trợ hoặc gỡ blocker cho mảng này khi cần |

## Current Focus

Sprint 03 Fiori/UI5 support work: IDTS-20 ownership label refinement is in progress. Next task is IDTS-19 grouped history timeline with selective UI5 extension.

Vietnamese: Trọng tâm hiện tại là phần Fiori/UI5 của Sprint 03: IDTS-20 chỉnh label ownership đang thực hiện. Task tiếp theo là IDTS-19 grouped history timeline với UI5 extension.

## Done

- Initial repo baseline and BA implementation references were reviewed.
- Sprint 02 UI annotations for editable status behavior, supporting information positioning, and multiline action-note usability were updated.
- Shared FE support work is aligned with the current Sprint 02 handover instead of the old Backend CAP placeholder.

Vietnamese:

- Đã review baseline ban đầu của repo và các tài liệu BA liên quan đến implementation.
- Đã cập nhật các UI annotations của Sprint 02 cho hành vi status editable, vị trí supporting information, và usability của multiline action note.
- Đã đồng bộ lại vai trò hỗ trợ FE theo handover Sprint 02 hiện tại, không dùng placeholder Backend CAP cũ nữa.

## In Progress

- Shared Fiori/UI5 delivery support for final mentor-demo readiness remains active.
- `IDTS-9` is no longer an open FE blocker; keep it only as a regression check during the final browser rerun.

Vietnamese:

- Đang hỗ trợ retest và phân tích tiếp cho Jira `IDTS-9`.
- Đang hỗ trợ delivery Fiori/UI5 chung để chốt trạng thái sẵn sàng cho demo với mentor.

## Next

- Support DatDT in the final browser rerun and watch for any FE regression in Assign Developer, Comments CTA, or Object Page action visibility.
- If a new FE gap appears during the final rerun, help evaluate whether it should be fixed now or deferred from the demo baseline.
- Continue using Fiori MCP and SAP Fiori Guidelines before touching annotations, manifest configuration, or custom UI decisions.

Vietnamese:

- Hỗ trợ DatDT verify lại trên browser candidate fix annotation-only mới nhất của dialog Assign Developer.
- Nếu sau khi chọn vẫn còn hiện UUID, cùng team đánh giá nên chấp nhận gap đó cho demo hay làm targeted FE extension.
- Tiếp tục dùng Fiori MCP và SAP Fiori Guidelines trước khi đụng vào annotations, manifest config, hoặc quyết định custom UI.

## Blockers

- None at execution level. The remaining blocker is a product decision on whether the last Assign Developer selected-text gap deserves custom FE work.

Vietnamese: Hiện không có blocker về execution. Blocker còn lại là quyết định sản phẩm: gap cuối cùng ở Assign Developer có đáng để đầu tư custom FE hay không.

## Session Log

| Date | Task/WP | What was done | Completed part | Issues/Bugs found | Fix status | Evidence/Commands | Next handoff |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-06-22 | IDTS-20 (Sprint 03) | Refined UI labels and helper text for ownership semantics per DEC-022. Updated 4 annotation CDS files: `labels.cds` (Assignee → Assignee (Technical Owner), Next Processor User → Current Action Owner, Next Processor Role → Action Owner Role, Pending Assignment → Awaiting Assignment, Rejected Follow-up → Rejected — Needs Follow-up), `ownership-assignment.cds` (Assignment and Rejected Follow-up FieldGroup labels), `list-report.cds` (column headers: Technical Owner, Action Owner), `object-page.cds` (added Current Action Owner to General Info section). | All 4 annotation files updated, CDS compile passed with no errors | npm install required — `@cap-js/attachments` was missing after fresh `git pull origin dev`. CDS compile warning on `NonUpdateableProperties` from `@cap-js/attachments` — pre-existing, not related to IDTS-20 changes. | Environment issue: Fixed by running `npm install`. Warning: pre-existing, not a product defect. | `git checkout -b feature/idts-20-ownership-labels-sangvn`; `npm install`; `npx cds compile srv --to edmx` (pass); `Select-String` grep confirmed all new labels in annotation files | Browser manual check pending; then commit and push branch for PR |
| 2026-06-17 | IDTS-9 QA UI Retest | Re-tested the Assign Developer action dialog on the latest local FE build to verify whether the selected input now resolves the developer name instead of the UUID | Confirmed that the dialog is visible, the field label is now `Assignee`, and the value-help rows are business-friendly. The remaining issue is narrower: after selecting a developer, the input still shows the raw developer-profile UUID instead of the readable developer name. | Likely a standard Fiori Elements action-parameter selected-text limitation or a remaining FE metadata handling gap for this dialog. Browser evidence confirms the symptom; root-cause classification is still under team review. | Open (investigated) | Local run via `npm run watch-bug-management-ui`; browser retest on `http://localhost:4004/...`; screenshots `dialog_before_selection_1781693070331.png`, `dialog_after_selection_1781693103672.png` | Wait for team decision on recommendation: accept for demo or build a targeted FE extension |
| 2026-06-13 | IDTS-8, IDTS-10, IDTS-11 (Sprint 02) | Updated Bug Detail UI annotations for status dropdown behavior, supporting information placement, and multiline action notes | UI annotations completed | None | Fixed | `cds compile srv --to edmx` | Manual QA and shared FE follow-up |
| 2026-06-03 | Status setup | Member status file created from previous status baseline | Ownership assigned to SangVN | None | Fixed | `rg`, `git diff --check` | Continue on assigned Sprint work |

Vietnamese:

| Ngày | Task/WP | Đã làm gì | Phần đã xong | Khó khăn/Bug phát hiện | Trạng thái fix | Bằng chứng/Lệnh đã chạy | Handoff tiếp theo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-06-22 | IDTS-20 (Sprint 03) | Chỉnh label UI cho ownership semantics theo DEC-022. Cập nhật 4 file annotation CDS: `labels.cds` (Assignee → Assignee (Technical Owner), Next Processor User → Current Action Owner, Next Processor Role → Action Owner Role, Pending Assignment → Awaiting Assignment, Rejected Follow-up → Rejected — Needs Follow-up), `ownership-assignment.cds` (label Assignment và Rejected Follow-up), `list-report.cds` (cột Technical Owner, Action Owner), `object-page.cds` (thêm Current Action Owner vào General Info). | Cả 4 file annotation đã cập nhật, CDS compile pass không lỗi | npm install cần chạy trước — `@cap-js/attachments` chưa có sau git pull. CDS compile warning `NonUpdateableProperties` từ `@cap-js/attachments` — có sẵn trước đó, không liên quan IDTS-20. | Lỗi môi trường: fix bằng npm install. Warning: có sẵn, không phải bug sản phẩm. | `git checkout -b feature/idts-20-ownership-labels-sangvn`; `npm install`; `npx cds compile srv --to edmx` (pass); grep xác nhận label mới trong annotation files | Chờ manual browser check; sau đó commit và push branch cho PR |
| 2026-06-17 | IDTS-9 QA UI Retest | Retest dialog Assign Developer trên bản FE local mới nhất để kiểm tra ô chọn sau khi chọn developer có hiện tên hay vẫn hiện UUID | Đã xác nhận label của field là `Assignee`, các dòng trong value help đã thân thiện hơn về mặt nghiệp vụ. Vấn đề còn lại hẹp hơn: sau khi chọn developer, ô input vẫn hiện UUID của developer profile thay vì tên đọc được. | Nhiều khả năng đây là giới hạn của standard Fiori Elements với selected text của action parameter, hoặc vẫn còn một khoảng FE metadata handling chưa được resolve hết. Hiện mới nên kết luận ở mức `likely`, chưa nên khẳng định tuyệt đối. | Open (đã điều tra và giữ mở) | Chạy local bằng `npm run watch-bug-management-ui`; browser retest trên `http://localhost:4004/...`; screenshot `dialog_before_selection_1781693070331.png`, `dialog_after_selection_1781693103672.png` | Chờ team chốt hướng xử lý: chấp nhận cho demo hoặc làm targeted FE extension |
| 2026-06-13 | IDTS-8, IDTS-10, IDTS-11 (Sprint 02) | Cập nhật UI annotations cho Bug Detail liên quan status dropdown, vị trí Supporting Information, và multiline action note | Đã xong phần UI annotations | Không có | Đã xử lý | `cds compile srv --to edmx` | Manual QA và hỗ trợ FE tiếp theo |
| 2026-06-03 | Status setup | Tạo file status thành viên từ baseline status cũ | Đã giao ownership cho SangVN | Không có | Đã xử lý | `rg`, `git diff --check` | Tiếp tục theo Sprint task được assign |

## Update Rule

- SangVN updates this file after each work session.
- Record what was done, what part is complete, blockers, bugs/errors found, whether they were fixed, and verification evidence.
- Do not edit other members' status files unless coordinating with DonHV.

Vietnamese:

- SangVN cập nhật file này sau mỗi phiên làm việc.
- Ghi rõ đã làm gì, xong phần nào, blocker, bug/error phát hiện, đã fix hay chưa và bằng chứng verify.
- Không chỉnh file status của thành viên khác trừ khi phối hợp với DonHV.
