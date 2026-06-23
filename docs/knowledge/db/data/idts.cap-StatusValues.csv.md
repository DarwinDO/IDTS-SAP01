# Knowledge: `db/data/idts.cap-StatusValues.csv`

## English

### What this file is for

Seed data for the `StatusValues` code list. This CSV is loaded by CAP into the database during local development (and integration profile) to populate the possible statuses for bugs.

It directly drives:
- Dropdowns and value helps for status in Fiori
- Backend validation in status transitions (ALLOWED_TRANSITIONS)
- Display of status name + semantic criticality (colors)
- Demo data and test scenarios

### IDTS flow and business meaning

In IDTS, bug status is one of the most important business concepts. The lifecycle is strictly controlled:

- Bugs usually start in `PENDING_ASSIGNMENT` or `ASSIGNED`
- `REJECTED` is **not a final state** — it requires follow-up by Tester or PM (see `nextProcessor`)
- `RESOLVED` → `RETEST_REQUIRED` → `CLOSED` is the happy close path
- `NEW` is kept only for legacy/import compatibility

The `code` column is what backend logic (in constants.js and handlers) compares against. The `criticality` column is used for UI semantic colors (1=neutral/blue, 2=critical/orange, 3=positive/green).

### Columns explained

- `code`: The stable internal key used everywhere in code (STATUS.ASSIGNED, etc.). Never change these casually.
- `name`: User-facing label shown in Fiori.
- `descr`: Description for documentation and tooltips.
- `sortOrder`: Controls display order in dropdowns and lists.
- `active`: Whether the status is still usable.
- `criticality`: Semantic color hint for Fiori (used in LineItem and Object Page).

### Impact if data is wrong or missing

- Wrong or missing codes → transition validation fails, or bugs get stuck in invalid states.
- Missing `PENDING_ASSIGNMENT` or `REJECTED` → assignment flow and rejection follow-up break.
- Wrong criticality → status colors are incorrect in List Report and Object Page (bad UX for PM and testers).
- Demo bugs in Bugs.csv reference these codes; breaking them breaks sample data.

### Important source anchors

- Header row + all 11 data rows define the complete status catalog used by `ALLOWED_TRANSITIONS` in constants.js.
- Rows for `PENDING_ASSIGNMENT`, `ASSIGNED`, `REJECTED`, `RESOLVED`, `RETEST_REQUIRED`, `CLOSED` are especially critical for core IDTS flows.

### Cross-folder dependency map

