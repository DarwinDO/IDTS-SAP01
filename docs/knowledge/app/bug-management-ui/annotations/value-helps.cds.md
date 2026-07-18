# Knowledge: `app/bug-management-ui/annotations/value-helps.cds`

> **Ownership / debug anchor:** SangVN owns catalog value-help UX (backup: DonHV). A value help narrows choices, but invalid values must still be rejected by CAP validation.
> **Ownership / điểm debug:** SangVN sở hữu UX value help catalog (backup: DonHV). Value help thu hẹp lựa chọn, nhưng giá trị sai vẫn phải bị CAP validation chặn.

## English

### What this file is for

This file tells Fiori Elements which lookup dialogs to show when a user edits fields on a Bug.

In plain terms, a Value Help is the popup list behind fields such as Status, Priority, Application Component, Defect Category, Assignee, Current Action Owner, and Action Owner Role. Without these annotations, the UI would either show raw IDs/codes or provide a weak generic picker.

### Beginner explanation

CAP exposes the data model and OData service, but Fiori still needs hints about how a user should choose values. This file provides those hints with `@Common.ValueList`.

For IDTS, this matters because several fields are not free text:

- A tester should pick an Application Component from a controlled list.
- Defect Category should depend on the chosen Application Component.
- Assignee should come from suitable developers, not from every user in the system.
- Current Action Owner and Action Owner Role should use business wording, not the raw `nextProcessor` technical term.

### Flow in IDTS

During bug creation or editing, this file supports the classification and assignment flow:

1. The tester chooses an Application Component.
2. The Defect Category value help is filtered so only valid combinations are offered.
3. The backend derives or validates the Component Category from that pair.
4. The Assignee value help uses `AssignableDevelopers` so the tester sees suitable developers with readable context.
5. Current action owner fields stay read-only in normal UI usage, but their value help labels still need business-friendly wording because they can appear in generated dialogs, filters, or metadata-driven UI surfaces.

### Important source anchors

- Location: `annotate service.Bugs:applicationComponent.ID`
  - IDTS concept: Application Component is the place where the bug appears.
  - Impact if broken: Users may classify bugs against the wrong UI/module area.
  - Must check together: `db/schema.cds`, `srv/service.cds`, `db/data/idts.cap-ApplicationComponents.csv`, and `app/bug-management-ui/annotations/object-page.cds`.

- Location: `annotate service.Bugs:defectCategory.ID`
  - IDTS concept: Defect Category combines with Application Component to form the Component Category assignment key.
  - Impact if broken: Assignee filtering can become wrong because developer responsibility depends on the derived Component Category.
  - Must check together: `srv/bug-service/bug-write.js`, `srv/bug-service/read-models.js`, `db/data/idts.cap-ComponentCategories.csv`, and `db/data/idts.cap-DefectCategories.csv`.

- Location: `annotate service.Bugs:assignee.ID`
  - IDTS concept: Assignee means Technical Owner, the developer responsible for fixing the bug.
  - Impact if broken: Tester may assign bugs to unsuitable developers or see unreadable UUID values.
  - Must check together: `srv/service.cds` entity `AssignableDevelopers`, `srv/bug-service/read-models.js`, and `app/bug-management-ui/annotations/ownership-assignment.cds`.

- Location: `annotate service.Bugs:nextProcessorUser.ID`
  - IDTS concept: The technical field is `nextProcessorUser`, but the UI concept is Current Action Owner.
  - Impact if broken: Users may confuse the next person who must act with the technical assignee.
  - Must check together: `app/bug-management-ui/annotations/labels.cds`, `app/bug-management-ui/annotations/list-report.cds`, and `srv/bug-service/actions.js`.

- Location: `annotate service.Bugs:nextProcessorRole.code`
  - IDTS concept: The technical field is `nextProcessorRole`, but the UI concept is Action Owner Role.
  - Impact if broken: PM/Tester users may see raw backend wording and misunderstand ownership.
  - Must check together: `db/data/idts.cap-ProcessorRoleValues.csv`, `app/bug-management-ui/annotations/labels.cds`, and `docs/project-context.md`.

### Cross-folder impact

- `db/schema.cds` defines the associations and generated foreign-key fields used by these value helps.
- `srv/service.cds` exposes value-list entities such as `StatusValues`, `ValidDefectCategories`, `AssignableDevelopers`, `Users`, and `ProcessorRoleValues`.
- `srv/bug-service/read-models.js` builds the readable and filtered backend result sets.
- `db/data/*.csv` provides the seed lookup data shown in the popups.
- `app/bug-management-ui/annotations/labels.cds` supplies the final user-facing labels for the same concepts.

### Safe editing checklist

