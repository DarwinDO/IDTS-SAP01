# Knowledge: `i18n_en.properties`

## Gate 5 key anchors / Anchor key Gate 5

### English

The Gate 5 keys at `app/user-administration-ui/webapp/i18n/i18n_en.properties:118-154` are the English counterpart for the Business Catalogs tab, type column, `componentType`/`categoryType` inputs, safe errors, count-only impact review, deactivation reason, and field-specific value-state text. Their meaning must remain synchronized with `i18n.properties`.

- **IDTS concept**: Localized copy keeps the admin flow understandable while CAP remains the authority for authorization and mutation.
- **Impact if broken**: A locale switch can hide a required-field message, mislabel activation state, or reveal technical implementation wording.
- **Must check together**: `i18n.properties`, `Main.view.xml:276-318`, `EditCatalogItem.fragment.xml:5-20`, and `CatalogImpact.fragment.xml:5-14`.

### Tiếng Việt

Các key Gate 5 tại `app/user-administration-ui/webapp/i18n/i18n_en.properties:118-154` là counterpart English cho tab Business Catalogs, column type, input `componentType`/`categoryType`, lỗi an toàn, impact review count-only, reason deactivate và value-state text theo field. Ý nghĩa phải đồng bộ với `i18n.properties`.

- **Khái niệm IDTS**: Copy đã localize giúp admin hiểu flow, còn CAP vẫn là authority cho authorization và mutation.
- **Ảnh hưởng nếu sai**: Đổi locale có thể làm mất message field bắt buộc, label sai activate state hoặc lộ wording implementation kỹ thuật.
- **Phải kiểm tra cùng**: `i18n.properties`, `Main.view.xml:276-318`, `EditCatalogItem.fragment.xml:5-20` và `CatalogImpact.fragment.xml:5-14`.

### Safe editing / Sửa an toàn

Keep the English and default locale key sets in parity. Never add raw server error, provider, identity, endpoint, or credential values to a properties file. Re-run the UI contract after wording changes.

Giữ bộ key English và locale mặc định parity. Không thêm raw server error, provider, identity, endpoint hoặc credential vào properties. Chạy lại UI contract sau khi đổi wording.

## English / Tiếng Việt

This locale mirrors the Gate 3B existing-identity link keys from `i18n.properties`, including the read-only current-role label and full preservation notice. Keep both locale files synchronized whenever the dialog wording changes.

Locale này mirror các key link identity Gate 3B từ `i18n.properties`, gồm label role read-only và notice preservation đầy đủ. Khi đổi wording dialog phải giữ hai file locale đồng bộ.

The three existing cancellation keys now use generic wording for all unverified invitations. This file must remain byte-semantic in meaning with `i18n.properties` so a locale switch cannot restore the misleading identity-link-only label.

Ba key Cancel hien huu gio dung wording tong quat cho moi invitation chua verify. File nay phai giu y nghia tuong duong voi `i18n.properties` de viec doi locale khong lam xuat hien lai label chi danh cho identity-link.

Gate 4 adds confirmation and impact copy for responsibility changes. It states that existing Bugs keep their current assignee and that the PM must review the open-Bug impact count; it never promises automatic reassignment.

Gate 4 thêm copy confirmation và impact cho thay đổi responsibility. Nội dung nói rõ Bug hiện hữu giữ nguyên assignee và PM phải review số Bug đang mở bị ảnh hưởng; UI không hứa tự động reassign.

Gate 5 keeps exact English parity for Business Catalog labels, impact counts, reasons, success messages, and safe failures. No technical or secret-bearing value is interpolated.

Gate 5 giu parity English cho label Business Catalog, impact count, reason, success va safe failure. Khong interpolate gia tri ky thuat hoac secret.

## Gate 6.1 navigation and action copy / Copy navigation và action Gate 6.1

### English

This English bundle mirrors the Gate 6.1 tooltip and change-role hint keys from `i18n.properties`: six top-level navigation tooltips, `changeRoleActionTooltip`, `manageResponsibilitiesActionTooltip`, `revokeAccessActionTooltip`, and `changeRoleResponsibilitiesHint`. The wording stays business-facing and avoids provider, endpoint, identity, and implementation details.