- **db/schema.cds**: `StatusValues` entity (extends CodeList) + association from `Bugs.status`.
- **srv/service.cds**: Projection + virtual flags like `isPendingAssignment`, `isRejectedFollowUp`.
- **srv/bug-service/constants.js**: `STATUS` object and `ALLOWED_TRANSITIONS` use the exact codes.
- **srv/bug-service/bug-write.js** and **actions.js**: `validateTransition` and `transitionBug` rely on these codes.
- **app/bug-management-ui/annotations/**: Value helps, LineItem Criticality, and status display in List Report / Object Page.
- **db/data/idts.cap-Bugs.csv**: Demo records reference these status codes.

### Safe editing checklist

- Never rename or remove codes that are referenced in `ALLOWED_TRANSITIONS` or demo data without updating everything.
- When adding a new status, also update constants.js, schema seed order if needed, transition rules, Fiori annotations, and tests.
- Keep `sortOrder` stable for consistent UX.
- After changes: run `cds deploy`, backend status tests, and browser check of status dropdown + colors.
- Update this mirror + any related mirrors (service.cds, constants, annotations).

## Vietnamese

### File này dùng để làm gì

Dữ liệu seed cho bảng `StatusValues`. File CSV này được CAP nạp vào database khi chạy local (và profile integration) để tạo danh sách trạng thái có thể có của bug.

Nó điều khiển trực tiếp:
- Dropdown và value help chọn trạng thái trên Fiori
- Kiểm tra chuyển trạng thái ở backend (ALLOWED_TRANSITIONS)
- Hiển thị tên trạng thái kèm màu sắc ngữ nghĩa (criticality)
- Dữ liệu demo và các kịch bản test

### Flow nghiệp vụ IDTS và ý nghĩa

Trong IDTS, trạng thái bug là khái niệm nghiệp vụ quan trọng nhất. Vòng đời được kiểm soát chặt chẽ:

- Bug thường bắt đầu ở `PENDING_ASSIGNMENT` hoặc `ASSIGNED`
- `REJECTED` **không phải trạng thái cuối** — phải có người xử lý tiếp (Tester hoặc PM qua `nextProcessor`)
- Đường happy close: `RESOLVED` → `RETEST_REQUIRED` → `CLOSED`
- `NEW` chỉ giữ lại để tương thích legacy/import

Cột `code` là giá trị mà backend so sánh (constants.js và các handler). Cột `criticality` dùng cho màu sắc semantic trên UI.

### Giải thích các cột

- `code`: Khóa nội bộ ổn định, dùng khắp nơi trong code. Không đổi bừa.
- `name`: Nhãn hiển thị cho người dùng trên Fiori.
- `descr`: Mô tả dùng cho tài liệu và tooltip.
- `sortOrder`: Thứ tự hiển thị trong dropdown và danh sách.
- `active`: Trạng thái còn được dùng hay không.
- `criticality`: Gợi ý màu sắc semantic cho Fiori (1=trung tính, 2=critical, 3=tích cực).

### Ảnh hưởng nếu dữ liệu sai hoặc thiếu

- Code sai/thiếu → kiểm tra chuyển trạng thái lỗi, bug kẹt trạng thái không hợp lệ.
- Thiếu `PENDING_ASSIGNMENT` hoặc `REJECTED` → luồng phân công và xử lý reject hỏng.
- Sai criticality → màu trạng thái sai trên List Report và Object Page (tệ cho PM và tester).
- Dữ liệu demo trong Bugs.csv tham chiếu các code này; hỏng thì dữ liệu mẫu cũng hỏng.

### Các điểm neo quan trọng trong source

- Dòng header + 11 dòng dữ liệu định nghĩa toàn bộ danh mục trạng thái dùng bởi `ALLOWED_TRANSITIONS`.
- Các dòng `PENDING_ASSIGNMENT`, `ASSIGNED`, `REJECTED`, `RESOLVED`, `RETEST_REQUIRED`, `CLOSED` đặc biệt quan trọng cho các flow cốt lõi của IDTS.

### Liên kết với file/folder khác

- **db/schema.cds**: Entity `StatusValues` (kế thừa CodeList) + association từ `Bugs.status`.
- **srv/service.cds**: Projection + các virtual flag `isPendingAssignment`, `isRejectedFollowUp`.
- **srv/bug-service/constants.js**: Đối tượng `STATUS` và `ALLOWED_TRANSITIONS` dùng đúng các code này.
- **srv/bug-service/bug-write.js** và **actions.js**: `validateTransition` và `transitionBug` phụ thuộc các code.
- **app/bug-management-ui/annotations/**: Value help, LineItem Criticality, hiển thị trạng thái ở List Report/Object Page.
- **db/data/idts.cap-Bugs.csv**: Dữ liệu demo tham chiếu các code trạng thái này.

### Khi sửa file này cần chú ý

- Không đổi tên hoặc xóa code đang dùng trong `ALLOWED_TRANSITIONS` hoặc demo data mà không cập nhật toàn bộ.
- Khi thêm trạng thái mới: cập nhật constants.js, quy tắc transition, annotation Fiori, và test.
- Giữ `sortOrder` ổn định để UX nhất quán.
- Sau khi sửa: chạy `cds deploy`, test chuyển trạng thái backend, và kiểm tra browser (dropdown + màu).
- Cập nhật mirror này cùng các mirror liên quan (service.cds, constants, annotations).

## Metadata

- Source file: `db/data/idts.cap-StatusValues.csv`
- Knowledge mirror: `docs/knowledge/db/data/idts.cap-StatusValues.csv.md`
- Source layer: `db/data`
- Source type: `.csv` (seed data)
- Documentation style: learning-oriented + IDTS domain impact
- Last reviewed: 2026-06-22