- Do not point `LocalDataProperty` to a field that is not exposed by `BugService.Bugs`.
- Keep technical names such as `nextProcessorUser` out of user-facing labels unless the screen is explicitly technical/debug-only.
- After editing, run `npx cds compile srv app/bug-management-ui --to edmx`.
- For visible Fiori behavior, also run the UI5 build and browser-check the relevant value help popup.
- If this file changes, update this knowledge note because the mapping between source property, backend lookup entity, and user-facing wording is easy to break.

## Vietnamese

### File này dùng để làm gì

File này nói cho Fiori Elements biết phải mở popup chọn dữ liệu nào khi user sửa các field trên Bug.

Nói dễ hiểu, Value Help là popup danh sách phía sau các field như Status, Priority, Application Component, Defect Category, Assignee, Current Action Owner, và Action Owner Role. Nếu không có các annotation này, UI có thể chỉ hiện ID/code thô hoặc mở một popup chọn dữ liệu quá chung chung.

### Giải thích cho người mới

CAP expose data model và OData service, nhưng Fiori vẫn cần thêm chỉ dẫn để biết user nên chọn giá trị bằng cách nào. File này cung cấp các chỉ dẫn đó bằng `@Common.ValueList`.

Với IDTS, phần này quan trọng vì nhiều field không phải text nhập tự do:

- Tester phải chọn Application Component từ danh sách chuẩn.
- Defect Category phải phụ thuộc vào Application Component đã chọn.
- Assignee phải lấy từ danh sách developer phù hợp, không phải toàn bộ user trong hệ thống.
- Current Action Owner và Action Owner Role phải dùng wording nghiệp vụ, không lộ thuật ngữ kỹ thuật `nextProcessor`.

### Flow hoạt động trong IDTS

Khi tạo hoặc sửa bug, file này hỗ trợ flow phân loại và phân công:

1. Tester chọn Application Component.
2. Value help của Defect Category được lọc để chỉ hiện các cặp hợp lệ.
3. Backend derive hoặc validate Component Category từ cặp đó.
4. Value help của Assignee dùng `AssignableDevelopers` để tester thấy developer phù hợp kèm thông tin dễ đọc.
5. Các field current action owner thường là read-only, nhưng label trong value help vẫn phải thân thiện vì chúng có thể xuất hiện trong dialog, filter hoặc UI sinh tự động từ metadata.

### Các điểm neo quan trọng

- Vị trí: `annotate service.Bugs:applicationComponent.ID`
  - Khái niệm IDTS: Application Component là nơi bug xuất hiện.
  - Ảnh hưởng nếu sai: User có thể phân loại bug vào sai khu vực UI/module.
  - Phải kiểm tra cùng: `db/schema.cds`, `srv/service.cds`, `db/data/idts.cap-ApplicationComponents.csv`, và `app/bug-management-ui/annotations/object-page.cds`.

- Vị trí: `annotate service.Bugs:defectCategory.ID`
  - Khái niệm IDTS: Defect Category kết hợp với Application Component để tạo Component Category, tức key dùng cho assignment.
  - Ảnh hưởng nếu sai: Bộ lọc assignee có thể sai vì developer responsibility phụ thuộc Component Category.
  - Phải kiểm tra cùng: `srv/bug-service/bug-write.js`, `srv/bug-service/read-models.js`, `db/data/idts.cap-ComponentCategories.csv`, và `db/data/idts.cap-DefectCategories.csv`.

- Vị trí: `annotate service.Bugs:assignee.ID`
  - Khái niệm IDTS: Assignee nghĩa là Technical Owner, tức developer chịu trách nhiệm xử lý kỹ thuật của bug.
  - Ảnh hưởng nếu sai: Tester có thể assign nhầm developer hoặc thấy UUID khó đọc.
  - Phải kiểm tra cùng: `srv/service.cds` entity `AssignableDevelopers`, `srv/bug-service/read-models.js`, và `app/bug-management-ui/annotations/ownership-assignment.cds`.

- Vị trí: `annotate service.Bugs:nextProcessorUser.ID`
  - Khái niệm IDTS: Field kỹ thuật là `nextProcessorUser`, nhưng khái niệm hiển thị cho user là Current Action Owner.
  - Ảnh hưởng nếu sai: User có thể nhầm người cần hành động tiếp theo với developer assignee.
  - Phải kiểm tra cùng: `app/bug-management-ui/annotations/labels.cds`, `app/bug-management-ui/annotations/list-report.cds`, và `srv/bug-service/actions.js`.

- Vị trí: `annotate service.Bugs:nextProcessorRole.code`
  - Khái niệm IDTS: Field kỹ thuật là `nextProcessorRole`, nhưng khái niệm hiển thị cho user là Action Owner Role.
  - Ảnh hưởng nếu sai: PM/Tester có thể thấy wording backend thô và hiểu sai ownership.
  - Phải kiểm tra cùng: `db/data/idts.cap-ProcessorRoleValues.csv`, `app/bug-management-ui/annotations/labels.cds`, và `docs/project-context.md`.

