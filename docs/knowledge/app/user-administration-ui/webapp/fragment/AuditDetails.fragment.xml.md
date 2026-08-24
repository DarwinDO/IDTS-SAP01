# Knowledge: `AuditDetails.fragment.xml`

## English / Tiếng Việt

The Gate 6 audit dialog uses native `sapUiSmallMargin` on its content `VBox` for a visible inset. Labels after the first field use the native `sapUiSmallMarginTop` spacing pattern from `ActiveUserDetails`. It is read-only and displays allowlisted action/result/state codes, safe actor/target display, a 12-character non-reversible correlation fingerprint, and a bounded details summary. No custom CSS is introduced, and it never exposes the original correlation ID, identity/provider hashes, request payload, token, credential, or raw provider error.

Dialog audit Gate 6 dùng `sapUiSmallMargin` native trên `VBox` content để tạo inset nhìn thấy. Các label sau field đầu dùng spacing native `sapUiSmallMarginTop` theo pattern `ActiveUserDetails`. Dialog read-only hiển thị action/result/state code trong allowlist, actor/target display an toàn, correlation fingerprint 12 ký tự không đảo ngược và details summary bounded. Không thêm CSS custom và dialog không lộ correlation ID gốc, identity/provider hash, request payload, token, credential hoặc raw provider error.

**Source anchor:** `AuditDetails.fragment.xml:1-27`; the fingerprint is generated in the CAP mapper, not in the browser.

**Safe editing:** Keep the dialog independent from provisioning/delivery mutation controls. New audit fields require explicit safe mapping, forbidden-field coverage, and bilingual copy.

**Sửa an toàn:** Giữ dialog độc lập với control mutation delivery/provisioning. Field audit mới cần safe mapping explicit, coverage forbidden-field và copy song ngữ.
