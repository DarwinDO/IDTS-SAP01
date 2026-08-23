# Knowledge: `app/user-administration-ui/package.json`

## English

This file is the npm and build contract for the standalone User Administration UI. Its `version` must move with `sap.app/applicationVersion` in `webapp/manifest.json` and the root version in `package-lock.json`; HTML5 Repository and AppRouter use that release identity to distinguish newly deployed content from cached older content. The scripts reuse the installed UI5 toolchain and generate the cache-buster index plus deployable ZIP. Do not add runtime dependencies or change build tasks for wording-only releases.

Version `1.0.9` marks the first live content containing generic Cancel copy for both standard and existing-user invitations. If it stays at `1.0.8`, the backend button can become available while browsers continue to receive the older identity-link-only label.

## Tiếng Việt

File này là contract npm và build của User Administration UI độc lập. `version` phải tăng cùng `sap.app/applicationVersion` trong `webapp/manifest.json` và root version trong `package-lock.json`; HTML5 Repository và AppRouter dùng release identity này để phân biệt content mới deploy với content cũ đang cache. Các script dùng lại UI5 toolchain đã cài và tạo cache-buster index cùng ZIP deploy. Không thêm runtime dependency hoặc đổi build task cho release chỉ thay wording.

Version `1.0.9` đánh dấu content live đầu tiên có copy Cancel tổng quát cho cả invitation thường và existing-user. Nếu vẫn là `1.0.8`, button backend có thể xuất hiện nhưng browser vẫn nhận label cũ chỉ nói identity-link.

### Important source anchors

- **Location**: top-level `version`.
  **IDTS concept**: HTML5 content release identity.
  **Impact if broken**: New UI copy or controls can be hidden behind stale cached content after a successful content deployment.
  **Must check together**: `package-lock.json`, `webapp/manifest.json`, UI build ZIP, and live AppRouter readback.
