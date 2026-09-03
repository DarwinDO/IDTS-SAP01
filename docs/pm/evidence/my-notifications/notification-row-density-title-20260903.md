# My Notifications compact Bug title row — 2026-09-03

## English

DonHV confirmed `BUG-0017` has a stored title and description, then selected a compact notification contract that displays only Bug number and title. The earlier popover showed only event metadata because the caller-only DTO did not carry Bug context; the old row also rendered a redundant category icon and allowed horizontal overflow.

The fix removes the row icon, adds bounded `bugNumber`/`bugTitle` fields to `NotificationSummary`, hydrates them in the existing single bounded source query, renders `BUG-number — title` as the Bug primary line, omits Bug description, uses compact native margins, and disables horizontal scrolling. Access notifications retain their localized title/summary. No custom CSS or dependency is added.

TDD evidence: icon dependency RED then GREEN; DTO field RED then GREEN; horizontal-scroll/layout RED then GREEN. My Notifications UI/service/model/backfill/events/scheduled/digest, User Access notification, auth foundation/XSUAA `39/39`, cross-app UI contracts, configured UI lint/build, CAP EDMX/HANA compile, secret/rules/depth gates, AI DevKit lint, and `git diff --check` passed. CAP emitted only the existing attachment annotation warning. Codex Security diff scan `a9f4249f-6de2-4a08-91ab-0b089943b2a3` completed with zero findings across nine reviewed surfaces; TAC was unavailable and the parent-only fallback was used. PR, merge, CAP/UI rollout, live Browser Control acceptance, and cleanup evidence will be appended at their actual boundaries.

## Tiếng Việt

DonHV xác nhận `BUG-0017` có title và description đã lưu, sau đó chọn contract notification gọn chỉ hiển thị Bug number và title. Popover trước chỉ hiện metadata event vì DTO caller-only chưa mang context Bug; row cũ còn có icon category dư và cho phép overflow ngang.

Fix xóa icon row, thêm field có giới hạn `bugNumber`/`bugTitle` vào `NotificationSummary`, hydrate trong cùng source query bounded hiện có, render `BUG-number — title` làm dòng chính, không đưa Bug description, dùng margin compact native và tắt horizontal scrolling. Notification Access giữ title/summary đã localize. Không thêm custom CSS hoặc dependency.

Evidence TDD: dependency icon RED rồi GREEN; field DTO RED rồi GREEN; horizontal-scroll/layout RED rồi GREEN. Contract My Notifications UI/service/model/backfill/events/scheduled/digest, User Access notification, auth foundation/XSUAA `39/39`, cross-app UI, UI lint/build theo config, CAP EDMX/HANA compile, gate secret/rules/depth, AI DevKit lint và `git diff --check` đều PASS. CAP chỉ có warning attachment annotation đã tồn tại. Codex Security diff scan `a9f4249f-6de2-4a08-91ab-0b089943b2a3` hoàn tất với zero finding trên chín surface; TAC không khả dụng và dùng fallback parent-only. Evidence PR, merge, rollout CAP/UI, acceptance Browser Control live và cleanup sẽ được bổ sung đúng từng boundary thực tế.
