# Knowledge: `app/user-administration-ui/package.json`

N5-Lite advances the HTML5 cache identity to `1.0.18` because visible Operations labels changed; dependencies and scripts remain unchanged. / N5-Lite tăng cache identity HTML5 lên `1.0.18` vì label Operations thay đổi; dependency và script giữ nguyên.

## English

This file is the npm and build contract for the standalone User Administration UI. Its `version` must move with `sap.app/applicationVersion` in `webapp/manifest.json` and the root version in `package-lock.json`; HTML5 Repository and AppRouter use that release identity to distinguish newly deployed content from cached older content. The scripts reuse the installed UI5 toolchain and generate the cache-buster index plus deployable ZIP. Do not add runtime dependencies or change build tasks for wording-only releases.

Version `1.0.9` marks the first live content containing generic Cancel copy for both standard and existing-user invitations. If it stays at `1.0.8`, the backend button can become available while browsers continue to receive the older identity-link-only label.

Version `1.0.10` adds the Gate 4 responsibility confirmation, no-auto-reassignment notice and double-submit guard without changing dependencies or build commands.

Version `1.0.15` publishes the Gate 6.3 Workload Actions-column remediation under a fresh HTML5 cache identity. It changes release metadata only; dependencies and build commands remain unchanged.

## Tiếng Việt

File này là contract npm và build của User Administration UI độc lập. `version` phải tăng cùng `sap.app/applicationVersion` trong `webapp/manifest.json` và root version trong `package-lock.json`; HTML5 Repository và AppRouter dùng release identity này để phân biệt content mới deploy với content cũ đang cache. Các script dùng lại UI5 toolchain đã cài và tạo cache-buster index cùng ZIP deploy. Không thêm runtime dependency hoặc đổi build task cho release chỉ thay wording.

Version `1.0.9` đánh dấu content live đầu tiên có copy Cancel tổng quát cho cả invitation thường và existing-user. Nếu vẫn là `1.0.8`, button backend có thể xuất hiện nhưng browser vẫn nhận label cũ chỉ nói identity-link.

Version `1.0.10` thêm confirmation responsibility, notice không tự reassign và double-submit guard của Gate 4 mà không đổi dependency hoặc build command.

Version `1.0.15` phát hành remediation cột Actions của Workload Gate 6.3 với cache identity HTML5 mới. Chỉ metadata release thay đổi; dependency và build command giữ nguyên.

Version `1.0.16` publishes the Gate 6.4 Back to Bug Management action with a fresh HTML5 cache identity. Version `1.0.16` phát hành action Quay lại Bug Management của Gate 6.4 bằng cache identity HTML5 mới. Dependency và build command không đổi.

Version `1.0.11` adds the Gate 5 Business Catalogs tab and dialogs. Dependencies and build commands remain unchanged.

Version `1.0.11` them tab/dialog Business Catalogs Gate 5. Dependency va build command giu nguyen.

### Important source anchors

- **Location**: top-level `version`.
  **IDTS concept**: HTML5 content release identity.
  **Impact if broken**: New UI copy or controls can be hidden behind stale cached content after a successful content deployment.
  **Must check together**: `package-lock.json`, `webapp/manifest.json`, UI build ZIP, and live AppRouter readback.

## Gate 6.5 cache identity `1.0.17` / Cache identity Gate 6.5 `1.0.17`

### English

The top-level application version advances from `1.0.16` to `1.0.17` so the unified Delivery filter, labels, details fallback, and typed retry UI have a new HTML5 content identity. Scripts, dev dependencies, name, license, and description are unchanged.

- **Location**: `app/user-administration-ui/package.json:3` — `version`.
  **IDTS concept**: reviewed User Administration content cache identity.
  **Impact if broken**: clients can retain the old Operations UI after a later approved content deployment.
  **Must check together**: `package-lock.json:3,9`, `webapp/manifest.json:10`, semantic JSON parity check, lint, and build.

### Tiếng Việt

Version ứng dụng top-level tăng từ `1.0.16` lên `1.0.17` để filter Delivery hợp nhất, label, fallback details và UI retry theo type có HTML5 content identity mới. Script, dev dependency, name, license và description không đổi.

- **Vị trí**: `app/user-administration-ui/package.json:3` — `version`.
  **Khái niệm IDTS**: cache identity của content User Administration đã review.
  **Ảnh hưởng nếu sai**: client có thể giữ UI Operations cũ sau lần content deploy được duyệt sau này.
  **Phải kiểm tra cùng**: `package-lock.json:3,9`, `webapp/manifest.json:10`, check semantic JSON parity, lint và build.

**Safe editing / Sửa an toàn:** Change only the version for this gate; do not upgrade dependencies or rewrite scripts. / Gate này chỉ đổi version; không upgrade dependency hoặc rewrite script.
