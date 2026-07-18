# Runtime Comment Retrofit Inventory

## English

This inventory freezes the learning-material scope at 72 non-generated runtime files. The goal is not to comment every line. The goal is to explain every non-obvious entry point and small decision block well enough that a beginner can predict what runs next and where to place a breakpoint.

For each non-obvious function, event handler, CAP hook, annotation block, or UI action, the source comment must cover the relevant parts of this checklist:

- what UI action, request, CAP event, or caller triggers it;
- which input matters to the decision;
- what the block decides or validates;
- what it returns or changes;
- which function, file, database table, or external provider receives control next;
- where to stop the debugger when this behavior is wrong.

A single generic file-header comment does not pass. Comments must not narrate obvious imports, braces, assignments, or syntax. JSON and properties files remain valid without inline comments; their knowledge mirrors must explain the missing connections, especially Fiori manifest wiring.

Every source file has a matching bilingual knowledge mirror. Its explanation must use real symbols as anchors and include a beginner mental model, caller -> current symbol -> callee, request/data flow, side effects, cross-folder links, breakpoint order, expected variables, failure path, and safe-edit impact. English and Vietnamese must be equivalent in depth.

### IDTS-87 — DonHV

- `db/schema.cds`
- every `srv/**/*.js`, `srv/service.cds`, and `srv/auth.cds`

Priority traces: authentication/session, Fiori draft `NEW -> PATCH -> SAVE`, lifecycle transitions, email outbox, and AI advisory actions.

### IDTS-84 — DatDT

- `app/services.cds`, `app/bug-management-ui/annotations.cds`
- `annotations/labels.cds`, `list-report.cds`, `pm-monitoring.cds`
- shell/login/dashboard files, both CSS files, `ext/ai/AiReviewUi.js`, and `ext/login/*`
- `ClassificationReview.js`, `DuplicateReview.js`, `HandoffSummaryReview.js`
- `ClassificationReviewField.fragment.xml`, `SimilarBugReviewField.fragment.xml`

Priority traces: HTML/manifest entry point, login/session, OData read, role-aware dashboard, and AI review UI.

### IDTS-85 — SangVN

- the six remaining annotation files: `actions.cds`, `capabilities.cds`, `history-notifications.cds`, `object-page.cds`, `ownership-assignment.cds`, `value-helps.cds`
- collaboration, controls, assignment/list actions, and the four Object Page fragments listed in `ownership-map.md`

Priority traces: metadata-generated Object Page, Smart Assign, comments, pre-save attachments, history paging, and the difference between assignee and current action owner.

### QA verification

IDTS-86 stays blocked until all three batches are merged. NhanT then verifies structural coverage for all 72 files and deeply traces at least one flow per owner against the real source. A mirror that names a nonexistent symbol, a header-only comment, a syntax paraphrase, or an explanation that cannot produce a working breakpoint fails material QA.

## Vietnamese

Inventory này chốt phạm vi tài liệu học gồm 72 runtime file không generated. Mục tiêu không phải comment mọi dòng. Mục tiêu là giải thích từng entry point không hiển nhiên và từng khối quyết định nhỏ đủ rõ để người mới đoán được đoạn nào chạy tiếp theo và biết đặt breakpoint ở đâu.

Với mỗi function, event handler, CAP hook, annotation block hoặc UI action không hiển nhiên, comment trong source phải giải thích các ý phù hợp sau:

- thao tác UI, request, CAP event hoặc caller nào làm đoạn code chạy;
- input nào ảnh hưởng đến quyết định;
- khối code đang quyết định hoặc kiểm tra điều gì;
- nó trả về gì hoặc làm thay đổi dữ liệu nào;
- function, file, bảng database hoặc external provider nào nhận quyền xử lý tiếp;
- nên dừng debugger ở đâu khi hành vi này bị sai.

Chỉ có một comment chung ở đầu file thì không đạt. Không comment lại import, dấu ngoặc, phép gán hoặc cú pháp hiển nhiên. File JSON và properties không cần inline comment vì định dạng không hỗ trợ; knowledge mirror của chúng phải bù lại các liên kết còn thiếu, đặc biệt phần wiring của Fiori manifest.

Mỗi source file phải có knowledge mirror song ngữ tương ứng. Mirror phải dùng symbol thật làm anchor và có: mô hình tư duy cho người mới, caller -> symbol hiện tại -> callee, đường đi request/dữ liệu, side effect, liên kết khác folder, thứ tự breakpoint, biến cần xem, failure path và ảnh hưởng khi sửa. English và Vietnamese phải đầy đủ tương đương.

### IDTS-87 — DonHV

- `db/schema.cds`
- toàn bộ `srv/**/*.js`, `srv/service.cds` và `srv/auth.cds`

Luồng ưu tiên: authentication/session, Fiori draft `NEW -> PATCH -> SAVE`, lifecycle transition, email outbox và các AI advisory action.

### IDTS-84 — DatDT

- `app/services.cds`, `app/bug-management-ui/annotations.cds`
- `annotations/labels.cds`, `list-report.cds`, `pm-monitoring.cds`
- shell/login/dashboard, hai file CSS, `ext/ai/AiReviewUi.js` và `ext/login/*`
- `ClassificationReview.js`, `DuplicateReview.js`, `HandoffSummaryReview.js`
- `ClassificationReviewField.fragment.xml`, `SimilarBugReviewField.fragment.xml`

Luồng ưu tiên: entry point HTML/manifest, login/session, OData read, dashboard theo role và AI review UI.

### IDTS-85 — SangVN

- sáu annotation còn lại: `actions.cds`, `capabilities.cds`, `history-notifications.cds`, `object-page.cds`, `ownership-assignment.cds`, `value-helps.cds`
- collaboration, controls, assignment/list actions và bốn Object Page fragment trong `ownership-map.md`

Luồng ưu tiên: Object Page sinh từ metadata, Smart Assign, comments, attachment chọn trước khi Save, phân trang history và sự khác nhau giữa assignee với current action owner.

### Kiểm tra QA

IDTS-86 tiếp tục bị block đến khi ba batch đã merge. Sau đó NhanT kiểm tra coverage toàn bộ 72 file và trace sâu tối thiểu một flow của mỗi owner bằng cách đối chiếu với source thật. Mirror ghi symbol không tồn tại, comment chỉ có ở đầu file, comment kể lại cú pháp, hoặc lời giải thích không giúp đặt được breakpoint thật đều không đạt material QA.
