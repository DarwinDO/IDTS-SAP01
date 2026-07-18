# IDTS-82 Material Remediation Verification

## English

Date: 2026-07-18 (Asia/Bangkok)

### Scope completed

- Backend/data learning material: PR #158, 35 runtime sources and 35 matching mirrors, merged to `dev`.
- DatDT learning material: PR #159, 22 runtime sources and 22 matching mirrors, merged to `dev`.
- SangVN learning material: PR #160, 15 runtime sources and 15 matching mirrors, merged to `dev`.
- Total: 72 runtime source files; no missing mirror in the three PR inventories.
- Rewritten seven Debug Labs and the ownership/material-quality rule in the governance follow-up branch.
- DonHV's first gate is recorded as `PAUSED — material quality defect`, not FAIL.

### Fresh verification

| Check | Result |
| --- | --- |
| PR #158 `qa-depth-gate` | PASS before merge |
| PR #159 `qa-depth-gate` | PASS before merge |
| PR #160 `qa-depth-gate` | PASS before merge |
| Strict UTF-8 decode of governance diff | PASS, 12 files at the time of the scan |
| Mirror existence from PR inventories | #158: 35/35; #159: 22/22; #160: 15/15 |
| `npm run qa:agent-rules` | PASS, 8 required rules |
| `npm run qa:ownership-gate` | PASS, 5/0 runner tests |
| `npm run qa:depth:self-test` | PASS, 15/0 |
| `npm run qa:secret-scan` | PASS |
| `npx ai-devkit@latest lint --json` | PASS, 5 ok / 0 miss / 0 warn |
| `git diff --check` | PASS |

### Behavior-preservation evidence

Each source batch passed its focused compile/build/regression checks before merge and the semantic comment-only check. The governance follow-up changes only `.agents/rules/`, `docs/learning/`, and PM documentation/evidence. No OData action, database entity, runtime statement, UI route, dependency, or private configuration is changed.

### Open human validation

The delegated IDTS-86 material review now passes with the detailed report at `docs/pm/evidence/idts-86/material-quality-validation.md`. This implementation evidence is still not human Knowledge Gate evidence. DonHV, DatDT, SangVN, and NhanT must independently debug and teach back their assigned flow. The governance PR must not claim PASS on their behalf.

## Vietnamese

Ngày: 18/07/2026 (Asia/Bangkok)

### Phạm vi đã hoàn tất

- Material backend/data: PR #158, 35 runtime source và 35 mirror tương ứng, đã merge vào `dev`.
- Material DatDT: PR #159, 22 runtime source và 22 mirror tương ứng, đã merge vào `dev`.
- Material SangVN: PR #160, 15 runtime source và 15 mirror tương ứng, đã merge vào `dev`.
- Tổng cộng: 72 runtime source file; không thiếu mirror trong inventory của ba PR.
- Đã viết lại bảy Debug Lab và rule về ownership/chất lượng material trong branch governance follow-up.
- Gate đầu tiên của DonHV được ghi `PAUSED — material quality defect`, không phải FAIL.

### Verification mới

| Check | Kết quả |
| --- | --- |
| PR #158 `qa-depth-gate` | PASS trước merge |
| PR #159 `qa-depth-gate` | PASS trước merge |
| PR #160 `qa-depth-gate` | PASS trước merge |
| Decode UTF-8 nghiêm ngặt cho governance diff | PASS, 12 file tại thời điểm scan |
| Mirror tồn tại theo inventory PR | #158: 35/35; #159: 22/22; #160: 15/15 |
| `npm run qa:agent-rules` | PASS, 8 required rules |
| `npm run qa:ownership-gate` | PASS, 5/0 test runner |
| `npm run qa:depth:self-test` | PASS, 15/0 |
| `npm run qa:secret-scan` | PASS |
| `npx ai-devkit@latest lint --json` | PASS, 5 ok / 0 miss / 0 warn |
| `git diff --check` | PASS |

### Evidence không đổi behavior

Mỗi source batch đã pass compile/build/regression tập trung và semantic comment-only check trước merge. Governance follow-up chỉ đổi `.agents/rules/`, `docs/learning/` và tài liệu/evidence PM. Không đổi OData action, database entity, runtime statement, UI route, dependency hoặc private config.

### Human validation còn mở

Review material IDTS-86 được DonHV ủy quyền hiện đã PASS, có báo cáo chi tiết tại `docs/pm/evidence/idts-86/material-quality-validation.md`. Evidence implementation này vẫn không phải evidence Knowledge Gate của con người. DonHV, DatDT, SangVN và NhanT phải tự debug và teach-back flow được giao. Governance PR không được tự ghi PASS thay họ.
