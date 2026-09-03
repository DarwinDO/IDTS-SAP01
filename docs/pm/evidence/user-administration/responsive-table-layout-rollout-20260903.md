# User Administration responsive-table rollout evidence — 2026-09-03

## English

### Exact source and artifact

- Source PR `#373` merged into `dev` at `7beb3f22a27a9c786ecc6ec01ccb6ab291c6bfe7` after the exact Draft head `5ac48e29cf2dcf861a266ce9b9de4f09d7d790ae` passed GitHub `qa-depth-gate`.
- The dedicated UI build ran from a separate worktree at the exact merge commit.
- Artifact: `idts-user-admin-ui-responsive-7beb3f2.mtar`, 361,817 bytes, SHA-256 `DB67E57AB642B68907785F1C91AD187544204A93A76C926DDA6582D6F3E3C93D`.
- Deep inspection found one application-content module, one existing HTML5 repository host and exactly `bug-management-ui.zip` plus `user-administration-ui.zip`. User Administration was version `1.0.19`; the packaged XML contained the approved responsive properties. Forbidden CAP, DB/HDI, AppRouter, XSUAA, environment, credential and `node_modules` entries were zero.

### Deployment and readiness

- Pre-deploy `npm run btp:demo:check`: `DEMO READY` with CAP/AppRouter `1/1`, liveness/readiness `200`, anonymous protected API `401` and Web `200`.
- Content-only MultiApps operation `2f270c1c-a756-11f1-866f-eeee0a815b5e` selected only `idts-user-admin-ui-r3c-content`, used zero retries and abort-on-error, skipped service deletion and finished successfully.
- Operation logs confirmed a 360,356-byte content upload and successful repository processing. No CAP, DB/HDI, AppRouter code, service, provider, user/role or business-data deployment occurred.
- AppRouter was restarted once after the repository's unversioned application alias retained its earlier cache token. The restart returned `1/1`; independent readiness remained `DEMO READY`; active MTA operations returned zero.

### Authenticated Edge acceptance

- The explicit `1.0.19` repository URL returned a new cache-buster token and the deployed candidate. At the normal `1394px` CSS viewport, Active Users restored User from the pre-fix `0px` to `291px`; main rows were `52.59px`; Actions remained visible.
- Developer Workload restored User to `291px`; every sampled main row was `52.59px`; Actions remained visible. A refresh returned the live workload rows without browser warning/error logs.
- At a `1743 × 869` CSS viewport equivalent to the available page space at 80% zoom, Workload User was `240px`, Active Users User was `160px`, main rows remained bounded, all metrics could return inline and Actions remained visible.
- Developer Workload details kept Bug, Title and `Open Bug` reachable without horizontal scrolling. With the wide dialog, Bug/Title were `83.5px`; sampled real main rows were `68.59–107.78px`, a bounded improvement over the pre-fix `146.97px` maximum.
- Delivery, Provisioning and Audit retained visible Actions; sampled main rows were `41px`; browser warning/error logs were empty.

### Unversioned activation closure

The existing unversioned application alias initially retained the prior browser cache token while the explicit `1.0.19` URL returned the new version. Authoritative `cf html5-list -a idts-sap01-approuter -u` showed only User Administration `1.0.19`, with the correct host and deployment timestamp. SAP documents that omitting `appVersion` selects the latest version. A protocol-level `Page.reload(ignoreCache=true)` then fetched the new cache-buster token on the normal unversioned URL. Final alias acceptance returned 16 Active Users rows with User `291px`, sampled main rows `52.59px` and Actions visible; Developer Workload returned the same `291px`/`52.59px` bounded layout and an empty browser error log. No repository version was deleted and no application route changed.

### Tooling notes

- The first strict MBT attempt stopped before module build because the ignored generated directory `gen/user-admin-ui-r3c` was absent. Creating only that expected empty build directory allowed the exact rebuild.
- A read-only archive probe used unsupported `New-Item -LiteralPath`; its subsequent `jar xf` expanded generated MTAR files at the worktree root. Exact contained paths were verified and removed; no tracked source changed.
- PowerShell JSON parsing required `ConvertFrom-Json -AsHashtable` because the UI5 manifest contains an empty-name property. One regex probe also produced a false negative because literal `>` appears inside binding values; direct opening-tag readback confirmed the packaged property.
- The local CF client initially lacked `html5-list`. Two direct service-key metadata endpoint probes returned only HTTP `404`; credentials and tokens stayed in memory and were never printed or persisted. The SAP-documented CF Community `html5-plugin` `1.4.9` was installed temporarily, supplied the authoritative repository inventory, and was removed after acceptance.
- One Browser Control wait reached its 30-second session limit, and one semantic subtab locator missed an element already present in accessibility state. The session was reclaimed and the exact AX element was used; no product or external state changed.
- The first temporary-plugin removal command used the install-only `-f` flag and stopped with `unknown flag`; rerunning the documented uninstall command removed `html5-plugin` `1.4.9`. The first cleanup readback also treated `$LASTEXITCODE` as if `Select-String` set it, producing a false FAIL after both paths were already absent; the corrected match-count check passed.

### Cleanup receipt

- Both source and rollout worktrees were tracked-clean and their heads were ancestors of final `origin/dev` before removal.
- The two exact NTFS dependency junctions were verified and detached without touching their targets. Both worktree paths and registrations were removed, local and remote task branches were deleted after reachability proof, and `git worktree prune` completed.
- Local `dev` was not checked out in any worktree, so it was safely fast-forwarded to and configured to track final `origin/dev` `04caf72be1caa212b587b1ece592a3a0bffc31d0`.
- Final independent `npm run btp:demo:check` remained `DEMO READY`.

## Tiếng Việt

### Source, artifact và deploy chính xác

- PR `#373` merge vào `dev` tại `7beb3f22a27a9c786ecc6ec01ccb6ab291c6bfe7`; exact head trước merge đã PASS GitHub `qa-depth-gate`.
- MTAR UI-only có SHA-256 `DB67E57AB642B68907785F1C91AD187544204A93A76C926DDA6582D6F3E3C93D`, chỉ chứa content module, existing HTML5 host và hai UI ZIP. User Administration packaged đúng `1.0.19`; không có CAP, DB/HDI, AppRouter, XSUAA, credential hoặc `node_modules`.
- Operation `2f270c1c-a756-11f1-866f-eeee0a815b5e` chỉ deploy content module, không xóa service và hoàn tất thành công. Readiness trước/sau là `DEMO READY`; active MTA operation bằng zero.

### Acceptance Edge đã đạt trên version `1.0.19`

- Ở viewport thường `1394px`, Active Users và Developer Workload đều có User `291px`, main row `52.59px`, Actions còn hiện.
- Ở CSS space `1743 × 869` tương đương 80%, User còn `160–240px`, row bounded và Actions còn hiện.
- Workload details giữ Bug/Title/Open Bug truy cập được; row thật tối đa giảm từ `146.97px` xuống `107.78px` ở dialog rộng.
- Delivery, Provisioning và Audit có main row `41px`, Actions còn hiện; browser warning/error bằng zero.

### Đóng activation

`cf html5-list` xác nhận runtime chỉ phục vụ User Administration `1.0.19`. Alias không version ban đầu còn cache browser cũ; `Page.reload(ignoreCache=true)` lấy đúng token mới. Acceptance cuối trên chính alias mà Bug Management sử dụng trả 16 Active Users rows, User `291px`, main row `52.59px`, Actions còn hiện; Developer Workload cũng đạt `291px`/`52.59px`, browser error bằng zero. Không xóa version cũ hoặc đổi route.
