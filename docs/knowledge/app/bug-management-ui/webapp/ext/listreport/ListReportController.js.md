# Knowledge: List Report dashboard filter extension

This controller extension consumes the `status_code` parameter produced by a PM dashboard tile and applies it to the Fiori Elements List Report through `ExtensionAPI.setFilterValues()`. Only the ten canonical workflow status codes are accepted. The implementation intentionally avoids DOM access, internal control IDs and direct table filtering.

Debug order: browser hash → `onAfterRendering()` → allowlist → `setFilterValues("status_code", "EQ", statusCode)` → filter bar/table binding.
