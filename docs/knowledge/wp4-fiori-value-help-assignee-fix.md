# WP4 Fiori Value Help and Assignee Display Fix

## English

### Problem

The Create Bug Object Page exposed the Assignee field through `assignee_ID`, but the value help initially showed technical fields such as `developerProfile_ID` and `responsibilityLevel_code`. After selecting a developer, the input displayed the raw UUID instead of the developer name.

### Why It Happened

SAP Fiori Elements renders value-help dialogs from OData metadata. If a value-list collection has no business-facing `UI.LineItem` and field labels, Fiori falls back to technical property names.

For the selected value display, `@Common.Text` and `@Common.TextArrangement: #TextOnly` tell Fiori to show a readable text instead of a key. However, the text property must be available in the OData response. In draft side-effect reads, Fiori requested only `assigneeDisplayName`, so the backend also had to enrich that property for draft reads.

### Fix

- Added `AssignableDevelopers` as a dedicated value-help projection with business-facing columns: developer name, email, availability, application component, defect category, SAP module scope, and responsibility level.
- Pointed the Assignee value help to `AssignableDevelopers`.
- Added `assigneeDisplayName` to the `Bugs` service projection and used it as `@Common.Text` for `assignee_ID`.
- Added backend `after READ` enrichment for both active `Bugs` and `Bugs.drafts`, so Fiori side-effect reads receive `assigneeDisplayName`.
- Added property-level labels for common value-list entities so popups show labels such as `Priority Code` and `Priority` instead of `code` and `name`.

### Verification

- Playwright CLI showed the Assignee value help with business columns and selected Assignee as `DatDT`, not the UUID.
- Priority value help showed `Priority Code` and `Priority`, not lowercase technical headers.
- `npx cds compile srv app/bug-management-ui --to edmx` passed.
- `npx cds deploy --to sqlite::memory:` passed.
- `node scripts/qa/test-idts6-programmatic.js` passed 21/21.
- `npx ui5 build --config ui5.yaml --clean-dest --dest <temp>` passed.

## Vietnamese

### Vấn đề

Trang Create Bug Object Page dùng field `assignee_ID` để chọn Assignee, nhưng value help ban đầu hiển thị các field kỹ thuật như `developerProfile_ID` và `responsibilityLevel_code`. Sau khi chọn developer, ô input lại hiển thị UUID thay vì tên developer.

### Nguyên nhân

SAP Fiori Elements dựng value-help dialog dựa trên OData metadata. Nếu value-list collection không có `UI.LineItem` và label nghiệp vụ rõ ràng, Fiori sẽ fallback về tên property kỹ thuật.

Với phần hiển thị giá trị đã chọn, `@Common.Text` và `@Common.TextArrangement: #TextOnly` báo cho Fiori hiển thị text dễ đọc thay vì key. Tuy nhiên text property đó phải có trong OData response. Trong draft side-effect read, Fiori chỉ request `assigneeDisplayName`, nên backend cũng phải enrich property này cho draft read.

### Cách sửa

- Thêm `AssignableDevelopers` làm value-help projection riêng với các cột nghiệp vụ: tên developer, email, availability, application component, defect category, SAP module scope và responsibility level.
- Trỏ value help của Assignee sang `AssignableDevelopers`.
- Thêm `assigneeDisplayName` vào service projection `Bugs` và dùng property này làm `@Common.Text` cho `assignee_ID`.
- Thêm backend `after READ` enrichment cho cả active `Bugs` và `Bugs.drafts`, để side-effect read của Fiori nhận được `assigneeDisplayName`.
- Thêm label ở property-level cho các value-list entity phổ biến để popup hiển thị `Priority Code`, `Priority` thay vì `code`, `name`.

### Kiểm chứng

- Playwright CLI cho thấy Assignee value help hiển thị các cột nghiệp vụ và sau khi chọn thì Assignee là `DatDT`, không còn UUID.
- Priority value help hiển thị `Priority Code` và `Priority`, không còn header kỹ thuật lowercase.
- `npx cds compile srv app/bug-management-ui --to edmx` pass.
- `npx cds deploy --to sqlite::memory:` pass.
- `node scripts/qa/test-idts6-programmatic.js` pass 21/21.
- `npx ui5 build --config ui5.yaml --clean-dest --dest <temp>` pass.
