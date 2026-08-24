# Knowledge: `scripts/qa/test-user-admin-ui.js`

## English / Tiếng Việt

The UI contract fixture checks the state-bound link button/dialog, read-only business-role display, full preservation copy, i18n parity, lowercased exact two-parameter action payload, valid-email guard, double-submit guard, queued result, and reload flag. UI runtime/lint/build claims remain separate from source syntax when dependencies are unavailable.

Fixture UI contract kiểm tra button/dialog link theo state, business-role read-only, preservation copy đầy đủ, parity i18n, payload action đúng hai parameter đã lowercase, guard email, guard double submit, result queued và cờ reload. Claim runtime/lint/build UI vẫn tách riêng khỏi syntax source khi dependency không có.

The Gate 6 additions assert that every Operations/Audit detail fragment keeps the first label unspaced and applies native `sapUiSmallMarginTop` to every later label. Runtime cases exercise both a direct structured readiness result and a UI5 `{ value: structuredResult }` wrapper, asserting top-level fields, `loaded`, and busy/error cleanup, including the fail path.

Phần bổ sung Gate 6 kiểm tra mỗi fragment detail Operations/Audit giữ label đầu không spacing và áp dụng `sapUiSmallMarginTop` native cho mọi label sau. Runtime case chạy cả readiness result structured trực tiếp và wrapper UI5 `{ value: structuredResult }`, kiểm tra field top-level, `loaded`, clear busy/error, gồm cả nhánh lỗi.
