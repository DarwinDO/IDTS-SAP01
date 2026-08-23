# Knowledge: `i18n_en.properties`

## English / Tiếng Việt

This locale mirrors the Gate 3B existing-identity link keys from `i18n.properties`, including the read-only current-role label and full preservation notice. Keep both locale files synchronized whenever the dialog wording changes.

Locale này mirror các key link identity Gate 3B từ `i18n.properties`, gồm label role read-only và notice preservation đầy đủ. Khi đổi wording dialog phải giữ hai file locale đồng bộ.

The three existing cancellation keys now use generic wording for all unverified invitations. This file must remain byte-semantic in meaning with `i18n.properties` so a locale switch cannot restore the misleading identity-link-only label.

Ba key Cancel hien huu gio dung wording tong quat cho moi invitation chua verify. File nay phai giu y nghia tuong duong voi `i18n.properties` de viec doi locale khong lam xuat hien lai label chi danh cho identity-link.

Gate 4 adds confirmation and impact copy for responsibility changes. It states that existing Bugs keep their current assignee and that the PM must review the open-Bug impact count; it never promises automatic reassignment.

Gate 4 thêm copy confirmation và impact cho thay đổi responsibility. Nội dung nói rõ Bug hiện hữu giữ nguyên assignee và PM phải review số Bug đang mở bị ảnh hưởng; UI không hứa tự động reassign.
