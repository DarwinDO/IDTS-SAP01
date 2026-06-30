# Knowledge: app/bug-management-ui/webapp/ext/login/login.css (IDTS-35)

Last updated: 2026-06-30
Related task: IDTS-35 (Login UI and authenticated app session)
Member: DatDT
Status: **REMOVED** — see below

## Status: Removed in architecture cleanup commit

`login.css` was created alongside `LoginDialog.fragment.xml` to style the
`sap.m.Dialog`-based login UI. Both files were removed in the DonHV review fix
commit when the dialog approach was replaced by the standalone `login.html` page.

Login page styling is now embedded in `login.html`'s `<style>` block (scoped to
that page only, no UI5 theme loading needed). The CSS uses SAP Horizon color
values (`#0a6ed1`, `#074491`) for visual consistency.

## Reference

See `docs/knowledge/app/bug-management-ui/webapp/ext/login/LoginDialog.fragment.xml.md`
for the full explanation of the architectural decision.
