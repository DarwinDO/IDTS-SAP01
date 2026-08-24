# Knowledge: `i18n_vi.properties`

## English / Tiếng Việt

This Vietnamese mirror provides Gate 6 Operations and Audit labels for the same safe UI concepts as the English-first property files: delivery/provisioning tabs, readiness, bounded statuses, action/result filters, safe detail labels, and retry/reconcile feedback. Existing untranslated application keys continue to fall back to the English-first bundle.

File mirror tiếng Việt cung cấp label Gate 6 Operations và Audit cho cùng các khái niệm UI an toàn như bộ properties English-first: tab delivery/provisioning, readiness, status bounded, filter action/result, label detail an toàn và feedback retry/reconcile. Key cũ chưa dịch tiếp tục fallback về bundle English-first.

**Parity rule:** Add any new Gate 6 user-visible key to `i18n.properties`, `i18n_en.properties`, and this file together. Do not put raw server errors, provider values, endpoints, credentials, or identity data into localized copy.

**Quy tắc parity:** Khi thêm key user-facing Gate 6, phải thêm đồng thời vào `i18n.properties`, `i18n_en.properties` và file này. Không đưa raw server error, provider value, endpoint, credential hoặc identity data vào copy locale.
