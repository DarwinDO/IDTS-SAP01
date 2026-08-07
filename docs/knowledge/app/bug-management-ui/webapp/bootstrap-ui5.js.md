# Knowledge: `bootstrap-ui5.js`

## Purpose

This helper creates the UI5 bootstrap script only after `window.idtsAuthReady` resolves. It prevents the Fiori OData model or dashboard code from issuing requests before custom-auth or XSUAA identity is available.

Helper này chỉ tạo UI5 bootstrap script sau khi `window.idtsAuthReady` resolve. Nó ngăn Fiori OData model hoặc dashboard gửi request trước khi custom-auth hay XSUAA identity sẵn sàng.

## Execution order

1. Read `window.idtsAuthReady` created by `auth-guard.js`.
2. Wait for a safe IDTS user.
3. Create `sap-ui-bootstrap` with English framework text, Horizon theme, and the IDTS resource root.
4. Main app: enable `ComponentSupport`.
5. Dashboard: load `dashboard-page.js` after UI5 finishes loading.
6. Authentication failure: do not bootstrap; `auth-guard.js` owns the safe redirect/message.

The explicit `data-sap-ui-language="en"` setting keeps standard SAPUI5/Fiori-generated labels in English even when the browser locale is Vietnamese. `data-sap-ui-ignore-url-params="true"` also prevents a `sap-language` URL parameter from overriding that product-wide language decision. Application-owned copy still comes from the English i18n bundle.

Thiết lập rõ `data-sap-ui-language="en"` giữ các label chuẩn do SAPUI5/Fiori sinh ra ở tiếng Anh ngay cả khi locale của browser là tiếng Việt. `data-sap-ui-ignore-url-params="true"` cũng ngăn tham số URL `sap-language` ghi đè quyết định ngôn ngữ chung của sản phẩm. Copy do ứng dụng sở hữu vẫn lấy từ i18n tiếng Anh.

## Debugging

Break at the promise callback, inspect only auth mode and script load events, then watch the first `$metadata` request. If the request starts before this callback, the HTML entry order is wrong. If the callback never runs, inspect `auth-guard.js` and `/odata/v4/auth/me()`.

## Ownership

- Primary owner: DatDT
- Support: DonHV
- Last reviewed: 2026-07-28
