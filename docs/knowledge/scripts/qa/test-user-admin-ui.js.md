# Knowledge: `scripts/qa/test-user-admin-ui.js`

## English / Tiếng Việt

The UI contract fixture checks the state-bound link button/dialog, read-only business-role display, full preservation copy, i18n parity, lowercased exact two-parameter action payload, valid-email guard, double-submit guard, queued result, and reload flag. UI runtime/lint/build claims remain separate from source syntax when dependencies are unavailable.

Fixture UI contract kiểm tra button/dialog link theo state, business-role read-only, preservation copy đầy đủ, parity i18n, payload action đúng hai parameter đã lowercase, guard email, guard double submit, result queued và cờ reload. Claim runtime/lint/build UI vẫn tách riêng khỏi syntax source khi dependency không có.

The Gate 6 additions assert that every Operations/Audit detail fragment keeps the first label unspaced and applies native `sapUiSmallMarginTop` to every later label. Runtime cases exercise direct results, a bound-context result, and the real SAPUI5 shape where `invoke()` returns a `Context` whose `requestObject()` is direct or `{ value: structuredResult }`; they assert top-level fields, `loaded`, and busy/error cleanup, including the fail path.

Phần bổ sung Gate 6 kiểm tra mỗi fragment detail Operations/Audit giữ label đầu không spacing và áp dụng `sapUiSmallMarginTop` native cho mọi label sau. Runtime case chạy result direct, bound-context và đúng shape SAPUI5 khi `invoke()` trả `Context` có `requestObject()` direct hoặc `{ value: structuredResult }`; test kiểm tra field top-level, `loaded`, clear busy/error, gồm cả nhánh lỗi.
