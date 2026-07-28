# Knowledge: `bootstrap-ui5.js`

## Purpose

This helper creates the UI5 bootstrap script only after `window.idtsAuthReady` resolves. It prevents the Fiori OData model or dashboard code from issuing requests before custom-auth or XSUAA identity is available.

Helper này chỉ tạo UI5 bootstrap script sau khi `window.idtsAuthReady` resolve. Nó ngăn Fiori OData model hoặc dashboard gửi request trước khi custom-auth hay XSUAA identity sẵn sàng.

## Execution order

1. Read `window.idtsAuthReady` created by `auth-guard.js`.
2. Wait for a safe IDTS user.
3. Create `sap-ui-bootstrap` with Horizon theme and the IDTS resource root.
4. Main app: enable `ComponentSupport`.
5. Dashboard: load `dashboard-page.js` after UI5 finishes loading.
6. Authentication failure: do not bootstrap; `auth-guard.js` owns the safe redirect/message.

## Debugging

Break at the promise callback, inspect only auth mode and script load events, then watch the first `$metadata` request. If the request starts before this callback, the HTML entry order is wrong. If the callback never runs, inspect `auth-guard.js` and `/odata/v4/auth/me()`.

## Ownership

- Primary owner: DatDT
- Support: DonHV
- Last reviewed: 2026-07-28
