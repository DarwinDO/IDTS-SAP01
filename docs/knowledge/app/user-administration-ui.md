# Knowledge: `app/user-administration-ui`

## Gate 2 Active Users / Active Users Gate 2

The main view now separates three user-administration surfaces in an `IconTabBar`: existing Access Requests, read-only Active Users, and a read-only Developer Responsibilities summary. The request table keeps its existing actions and `requests` model. Active Users uses a separate `activeUsers` JSON model, loads when either new tab is first selected or when that tab is restored from session state, and calls the CAP `searchActiveUsers` action rather than the provider or BTP API.

Main view tách ba surface user administration trong `IconTabBar`: Access Requests hiện có, Active Users chỉ đọc và summary Developer Responsibilities chỉ đọc. Bảng request giữ action và model `requests` hiện có. Active Users dùng JSON model riêng `activeUsers`, load khi một trong hai tab mới được chọn lần đầu hoặc tab được restore từ session state, và gọi CAP action `searchActiveUsers`, không gọi provider hoặc BTP API.

Active Users keeps the search query and revoked-user filter in the current browser session, normalizes the query before sending it, and ignores stale responses when searches overlap. The CAP action uses explicit `skip/top` paging with a bounded page size; the UI appends pages through a guarded Load More action and de-duplicates by user ID. The table explicitly shows the User Administration capability beside Business Role, then uses friendly localized labels, semantic `ObjectStatus` states, responsive pop-in columns, busy/no-data/error states, and a retry action. The Developer Responsibilities tab derives its display list from the same safe summary response and provides one View Details entry point.

Active Users giữ query và filter user revoked trong session browser hiện tại, chuẩn hóa query trước khi gửi và bỏ qua response cũ khi search chồng nhau. CAP action dùng paging explicit `skip/top` với page size bounded; UI nối page bằng Load More có guard và deduplicate theo user ID. Table hiển thị rõ capability User Administration bên cạnh Business Role, sau đó dùng label thân thiện qua i18n, `ObjectStatus` semantic, column responsive pop-in, busy/no-data/error state và retry. Tab Developer Responsibilities lọc danh sách hiển thị từ cùng safe summary response và cung cấp một entry point View Details.

The details dialog calls `readActiveUserDetails` only after the user selects View Details. It shows display/contact, role, derived access state, safe booleans, readiness/responsibility counts, safe operation summary, reconciliation timestamp, request/audit counts, and the allow-listed Developer profile summary. Gate 3 adds state-bound Change Role, Suspend Access, Reactivate Access, and Revoke Access buttons. Each opens a confirmation dialog with a bounded reason, requires explicit confirmation, and sends only the CAP action payload; no provider inventory, credential, or identity-claim control is present.

Dialog details chỉ gọi `readActiveUserDetails` sau khi user chọn View Details. Dialog hiển thị display/contact, role, access state suy ra, boolean an toàn, readiness/count responsibility, operation summary an toàn, timestamp reconciliation, count request/audit và summary profile Developer được allow-list. Gate 3 thêm nút Change Role, Suspend Access, Reactivate Access và Revoke Access theo đúng state. Mỗi nút mở confirmation dialog với reason có giới hạn, bắt buộc xác nhận rõ ràng và chỉ gửi payload của CAP action; không có control provider inventory, credential hoặc identity claim.

## Developer responsibilities / Phạm vi phụ trách Developer

The Invite and Change Role dialogs show Developer Profile fields only when DEVELOPER is selected. Active Developers have a Manage Responsibilities action for availability, workload, Component Category, optional SAP Module, level, reason, and open-Bug impact. UI sends structured inputs; CAP remains authoritative for authorization and validation.

Dialog Invite/Change Role chỉ hiện Developer Profile khi chọn DEVELOPER. Developer active có action Manage Responsibilities để chỉnh availability, workload, Component Category, SAP Module tùy chọn, level, reason và xem open-Bug impact. UI gửi structured input; CAP vẫn là lớp phân quyền và validation cuối.

`idts.useradministrationui` is the standalone SAPUI5 administration surface for controlled IDTS onboarding. The responsive table uses the protected `searchOnboarding` POST action, normalizes the query to lowercase, and shows at most 200 request summaries containing the requested business role, optional PM-only UserAdmin overlay, lifecycle status, expiry, and sanitized delivery failure summary. The search value is carried in a POST body instead of an OData `$filter` URL, reducing email exposure in browser/proxy access logs.

