# Knowledge: `i18n_vi.properties`

## 2026-08-26 Gate 6.3 access-readiness copy

Bundle tiếng Việt có `accessReadinessLabel=Mức sẵn sàng truy cập`, `accessReadinessReadyText=Sẵn sàng` và `accessReadinessAttentionText=Cần chú ý` cho Boolean `identityAccessReady` do server tính. Giữ parity với `i18n.properties` và `i18n_en.properties`; không suy luận access readiness từ profile active hoặc user ID trong browser.

## English / Tiếng Việt

This Vietnamese mirror provides Gate 6 Operations and Audit labels for the same safe UI concepts as the English-first property files: delivery/provisioning tabs, readiness, bounded statuses, action/result filters, safe detail labels, and retry/reconcile feedback. Existing untranslated application keys continue to fall back to the English-first bundle.

File mirror tiếng Việt cung cấp label Gate 6 Operations và Audit cho cùng các khái niệm UI an toàn như bộ properties English-first: tab delivery/provisioning, readiness, status bounded, filter action/result, label detail an toàn và feedback retry/reconcile. Key cũ chưa dịch tiếp tục fallback về bundle English-first.

**Parity rule:** Add any new Gate 6 user-visible key to `i18n.properties`, `i18n_en.properties`, and this file together. Do not put raw server errors, provider values, endpoints, credentials, or identity data into localized copy.

**Quy tắc parity:** Khi thêm key user-facing Gate 6, phải thêm đồng thời vào `i18n.properties`, `i18n_en.properties` và file này. Không đưa raw server error, provider value, endpoint, credential hoặc identity data vào copy locale.

## Gate 6.1 navigation and action copy / Copy navigation và action Gate 6.1

### English

The Vietnamese bundle now contains localized Gate 6.1 copy for all six top-level tab tooltips, the three distinct Developer row-action tooltips, and the change-role informational hint. Existing older keys may still fall back to the English-first bundle, but these new clarity keys are deliberately present in all three files so the changed screen does not lose meaning on locale switch.

- **IDTS concept**: Vietnamese users can discover each administration workspace and distinguish business-role change, Developer responsibility management, and revoke access.
  **Impact if broken**: A locale change can remove the only explanation attached to an icon-only action or make the role dialog's safe boundary unclear.
  **Must check together**: `i18n.properties`, `i18n_en.properties`, `Main.view.xml:28-35,37,121,230,279,390,440`, and `ManageAccess.fragment.xml:15-20`.

### Tiếng Việt

Bundle tiếng Việt hiện có copy Gate 6.1 đã dịch cho cả sáu tooltip tab cấp cao, ba tooltip riêng của Developer row action và hint thông tin trong dialog đổi role. Một số key cũ vẫn có thể fallback về bundle English-first, nhưng các key làm rõ mới được cố ý thêm vào cả ba file để màn hình đã sửa không mất ý nghĩa khi đổi locale.

- **Khái niệm IDTS**: User tiếng Việt có thể khám phá từng workspace administration và phân biệt đổi business role, quản trị responsibility của Developer với thu hồi quyền truy cập.
  **Ảnh hưởng nếu sai**: Đổi locale có thể làm mất explanation duy nhất gắn với action icon-only hoặc làm boundary an toàn của dialog đổi role không rõ.
  **Phải kiểm tra cùng**: `i18n.properties`, `i18n_en.properties`, `Main.view.xml:28-35,37,121,230,279,390,440` và `ManageAccess.fragment.xml:15-20`.

### Safe editing / Sửa an toàn

Keep the new keys in all three bundles with equivalent meaning. Do not replace business wording with raw technical terms or provider details.

Giữ key mới trong cả ba bundle với ý nghĩa tương đương. Không thay wording nghiệp vụ bằng term kỹ thuật raw hoặc chi tiết provider.
## Gate 6.2

Vietnamese labels mirror Access, Developers and same-role validation without changing technical keys.

Label tiếng Việt mirror Access, Developers và validation cùng role mà không đổi technical key.

## Gate 6.3 workload copy / Copy workload Gate 6.3

### English

The Vietnamese bundle carries localized Gate 6.3 labels for Developer Workload navigation, workload search and paging, overload/overdue state, open/limit and effort values, and the Bug detail ownership fields. The explanatory wording keeps `Technical Assignee` and `Current Action Owner` distinct and does not claim that the Workload area can change a Bug.

- **IDTS concept**: Vietnamese copy supports PM workload review while preserving the read-only boundary and the same-origin Bug navigation meaning.
- **Impact if broken**: A locale switch can blur ownership terms, hide empty/error states, or suggest that the Workload view owns assignment/status changes.
- **Must check together**: `i18n.properties`, `i18n_en.properties`, `Main.view.xml`, `DeveloperWorkloadDetails.fragment.xml`, and the workload contract.

### Tiếng Việt

Bundle tiếng Việt có label Gate 6.3 đã dịch cho navigation Developer Workload, search/paging workload, state overload/overdue, giá trị open/limit và effort, cùng field ownership trong detail Bug. Wording tách rõ `Technical Assignee` và `Current Action Owner`, đồng thời không nói rằng khu vực Workload có thể đổi Bug.

- **Khái niệm IDTS**: Copy tiếng Việt hỗ trợ PM review workload nhưng giữ boundary chỉ đọc và ý nghĩa navigation Bug cùng origin.
- **Ảnh hưởng nếu sai**: Đổi locale có thể làm mờ ownership term, mất empty/error state hoặc gợi ý Workload sở hữu thay đổi assignment/status.
- **Phải kiểm tra cùng**: `i18n.properties`, `i18n_en.properties`, `Main.view.xml`, `DeveloperWorkloadDetails.fragment.xml` và workload contract.

### Safe editing / Sửa an toàn

Keep all workload keys present in the three bundles with equivalent meaning. Keep Vietnamese user-facing wording clear and do not insert raw backend/provider/identity values.

Giữ toàn bộ key workload trong cả ba bundle với ý nghĩa tương đương. Giữ wording tiếng Việt rõ cho user và không chèn raw backend/provider/identity value.

The `workloadStatus=Trạng thái workload` key keeps the informational status column separate from Actions. Vietnamese: key `workloadStatus=Trạng thái workload` tách cột trạng thái thông tin khỏi cột Actions.

## Gate 6.4 navigation keys / Key điều hướng Gate 6.4

**English.** The Vietnamese bundle uses `Quay lại Bug Management` for both the visible action and tooltip, preserving the same navigation meaning as the default/English bundles.

**Tiếng Việt.** Bundle tiếng Việt dùng `Quay lại Bug Management` cho cả action hiển thị và tooltip, giữ đúng cùng ý nghĩa điều hướng với bundle mặc định/tiếng Anh. Không thêm domain, token hoặc thuật ngữ provider vào copy.
