# IDTS-72 Visual AI Flow Evidence

This folder was added after DonHV observed that the visible AI evidence only proved the Smart Assign explanation flow.

Result:

- Smart Assign explanation: product UI evidence exists.
- Duplicate/similar bug detection: backend/API evidence exists, but no product UI panel currently exposes it.
- Classification suggestion: backend/API evidence exists, but no product UI panel currently exposes it.
- Bug summary / handoff summary: backend/API evidence exists, but no product UI panel currently exposes it.
- Failure/fallback behavior: backend/security coverage exists; end-user visual fallback is only visible today where Smart Assign has UI.

Recommended QA decision:

- Do not close visual UI acceptance for the three backend-only AI flows unless the team accepts API-level evidence for IDTS-72.
- If product UI evidence is required, create follow-up UI implementation tasks for duplicate detection, classification suggestion, and handoff summary review panels.

Tiếng Việt:

Folder này được bổ sung sau khi DonHV phát hiện evidence nhìn thấy rõ mới chỉ chứng minh luồng AI explanation trong Smart Assign.

Kết quả:

- Smart Assign explanation: có evidence UI sản phẩm thật.
- Duplicate/similar bug detection: có evidence backend/API, nhưng hiện chưa có panel UI sản phẩm để user dùng trực tiếp.
- Classification suggestion: có evidence backend/API, nhưng hiện chưa có panel UI sản phẩm để user dùng trực tiếp.
- Bug summary / handoff summary: có evidence backend/API, nhưng hiện chưa có panel UI sản phẩm để user dùng trực tiếp.
- Failure/fallback behavior: có coverage backend/security; fallback hiển thị cho end-user hiện chỉ rõ ở nơi đã có UI là Smart Assign.

Khuyến nghị QA:

- Không đóng visual UI acceptance cho ba luồng backend-only nếu team chưa chấp nhận API-level evidence cho IDTS-72.
- Nếu bắt buộc phải có product UI evidence, cần tạo task UI follow-up cho duplicate detection, classification suggestion, và handoff summary review panel.
