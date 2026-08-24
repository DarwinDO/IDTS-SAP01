# Knowledge: `AuditDetails.fragment.xml`

## English / Tiếng Việt

The Gate 6 audit dialog is read-only and displays allowlisted action/result/state codes, safe actor/target display, a 12-character non-reversible correlation fingerprint, and a bounded details summary. It never exposes the original correlation ID, identity/provider hashes, request payload, token, credential, or raw provider error.

Dialog audit Gate 6 là read-only và hiển thị action/result/state code trong allowlist, actor/target display an toàn, correlation fingerprint 12 ký tự không đảo ngược và details summary bounded. Dialog không lộ correlation ID gốc, identity/provider hash, request payload, token, credential hoặc raw provider error.

**Source anchor:** `AuditDetails.fragment.xml:1-27`; the fingerprint is generated in the CAP mapper, not in the browser.

**Safe editing:** Keep the dialog independent from provisioning/delivery mutation controls. New audit fields require explicit safe mapping, forbidden-field coverage, and bilingual copy.

**Sửa an toàn:** Giữ dialog độc lập với control mutation delivery/provisioning. Field audit mới cần safe mapping explicit, coverage forbidden-field và copy song ngữ.