The invite dialog submits the unbound OData V4 `requestOnboarding` action with `email`, exactly one allowlisted `requestedRole`, and `userAdminRequested`. TESTER/DEVELOPER use this confirmation as their approval and auto-queue only after identity verification; PM/UserAdmin still expose confirmation-gated Approve & Provision. Change Role, Revoke, Retry and Reconcile remain state-bound. The UI never calls the broker/BTP API directly and never announces `ACTIVE` merely because an operation was queued.

The HTML5 application's `xs-app.json` requires the `$XSAPPNAME.UserAdmin` scope for both static application entry and the OData route. CAP additionally requires exactly one PM business role and a matching active internal PM, so direct API calls and stale/non-PM sessions still fail closed. The UI never displays raw provider responses, credentials, invitation tokens, issuer values, or identity subjects.

The access-change dialog keeps a bounded content width and relies on current UI5 responsive dialog behavior. It does not use the deprecated `stretchOnPhone` property; the focused UI contract and UI5 linter enforce that boundary.

Initial request loading starts once from `onAfterRendering`, after the component models have propagated to the view. The initial-load guard prevents a later rendering cycle from issuing a duplicate search. User-visible text is resolved through the owner component's resource bundle, so an early service failure cannot be masked by an unavailable view-level i18n model.

The HTML5 manifest version and package version stay aligned and advance whenever deployed UI content changes. The production build explicitly generates `sap-ui-cachebuster-info.json`, while `index.html` enables the standard UI5 application cache buster. UI5 then rewrites application resource URLs with their build signatures, so a content-only deployment cannot silently keep an older `Component-preload.js` in the browser cache.

Vietnamese: Day la app SAPUI5 rieng cho PM duoc gan capability UserAdmin. Man hinh moi, approve, doi role va revoke qua CAP. Retry chi hien cho loi tam thoi; Reconcile chi hien cho ket qua provider mo ho va co confirmation rieng. UI khong goi BTP API truc tiep va khong giu credential. `ACTIVE` chi hien sau khi broker readback thanh cong. Real SAP adapter van chua live trong source-candidate.

Lan load dau bat dau dung mot lan trong `onAfterRendering`, sau khi model cua component da duoc gan xuong view. Guard chan render lai goi trung search. Message loi lay i18n truc tiep tu owner component, nen loi service som khong bi che boi view chua co i18n model.

Moi ban deploy HTML5 phai dong bo va tang version trong `manifest.json` va `package.json`. Production build tao `sap-ui-cachebuster-info.json`, con `index.html` bat UI5 application cache buster de trinh duyet lay dung `Component-preload.js` moi thay vi giu JavaScript cu.

Action visibility mirrors the backend state-code-attempt boundary. Retry appears for `RETRYABLE_FAILURE` and for the exact one-time migration tuple `BLOCKED_MANUAL_REVIEW + PROVIDER_REQUEST_INVALID + attemptCount 4`. Reconcile appears only for `BLOCKED_MANUAL_REVIEW + AMBIGUOUS_PROVIDER_OUTCOME`. After the migration attempt advances, another request-invalid result exposes no action; CAP repeats the same checks for direct requests.

Vietnamese: UI bam sat boundary state-code-attempt cua backend. Retry hien cho `RETRYABLE_FAILURE` va dung tuple migration mot lan `BLOCKED_MANUAL_REVIEW + PROVIDER_REQUEST_INVALID + attemptCount 4`. Reconcile chi hien cho `BLOCKED_MANUAL_REVIEW + AMBIGUOUS_PROVIDER_OUTCOME`. Sau lan migration, neu request van invalid thi attempt da tang va UI khong hien action nua; CAP van kiem tra lai neu goi API truc tiep.

## Verification

- `npm run qa:user-admin-ui:programmatic`
- `npm --prefix app/user-administration-ui test`
- `npm --prefix app/user-administration-ui run build`
- UI5 MCP manifest validation and linter

Live browser, XSUAA scope deployment, real Role Collection assignment, HANA migration, provider reconciliation, revoke, and stale-session acceptance remain later controlled gates.
