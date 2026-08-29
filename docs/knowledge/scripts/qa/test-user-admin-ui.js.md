# Knowledge: `scripts/qa/test-user-admin-ui.js`

## N5-Lite coverage / Coverage N5-Lite

English: UI contract verifies one unified table, a localized Digest filter option, safe type/event normalization and `canRetry=false`. It also updates the stale Bug Management cross-app version guard from `0.0.6` to the already-merged `0.0.7`; no Bug Management source changes.

Tiếng Việt: UI contract verify một bảng unified, option filter Digest localized, normalize type/event an toàn và `canRetry=false`. Test cũng cập nhật guard version Bug Management stale từ `0.0.6` lên `0.0.7` đã merge; không đổi source Bug Management.

## English / Tiếng Việt

The UI contract fixture checks the state-bound link button/dialog, read-only business-role display, full preservation copy, i18n parity, lowercased exact two-parameter action payload, valid-email guard, double-submit guard, queued result, and reload flag. UI runtime/lint/build claims remain separate from source syntax when dependencies are unavailable.

Fixture UI contract kiểm tra button/dialog link theo state, business-role read-only, preservation copy đầy đủ, parity i18n, payload action đúng hai parameter đã lowercase, guard email, guard double submit, result queued và cờ reload. Claim runtime/lint/build UI vẫn tách riêng khỏi syntax source khi dependency không có.

The Gate 6 additions assert absolute `/...` paths for all three readiness fields in the named `adminReadiness` model, and assert that every Operations/Audit detail fragment uses native `sapUiSmallMargin` on its content container, keeps the first label unspaced, and applies `sapUiSmallMarginTop` to every later label. Runtime cases exercise direct results, a bound-context result, and the real SAPUI5 Context shape.

Phần bổ sung Gate 6 kiểm tra path `/...` absolute cho cả ba readiness field trong named model `adminReadiness`, và kiểm tra mỗi fragment detail Operations/Audit dùng `sapUiSmallMargin` native ở container, giữ label đầu không spacing và áp dụng `sapUiSmallMarginTop` cho mọi label sau. Runtime case chạy result direct, bound-context và đúng shape Context của SAPUI5.
