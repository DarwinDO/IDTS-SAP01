# Knowledge: app/bug-management-ui/webapp/ext/login/LoginDialog.fragment.xml (IDTS-35)

Last updated: 2026-06-30
Related task: IDTS-35 (Login UI and authenticated app session)
Member: DatDT
Status: **REMOVED** — see below

## Status: Removed in architecture cleanup commit

This file was created during the initial IDTS-35 implementation pass (commit
`e35a752`) as an `sap.m.Dialog`-based login UI embedded inside the Fiori
Elements app.

It was **removed** in the DonHV review fix commit because the final architecture
uses a standalone `login.html` page instead of an in-app dialog. The dialog
approach caused timing issues: the OData V4 `$metadata` request fired before the
component's `init()` method could show the dialog or install the XHR interceptor,
resulting in a blank page.

## Why the standalone approach was chosen

- `login.html` loads without any UI5 dependency, so no OData model is created
  before login completes.
- The XHR interceptor in `auth-guard.js` (loaded by `index.html` before the UI5
  bootstrap) guarantees every request carries the Bearer token.
- No async timing issues with AMD module loading or `AppComponent.prototype.init`.

## Reference

Active login files:
- `webapp/login.html` + `webapp/login-page.js` — standalone login page
- `webapp/auth-guard.js` — XHR interceptor loaded pre-bootstrap in `index.html`
- `webapp/ext/login/LoginController.js` — session helpers (kept)
