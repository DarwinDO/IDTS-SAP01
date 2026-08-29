# N5-Lite Digest diagnostics — source evidence

## English

N5-Lite deliberately replaces the original full N5 implementation. Exact PM + UserAdmin can inspect Digest delivery status in the existing User Administration Operations table. CAP reuses `NotificationDigestDeliveries` and the exact allowlisted `AdministrationDeliverySummary`; no new entity, table, action, worker, scheduler, provider or screen is introduced.

Security boundary: authorization precedes every read. Recipient email is resolved in page-bounded User lookups only to create the masked display. Subject, text/HTML bodies, provider message ID, internal recipient ID, lock fields and stored provider summary are not returned. Persisted error codes outside the public allowlist become `UNAVAILABLE`. Digest rows are read-only and always return `canRetry=false`.

TDD RED proved the existing unified read omitted the Digest table and the UI had no Digest label. Review-remediation RED also proved an unknown provider code leaked through regex-only sanitization and masked-recipient matches after row 10,100 were truncated. Focused GREEN proves three-source mixed reads, Digest-only reads, page-complete masked search, stable safe DTO output, error-code allowlisting, forbidden-field absence, localized filter/normalization and hidden retry. Manual retry and automated 90-day deletion remain deferred until measured need.

Final Security inventory found one further Important availability path: a privileged non-matching query could scan every Digest row. The approved TDD remediation caps each request at 20,000 candidate rows (200 fixed pages) and returns `DIGEST_SEARCH_TOO_BROAD` when the caller must refine the query. This keeps work bounded without silently returning an incomplete result.

## Tiếng Việt

N5-Lite chủ đích thay thế implementation N5 đầy đủ ban đầu. Đúng PM + UserAdmin có thể xem trạng thái delivery Digest trong bảng Operations User Administration hiện có. CAP reuse `NotificationDigestDeliveries` và đúng DTO allowlist `AdministrationDeliverySummary`; không thêm entity, table, action, worker, scheduler, provider hoặc màn hình.

Boundary security: authorization chạy trước mọi read. Email recipient chỉ được resolve theo User lookup bounded từng page để tạo display đã mask. Subject, body text/HTML, provider message ID, recipient ID nội bộ, lock và provider summary đã lưu không được trả ra. Error code persist ngoài public allowlist trở thành `UNAVAILABLE`. Row Digest read-only và luôn có `canRetry=false`.

TDD RED chứng minh unified read cũ bỏ sót bảng Digest và UI chưa có label Digest. RED remediation sau review còn chứng minh code provider lạ bị lộ qua sanitize chỉ bằng regex và match recipient sau row 10.100 bị cắt. Focused GREEN chứng minh mixed read ba source, Digest-only read, search masked recipient đầy đủ theo page, DTO an toàn ổn định, error-code allowlist, không có field cấm, filter/normalization localized và retry bị ẩn. Retry thủ công cùng xóa tự động 90 ngày vẫn defer đến khi có nhu cầu đo được.

Inventory Security cuối tìm thêm một path availability Important: query đặc quyền không match có thể quét mọi row Digest. Remediation TDD đã duyệt cap mỗi request tại 20.000 candidate row (200 page cố định) và trả `DIGEST_SEARCH_TOO_BROAD` khi caller cần thu hẹp query. Work được bound mà không trả result thiếu âm thầm.

## Verification / Kiểm định

- Final fresh PASS: User Administration Operations and UI focused contracts; My Notifications Digest regression; JavaScript syntax; CAP EDMX and HANA compile; User Administration lint/build with UI5 `1.148.0`; secret scan; agent rules `8/8`; QA-depth `15/15`; PR-body `11/11`; `git diff --check`; DB/root manifest/dependency scope guards.
- The first bounded review returned 0 Critical / 0 Major / 2 Important / 1 Minor. Both Important findings were covered by RED→GREEN remediation. Final exact-head review returned 0 Critical / 0 Major / 0 Important / 1 documentation-only Minor; that final stale wording is now updated.
- Codex Security remediation scan `086b9fc3-253d-448e-811d-895d2007b5ea` started on the exact candidate and preflight passed 3/3, but the installed plugin cache/MCP namespace disappeared before completion. Its unsealed canonical drafts remain preserved; no sealed zero-finding result is claimed for the remediation head. The earlier pre-remediation scan remains historical evidence only. TAC was not connected.
- After the plugin was restored, terminal exact-head scan `d6540079-0847-4d38-a3a4-63d0e187bdbc` reviewed the deterministic seven-file inventory at `4f91bcce...1c00ded4`, sealed complete coverage, and produced zero reportable findings. The report is preserved at `C:/Users/LapHub/AppData/Local/Temp/codex-security-scans-terminal/wp7-n5-lite-donhv/1c00ded407c4c4ae6502a471e0ebee959e6046b9_20260829T063422Z/report.md`.
- Ponytail and Ponytail Review found no dependency, new screen, action or speculative abstraction to remove: the existing table/DTO/filter are reused. Manual retry and retention remain deliberately unbuilt.
- OfficeCLI `1.0.145` preflight passed; Markdown is outside native OfficeCLI editing and used repository-native patching. CAP/UI5/Fiori MCP namespaces were not callable.
