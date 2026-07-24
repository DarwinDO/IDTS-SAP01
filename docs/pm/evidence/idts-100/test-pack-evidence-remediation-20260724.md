# IDTS-100 — SAP490 Test Pack Evidence Remediation

## English

### Scope and baseline

- Branch: `docs/idts-100-test-pack-evidence-remediation-donhv`
- Generator baseline: `66ca710d60f2cc1e207abf4b05682b8bd3632c4e`
- Runtime evidence baseline: `c953cd7ad3683fc2a891ad3d09708f236f157902`
- Evidence baseline: `dc3dc09d111df2970070ff872a1bf024550c64e4`
- Shared QA deploy: `dep-d9hmfko4n6ts73b5egsg` (`LIVE`)
- Runtime scope: no changes under `app/`, `srv/`, or `db/`.

### Remediated artifacts

| Artifact | Version | Drive ID | Drive result |
| --- | --- | --- | --- |
| Functional Test EN | v0.3 | `10euD4971cy857onC-wd5wDE-paAVPPne` | Updated in place |
| Functional Test VI | v0.3 | `1dnVVOtHv8mVwxYNM3_AKPeEdDy3xwwJF` | Updated in place |
| Unit Test EN | v0.4 | `1wyno-7uTUudV_T_cB2VWSSP6a8yWsA0T` | Updated in place |
| Unit Test VI | v0.4 | `1hqAdhMYZHo2Ah4J_OYNfmVV7ZhG2_KF6` | Updated in place |
| Test Report EN | v0.4 | `12ysnM_7KekEbwM5mCmgeacwCUEqIrOb_` | Updated in place |
| Test Report VI | v0.4 | `14QABwYHkir1cHuYpYqJyeKRquAzVH7aS` | Updated in place |
| Integration Evidence Index | v0.1 | `1giRYcHhhpu79TjF3tm88WAotwwzWrIJ-` | Uploaded to Integration Test folder |

The six existing files kept their original Drive IDs, parents, MIME types, and permissions. The new index is shared as `anyone with the link — reader` and is stored in folder `1wERCVmfEc6Tk6YRB4cEuMv-Qvw3fY665`.

### Evidence contract

- Every passed test case now records a full commit SHA, environment, executor, timestamp, result, limitation, and an artifact URL.
- Unit cases each point to their own row in the internal `Evidence` sheet.
- Test Report feature links use location-only internal hyperlinks to non-empty targets.
- Functional Test data starts in the official row 5–6 result block; the unused blank block was removed.
- Hyperlinks preserve the template font family and size; blue/underline is applied only to cells with a real hyperlink.
- Local paths, placeholder SHAs, script names, and commands without result evidence are rejected by the validator.

### Verification

- Focused regression: `python scripts/sap490/test-test-pack-evidence-contract.py` — PASS.
- Test-pack validator: `python scripts/sap490/validate-test-pack.py` — PASS, 12 workbooks, 0 warnings, 0 errors.
- OfficeCLI `1.0.141`: PASS for all 12 current test-pack workbooks plus the Integration Evidence Index.
- Visual review: PASS for Functional layout, Unit Evidence rows, Test Report link styling, and Integration Evidence Index readability.
- Google Sheets live checks:
  - Integration Evidence Index external artifact link opened the exact public GitHub evidence file.
  - Test Report VI `Feature 1` link navigated to the correct internal sheet and `A1` target.
  - Unit Test VI `UT-AI-001` displays `=HYPERLINK("#gid=1105874986&range=A2", ...)`, targeting the workbook's `Evidence` sheet row for `EVD-UT-AI-001`.
- Public URL probe: 11/12 unique viewer URLs returned HTTP 200. One GitHub blob viewer returned 504; its exact `raw.githubusercontent.com` URL returned 200 and the case's primary evidence artifact returned 200. This is recorded as a secondary-viewer limitation, not a test PASS source.
- Test truth remains unchanged: 27 planned = 21 `PASSED` + 6 `UAT PREPARED`; OpenAI live provider remains `DISABLED / NOT ACCEPTED`.

### Tooling limitations and findings

- Google Sheets API cannot read stored Office XLSX files and returned `FAILED_PRECONDITION`; live checks therefore used Google Sheets in Chrome.
- The first generated internal links were interpreted by Google Sheets as invalid relative web paths. The generator now writes location-only OOXML hyperlinks, and the validator rejects internal links that contain an external target.
- One Drive metadata probe requested unsupported field `inheritedFrom`; the request was retried with valid fields and confirmed public read permission.

## Vietnamese

### Phạm vi và baseline

- Branch: `docs/idts-100-test-pack-evidence-remediation-donhv`
- Baseline generator: `66ca710d60f2cc1e207abf4b05682b8bd3632c4e`
- Baseline runtime dùng làm bằng chứng: `c953cd7ad3683fc2a891ad3d09708f236f157902`
- Baseline evidence: `dc3dc09d111df2970070ff872a1bf024550c64e4`
- Shared QA deploy: `dep-d9hmfko4n6ts73b5egsg` (`LIVE`)
- Phạm vi runtime: không thay đổi file trong `app/`, `srv/`, hoặc `db/`.

### Kết quả sửa Test Pack

- Functional Test EN/VI được nâng lên v0.3 và dùng đúng block kết quả chính thức từ hàng 5–6.
- Unit Test EN/VI được nâng lên v0.4; mỗi test case có một dòng evidence riêng, đủ baseline, môi trường, kết quả, giới hạn và link artifact thật.
- Test Report EN/VI được nâng lên v0.4; link nội bộ trỏ đúng sheet/ô, text không có link không còn bị tô xanh giả.
- Integration Evidence Index v0.1 chứa 27 test case và đã được upload vào folder Integration Test.
- Sáu file cũ được update tại chỗ, giữ nguyên Drive ID, parent, MIME type và permission. Index mới có quyền đọc công khai bằng link.

### Kiểm chứng

- Regression test và validator đều PASS.
- OfficeCLI `1.0.141` PASS cho 13 workbook kiểm tra.
- Kiểm tra trực quan local và Google Sheets PASS cho bố cục, font, evidence row và hyperlink đại diện.
- Link evidence ngoài workbook mở đúng file GitHub công khai; Test Report điều hướng đúng sang `Feature 1!A1`; Unit Test chứa link nội bộ đúng tới `Evidence!A2` cho `EVD-UT-AI-001`.
- 11/12 URL viewer trả HTTP 200. Một GitHub blob viewer trả 504 nhưng raw URL và primary evidence đều trả 200; limitation này không được dùng để nâng mức PASS.
- Sự thật test không đổi: 27 case = 21 `PASSED` + 6 `UAT PREPARED`; OpenAI live vẫn `DISABLED / NOT ACCEPTED`.

### Giới hạn tooling

- Google Sheets API không đọc trực tiếp Office XLSX lưu trên Drive, nên bước click link dùng Chrome/Google Sheets thật.
- Link nội bộ bản đầu bị Google Sheets hiểu thành đường web tương đối; generator và validator đã được sửa để dùng location-only OOXML hyperlink.
- Một lần đọc metadata Drive dùng field không được hỗ trợ; retry với field hợp lệ đã xác nhận index có quyền `anyone/reader`.