- **IDTS concept**: English fallback and English selection must preserve the distinction between a business-role change and Developer availability/responsibility maintenance.
  **Impact if broken**: A locale switch can make an icon-only row action unclear or remove the safe choice guidance from the role dialog.
  **Must check together**: `i18n.properties`, `i18n_vi.properties`, `Main.view.xml:37,121,230,279,390,440`, and `ManageAccess.fragment.xml:15-20`.

### Tiếng Việt

Bundle English này mirror các key tooltip và hint đổi role của Gate 6.1 từ `i18n.properties`: sáu tooltip navigation cấp cao, `changeRoleActionTooltip`, `manageResponsibilitiesActionTooltip`, `revokeAccessActionTooltip` và `changeRoleResponsibilitiesHint`. Wording tập trung vào nghiệp vụ, không chứa provider, endpoint, identity hay chi tiết implementation.

- **Khái niệm IDTS**: Fallback và lựa chọn locale English phải giữ rõ khác biệt giữa đổi business role với đổi availability/responsibility của Developer.
  **Ảnh hưởng nếu sai**: Đổi locale có thể làm row action icon-only khó hiểu hoặc làm mất hướng dẫn lựa chọn an toàn trong dialog đổi role.
  **Phải kiểm tra cùng**: `i18n.properties`, `i18n_vi.properties`, `Main.view.xml:37,121,230,279,390,440` và `ManageAccess.fragment.xml:15-20`.

### Safe editing / Sửa an toàn

Keep the English and default key sets in parity, and keep the Vietnamese bundle present for the same new keys. Re-run the UI contract after any wording or key change.

Giữ parity giữa bộ key English và default, đồng thời giữ các key mới tương ứng trong bundle tiếng Việt. Chạy lại UI contract tập trung sau mọi thay đổi wording hoặc key.
## Gate 6.2

English labels keep the five top-level areas and same-role validation explicit.

## Gate 6.3 workload copy / Copy workload Gate 6.3

### English

This bundle mirrors the new workload keys from `i18n.properties`: Developer Workload navigation, safe ownership explanation, bounded table/detail labels, state text, search/refresh/load-more actions, and `Open Bug`. The keys are deliberately business-facing and remain semantically equivalent to the default bundle and the Vietnamese bundle.

- **IDTS concept**: English users can distinguish technical assignee from Current Action Owner and understand that workload colors are attention hints, not authorization.
- **Impact if broken**: A locale switch can remove the only explanation for the workload boundary or make a read-only action sound like assignment/status mutation.
- **Must check together**: `i18n.properties`, `i18n_vi.properties`, Workload XML, formatter functions, and the focused workload contract.

### Tiếng Việt

Bundle này mirror các key workload mới từ `i18n.properties`: navigation Developer Workload, explanation ownership an toàn, label table/detail bounded, state text, action search/refresh/load-more và `Open Bug`. Các key tập trung vào nghiệp vụ và giữ ý nghĩa tương đương với bundle default và bundle tiếng Việt.

- **Khái niệm IDTS**: User English phân biệt được technical assignee với Current Action Owner và hiểu màu workload chỉ là hint cần chú ý, không phải authorization.
- **Ảnh hưởng nếu sai**: Đổi locale có thể làm mất explanation duy nhất về boundary workload hoặc làm action read-only nghe như mutation assignment/status.
- **Phải kiểm tra cùng**: `i18n.properties`, `i18n_vi.properties`, XML Workload, formatter và workload contract tập trung.

### Safe editing / Sửa an toàn

Keep default/English/Vietnamese key parity. Do not add raw server failures, internal identifiers, endpoints, provider terms, or credentials to this bundle.

Giữ parity key default/English/Vietnamese. Không thêm raw server failure, internal identifier, endpoint, term provider hoặc credential vào bundle này.

Label tiếng Anh giữ rõ năm khu vực cấp cao và validation khi role không thay đổi.