### Liên kết với folder khác

- `db/schema.cds` định nghĩa association và các foreign-key field được dùng trong value help.
- `srv/service.cds` expose các entity tra cứu như `StatusValues`, `ValidDefectCategories`, `AssignableDevelopers`, `Users`, và `ProcessorRoleValues`.
- `srv/bug-service/read-models.js` tạo các danh sách backend đã được lọc và dễ đọc.
- `db/data/*.csv` cung cấp seed lookup data được hiển thị trong popup.
- `app/bug-management-ui/annotations/labels.cds` giữ label cuối cùng mà user nhìn thấy cho cùng các khái niệm.

### Checklist sửa an toàn

- Không trỏ `LocalDataProperty` tới field không được expose bởi `BugService.Bugs`.
- Không để thuật ngữ kỹ thuật như `nextProcessorUser` xuất hiện trong label cho user, trừ khi đó là màn hình kỹ thuật/debug.
- Sau khi sửa, chạy `npx cds compile srv app/bug-management-ui --to edmx`.
- Với hành vi Fiori nhìn thấy được, chạy thêm UI5 build và kiểm tra popup value help liên quan trên browser.
- Nếu file này đổi, phải cập nhật note này vì mapping giữa source property, backend lookup entity và wording hiển thị rất dễ bị lệch.

## IDTS-43 update - fixed value lists for key catalog fields

### English

IDTS-43 adds `@Common.ValueListWithFixedValues : true` to `priority.code`, `severity.code`, and `environment.code`.

For a new Fiori learner, this means Fiori should treat these three fields like controlled dropdown/value-list fields, not like open text inputs. The backend still performs the final validation in `srv/bug-service/bug-write.js`, but the UI now gives the user the safer interaction first: choose from the configured catalog instead of typing an arbitrary code.

Important anchor:

- Location: `annotate service.Bugs:priority.code`, `annotate service.Bugs:severity.code`, `annotate service.Bugs:environment.code`
  - IDTS concept: Priority, Severity, and Environment are catalog values, not free-text descriptions.
  - Impact if broken: Users can type invalid values more easily, which leads to backend 400 errors or confusing create/edit forms.
  - Must check together: `db/schema.cds` value-list associations, `srv/bug-service/bug-write.js` active-code validation, `srv/service.cds` projections for Priority/Severity/Environment, and seed files under `db/data/`.

### Vietnamese

IDTS-43 thêm `@Common.ValueListWithFixedValues : true` cho `priority.code`, `severity.code`, và `environment.code`.

Với người mới học Fiori, điều này nghĩa là Fiori nên xem ba field này như field chọn từ danh sách chuẩn, không phải ô nhập text tự do. Backend vẫn là lớp kiểm tra cuối cùng trong `srv/bug-service/bug-write.js`, nhưng UI giờ hướng user theo cách an toàn hơn trước: chọn từ catalog đã cấu hình thay vì tự gõ một code bất kỳ.

Điểm neo quan trọng:

- Vị trí: `annotate service.Bugs:priority.code`, `annotate service.Bugs:severity.code`, `annotate service.Bugs:environment.code`
  - Khái niệm IDTS: Priority, Severity, và Environment là giá trị catalog, không phải mô tả text tự do.
  - Ảnh hưởng nếu sai: User dễ nhập giá trị không hợp lệ hơn, dẫn tới lỗi backend 400 hoặc form tạo/sửa gây khó hiểu.
  - Phải kiểm tra cùng: association value-list trong `db/schema.cds`, validation catalog active trong `srv/bug-service/bug-write.js`, projection Priority/Severity/Environment trong `srv/service.cds`, và seed files trong `db/data/`.

## Metadata

- Source file: `app/bug-management-ui/annotations/value-helps.cds`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/annotations/value-helps.cds.md`
- Source layer: `app`
- Last reviewed: 2026-07-01

## Execution map / Sơ đồ thực thi (2026-07-18)

**English.** Fiori uses each `Common.ValueList` to query a catalog entity and copy selected output values back to the Bug draft. In-parameters filter dependent choices, for example SAP Module → Application Component → valid Defect Category. Fixed values prevent arbitrary text in the UI, but CAP handlers still reject unknown, inactive, whitespace, or unauthorized values. Inspect the value-help Network GET, parameter mapping, then backend validation on PATCH/SAVE.

**Tiếng Việt.** Fiori dùng mỗi `Common.ValueList` để query catalog entity rồi copy output được chọn vào Bug draft. In-parameter lọc lựa chọn phụ thuộc, ví dụ SAP Module → Application Component → Defect Category hợp lệ. Fixed value ngăn free text ở UI nhưng CAP handler vẫn chặn mã lạ, inactive, whitespace hoặc không đủ quyền. Kiểm Network GET của value help, mapping parameter, rồi validation backend ở PATCH/SAVE.
