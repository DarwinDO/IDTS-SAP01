# WP8 Gate 6.3 — Developer Workload and Bug Drill-Down Source Evidence

## Exact scope and baseline

- Owner/executor: DonHV / Gate 6.3 source executor.
- Branch: `feature/wp8-user-admin-developer-workload-donhv`.
- Worktree: `C:\Users\LapHub\.codex\worktrees\b3a3\IDTS-SAP01`.
- Required base: `d53f402ab92215e44d29da2e1d3da73a576fffd3`.
- `origin/dev`, local `dev`, merge-base and initial detached checkout all matched the required SHA before the branch was created.
- Pre-remediation source/evidence head: `912aa5792b25beeab794d7c1fa3680baf78319cd`.
- Authorization remediation source commit: `f981816800e10b9600601844a308917aa394b7c9`; final status-only closure commit before PR creation: `0ac4e23a3ff2c2ba427eac8f7d23000a5e79115f`.
- Scope: named BugService model, read-only Developers → Workload overview, bounded assigned non-Closed Bug details, exact same-origin Bug Object Page links, the authorized narrow `srv/bug-service/monitoring.js` authorization remediation, focused contracts, bilingual mirrors, PM evidence and one Draft PR handoff.
- Explicitly out of scope: `db/`, schema/HANA/HDI, any `srv/` implementation file other than the authorized `srv/bug-service/monitoring.js` guard/scoping/readiness fix; `srv/service.cds` is permitted only for the exact read-contract Boolean; ordinary `BugService.Bugs` read-policy changes, dependency/lockfile, assignment/status mutation, platform/provider/user/role/data/email mutation, deployment, merge, Ready transition, runtime rollout, Gate 6.4 and worktree cleanup.

## Coordinator security diff finding and narrow readiness remediation

- The coordinator’s Codex Security branch-diff scan covered exact revision range `d53f402ab92215e44d29da2e1d3da73a576fffd3..50b68701da8a650917a0a0d218f50632820950fc` and reported one finding; the old scan was not zero findings.
- Exact finding: `csf_80d41b36a850713c6bbc2a4c`, occurrence `occ_52dec5bce30b309ab47d3757`, rule `ui-readiness.misrepresentation`, medium severity/high confidence, affected `app/user-administration-ui/webapp/controller/Main.controller.js:1364`, `srv/access/identity-readiness.js:9-18`, and `scripts/qa/test-user-admin-workload.js:88-104`.
- Report: `C:\Users\LapHub\AppData\Local\Temp\codex-security-scans-FgOWdt\IDTS-SAP01\50b68701da8a650917a0a0d218f50632820950fc_20260825T173136Z_qrim87f8\report.md`. TAC was unavailable because the connector was not connected; no live browser/BTP runtime was part of that scan.
- Root cause: the Workload browser normalized readiness from active profile plus `developerUserID`, which could label unlinked, suspended/inactive or incompletely provisioned Developers as ready. Coordinator’s prior `49/49` workload-auth, `13/13` XSUAA and UI workload checks did not cover target Developer identity-access readiness.
- Authorized remediation: `readDeveloperWorkloads` now calls the existing `readActiveIdentityAccessByUser` once for the scoped profile user IDs and uses `hasActiveIdentityAccess` to expose the read-only `identityAccessReady` Boolean. True requires active User + nonempty immutable external identity hash + exactly one matching `ACTIVE` onboarding request; false covers unlinked, inactive, missing/mismatched hash, duplicate matching requests and unknown legacy rows. Ordinary `BugService.Bugs` reads remain outside this remediation and are not described as newly exposed by Gate 6.3.

## Implemented source contract

- `manifest.json` adds `bugService` at `/odata/v4/bug/` and named `bugApi` with OData V4 server operation mode, `autoExpandSelect: true`, `earlyRequests: false`, and no preload.
- `Main.controller.js` creates an independent `workload` JSONModel with bounded page state, selected Developer state, and independent Bug-detail busy/error state.
- `DeveloperWorkloads` is read through `bugApi` with server order `isOverloaded desc, overdueOwnedBugCount desc, developerName asc, developerProfileID asc`; each request is capped at 100. Appends preserve server order and update the key set while iterating so duplicate Developer Profile rows are not rendered, including duplicates within one incoming page.
- Numeric counts and effort are normalized in the UI model. `developerProfileID` and `developerUserID` remain state-only values; internal IDs are not bound to visible XML. `identityAccessReady` is a server-derived display field from the authoritative identity-link invariant; the browser does not infer it from active profile state or IDs and it is not an authorization decision.
- The detail read uses `/Bugs` with `assignee_ID` equal to the selected Developer Profile and `status_code ne 'CLOSED'`, order `dueDate asc,bugNumber asc`, page length 100, and exactly these fields: `ID`, `bugNumber`, `title`, `status_code`, `priority_code`, `severity_code`, `dueDate`, `estimatedEffortHours`, `assigneeDisplayName`, and `currentActionOwnerDisplayName`.
- Overdue is calculated by UTC date-only semantics; a Bug due today is not overdue. `Technical Assignee` and `Current Action Owner` are separate columns and labels.
- Valid UUIDs navigate only to `/idtsbugmanagementui/index.html#/Bugs(ID=<uuid>,IsActiveEntity=true)` through `window.location.assign`; malformed/empty IDs do not navigate. No domain or new authentication flow is hard-coded.
- User Administration exposes no `bugApi` create/update/delete call. Assignment, lifecycle status, comments and attachments remain owned by Bug Management.
- `readDeveloperWorkloads` now resolves the caller through existing `resolveRequestUser`, which requires an active internal IDTS mapping and preserves platform-role alignment. Active PM reads all workload rows without `UserAdmin`; active Developer reads only rows whose `developerUserID` equals the resolved actor ID. The scope is applied before aggregate search/filter/order/page/count handling, and all other roles or unresolved/inactive/misaligned callers fail with 403. Ordinary `BugService.Bugs` read policy is unchanged.

## TDD and focused contract evidence

- RED contract commit `d26f971d33086cdd4870616e6bb013e41d3d6372`: the workload contract failed on the missing `bugService`/`bugApi` contract before source implementation.
- GREEN model commit `d8e9f28381b9c2daee5afca357370ab7da93d31a`: manifest/model/controller contract passed.
- GREEN overview commit `b2b446df2d06aa048d63b0a74608e637dc02f4ff`: Workload table, formatter states and three locale bundles passed focused/UI contracts.
- GREEN detail commit `8c4477419784d9be797c355f89aaf125d41f296a`: bounded Bug detail, dialog and exact navigation passed.
- Exact-diff review then produced a meaningful RED regression for duplicate rows within one incoming page. Fix commit `363b6a04f103dd0c60c7882b40a9c912ac74d5df` updates the key set during append; the focused contract now passes with prior-page and same-page duplicates.
- The bounded independent review of head `912aa5792b25beeab794d7c1fa3680baf78319cd` found one Major `DeveloperWorkloads` authorization/privacy gap. DonHV authorized the narrow server remediation. The new RED cycle first exposed 10 expected failures in `scripts/qa/test-developer-workload-programmatic.js`; the GREEN fix now passes PM all, Developer own-row, role denial, inactive/unmapped denial and client filter/search/page/count bypass cases.
- The coordinator’s exact-head Security diff scan of later status-only head `50b68701da8a650917a0a0d218f50632820950fc` then reported the one medium/high-confidence `ui-readiness.misrepresentation` finding above. The new RED cycle covers exact linked, unlinked, inactive, hash mismatch, duplicate matching ACTIVE requests and unknown legacy backlog; the focused GREEN now returns `61 PASS / 0 FAIL / 61 checks` and the UI contract rejects active-profile-plus-user-ID inference.
- The RED runner initially used a long-lived `srv.tx` outside the callback form and stopped before the new assertions; the test harness was corrected to use callback-scoped transactions, then the genuine RED and GREEN runs were observed. No ordinary `BugService.Bugs` read policy was changed.

## Fresh verification matrix

| Check | Result |
| --- | --- |
| `officecli --version` | `1.0.144`; OfficeCLI supports DOCX/XLSX/PPTX semantic operations, not Markdown editing, so the repository patch workflow was used for Markdown. |
| `npm run qa:user-admin-workload:programmatic` | PASS. Covers order, page boundary, duplicate removal, numeric normalization, open/limit formatting, UTC overdue boundary, closed exclusion, owner distinction, field allowlist and deep-link safety. |
| `npm run qa:user-admin-ui:programmatic` | PASS. Existing User Administration contracts remain green. |
| `npm run qa:user-admin-active-users:programmatic` | PASS. |
| `npm run qa:user-access:programmatic` | PASS. |
| `npm run qa:developer-workload:programmatic` | PASS: `61 PASS / 0 FAIL`, proving aggregate semantics plus server `identityAccessReady` exact/unlinked/inactive/hash-mismatch/duplicate/unknown cases, PM all, Developer own-row, role denial, active identity resolution and client filter/search/page/count isolation. |
| `npm run qa:idts113:btp-auth` | PASS: `13/13`; existing shared helper suite confirms XSUAA role alignment, mismatch and multiple-role fail-closed behavior. |
| `npm run qa:secret-scan` | PASS: no credential-like key patterns. |
| `npm run qa:agent-rules` | PASS: 8 required rules. |
| `npm run qa:depth:self-test` | PASS: `15 PASS / 0 FAIL`. |
| `npx cds compile srv -s all --to edmx` | Exit 0. Existing unrelated warning at `db/schema.cds:183` for attachment `NonUpdateableProperties` remains; no `srv/`/`db/` change is part of this gate. |
| `npx cds compile db/schema.cds --to hana` | Exit 0. No generated schema artifact is tracked or changed by this gate. |
| UI5 MCP lint | Empty result set for changed controller, formatter, view and detail fragment. |
| UI5 MCP manifest validation | `isValid: true`, zero errors. |
| `npm run lint --prefix app/user-administration-ui` | Exit 0, zero errors/warnings. |
| `npm run build --prefix app/user-administration-ui` | Exit 0; SAPUI5 `1.148.0` build and ZIP task succeeded. |
| `git diff --check origin/dev...HEAD` | Exit 0. |
| `git diff --exit-code origin/dev...HEAD -- db srv package-lock.json mta.yaml xs-security.json` | Exit 0; prohibited backend/schema/lockfile/deployment files are unchanged. |

| Coordinator Security diff scan on prior exact head `50b68701...` | One reportable medium/high-confidence finding `csf_80d41b36a850713c6bbc2a4c` / `occ_52dec5bce30b309ab47d3757` (`ui-readiness.misrepresentation`); not a zero-finding scan. TAC unavailable. The current remediation requires a fresh exact-head re-review before handoff. |
| Fresh readiness matrix and scope guard | `qa:user-admin-workload`, `qa:user-admin-ui`, `qa:user-admin-active-users`, `qa:user-access`, `qa:idts113:btp-auth` `13/13`, `qa:developer-workload` `61/0`, secret scan, agent rules, QA-depth `15/0`, CAP EDMX/HANA, UI5 MCP linter/manifest, UI lint/build and whitespace checks pass. Authorized `srv` paths are exactly `srv/bug-service/monitoring.js` and `srv/service.cds`; `db/`, dependency/lockfile and deployment paths are unchanged. |
| Readiness Important remediation and final re-review | Initial review of `7c50476f2fbed15de722de55fddca6d73789b53a` found one Important omission: `WORKLOAD_SELECT` did not request `identityAccessReady`. RED failed at that assertion; fix commit `44f3a349` adds the field. Fresh exact-head review of `44f3a34902f1f3e1b521f7a6f2c0c280b60f0d6d` returned `GO — 0 Critical / 0 Major / 0 Important / 0 Minor`. |

## Privacy, authorization and mutation boundary

- The Workload UI does not authorize any operation. `DeveloperWorkloads` now enforces server-side actor resolution and role/scoping: PM all rows, Developer own `developerUserID` row(s), and 403 for Tester, UserAdmin without PM, inactive, unmapped or misaligned callers. User Administration route authorization remains separate and still requires PM + `UserAdmin`.
- The Workload UI does not expose provider identifiers, identity tuples, credentials, audit payloads, comments, attachments, Bug descriptions or raw errors.
- Aggregate and detail reads are bounded and read-only. No workload snapshot, duplicated aggregation, assignment mutation, lifecycle mutation, email send, provider call, user/role change or business-data write was performed.
- The exact relative link is a navigation hint only; Bug Management remains the source of truth for Bug authorization and mutation.
- Ordinary `BugService.Bugs` reads are not part of this remediation and are not described as newly exposed by Gate 6.3.

## Browser/manual acceptance plan — not executed in this source gate

The following is the handoff plan for the separately approved manual/runtime gate:

1. Sign in as an authorized PM with UserAdmin and compare visible workload rows against known controlled Bug assignments, including overloaded, overdue, zero-load and inactive-with-open-backlog cases.
2. Use search and Load more with more than 100 Developers; prove server order remains overloaded first, then overdue count, name and profile ID, with no duplicate row across the page boundary.
3. Open one Developer workload and verify zero Bugs, one Bug, 100 Bugs, Closed exclusion, due-today not overdue, overdue-before-today, distinct Technical Assignee and Current Action Owner, and the absence of assignment/status/comment/attachment controls.
4. Select `Open Bug` and verify the exact Bug Object Page route on the same authenticated origin; malformed link data must produce no navigation.
5. Verify responsive dialog readability at narrow width, table pop-in, localized labels and no forbidden developer-facing copy.
6. Verify Tester direct access remains Forbidden, Developer direct access returns only the actor's own workload row, and no workload action changes Bug assignment/status/history/notification data.

This plan is not runtime acceptance and does not authorize deployment, data setup, user/role mutation or Gate 6.4.

## Dependency visibility and mutation ledger

| Category | Evidence/result |
| --- | --- |
| Baseline/branch | Clean exact base `d53f402...`; branch created only after readback. Final branch/head/PR are read back at handoff. |
| Dependency visibility | Target root/app `node_modules` were absent. Two validated local NTFS junctions point to the clean exact-lock `E:\IDTS-SAP01` root/app dependency trees; no install, upgrade, package declaration or lockfile write ran. |
| Repository | Only the Gate 6.3 app source, the authorized `srv/bug-service/monitoring.js` guard/scoping fix, focused QA contract and required documentation/PM files are changed. |
| External state | No HANA/HDI, CAP runtime data, provider, email, user/role, deployment, Jira, Drive, merge or Ready mutation occurred. |
| Release boundary | One Draft PR to `dev` is allowed after the bounded independent exact-head source/security review. Stop before Ready, merge, rollout or Gate 6.4. |

## English/Vietnamese mirror coverage

Updated matching bilingual mirrors for `manifest.json`, `Main.controller.js`, `Main.view.xml`, `formatter.js`, `i18n.properties`, `i18n_en.properties`, `i18n_vi.properties`, `srv/service.cds`, `srv/bug-service/monitoring.js`, and the focused workload QA contract. The mirrors document the server-derived `identityAccessReady` invariant and localized `Access readiness` label; they do not describe ordinary `BugService.Bugs` reads as newly exposed.

## Tóm tắt tiếng Việt

Gate 6.3 bổ sung model OData V4 có tên `bugApi` để đọc `DeveloperWorkloads` và detail Bug bounded, không tạo aggregation hoặc persistence mới. Workload dùng order phía server, page tối đa 100, giữ thứ tự khi append và loại duplicate theo `developerProfileID`. Detail chỉ đọc Bug chưa Closed được giao cho Developer, chỉ lấy allowlist field, tính overdue theo ngày UTC và tách rõ Technical Assignee với Current Action Owner. UUID hợp lệ mở đúng Bug Object Page cùng origin; ID sai không navigate.

Các contract TDD, suite User Administration/Active Users/User Access, workload backend `49/0`, secret scan, agent rules, QA-depth, CAP EDMX/HANA compile, UI5 MCP lint/manifest validation, UI lint/build và diff guard đều đã có evidence mới. Server đã scope PM all/Developer own-row trước filter/page/count và fail-closed role/identity; ordinary `BugService.Bugs` read policy không đổi. Đây chỉ là source gate; chưa có runtime/manual acceptance, deploy, mutation dữ liệu/provider/user/role/email, merge, Ready hoặc Gate 6.4.

## Draft PR handoff

- Exactly one Draft PR was created: `#349`, target `dev`, initial reviewed head `0ac4e23a3ff2c2ba427eac8f7d23000a5e79115f`.
- Remote PR body readback passed `QA Depth Gate PR body check: PASS (11 required sections)`.
- GitHub `qa-depth-gate` readback is `SUCCESS`; final branch/status-only readback is reported by the coordinator handoff.

## Approval boundary

This evidence supports the one Draft PR handoff only. It does not claim runtime/manual acceptance, deployment, merge, Ready, release, or Gate 6.4. The exact-head source review returned zero Critical/Major/Important/Minor; live XSUAA/browser acceptance and all later release decisions remain separate.

## 2026-08-26 live Actions-column remediation / Remediation cột Actions trên live

### English

- Live acceptance after the Gate 6.3 rollout showed correct workload data and server-derived Access readiness, but zero `View workload` buttons. The XML declared eight columns and nine row cells; the workload-state `ObjectStatus` occupied `Actions`, and UI5 did not render the extra button cell.
- Approved TDD baseline passed. RED failed exactly at `8 !== 9` for column/cell alignment and `1.0.14 !== 1.0.15` for the required cache identity. The minimal fix adds one i18n `Workload status` column before `Actions`, keeps the existing transparent button and handler, and aligns package/lock/manifest at `1.0.15`; focused GREEN passed.
- Fresh matrix: workload/UI/Active Users/User Access/Operations-Audit contracts PASS; secret scan PASS; agent rules `8/8`; QA-depth `15/15`; UI ESLint/build PASS; EDMX and HANA compile exit 0; diff check PASS. The existing attachment vocabulary warning remains outside the diff.
- Ponytail review: `Lean already. Ship.` The change reuses the native responsive table, existing status formatter, button, dialog and handler; no CSS, controller branch, dependency or abstraction was added.
- Codex Security diff scan `22c3ccf5-c51a-417c-9030-11109465c7b9` completed with zero findings across the five executable/source inventory items plus parent review of changed i18n/docs. Preflight was ready with parent fallback because delegation was not authorized; TAC advisory was unavailable because the connector was not logged in. One draft-schema write was rejected before persistence and then corrected on the same scan ID.
- Remaining release evidence: exact branch/PR/CI/merge readback, content-only `1.0.15` rollout, and browser reacceptance of View workload, details, ownership fields and the same-origin Bug Management deep-link.

### Vietnamese

- Acceptance live sau rollout Gate 6.3 cho thấy dữ liệu workload và Access readiness do server tính đúng, nhưng không có nút `View workload`. XML khai báo tám cột và chín cell của row; `ObjectStatus` trạng thái workload chiếm `Actions`, còn UI5 không render cell nút bị dư.
- Baseline TDD đã PASS. RED fail đúng `8 !== 9` cho alignment cột/cell và `1.0.14 !== 1.0.15` cho cache identity bắt buộc. Fix tối thiểu thêm một cột i18n `Trạng thái workload` trước `Actions`, giữ nút transparent cùng handler hiện có và đồng bộ package/lock/manifest tại `1.0.15`; focused GREEN đã PASS.
- Matrix mới: contract workload/UI/Active Users/User Access/Operations-Audit PASS; secret scan PASS; agent rules `8/8`; QA-depth `15/15`; UI ESLint/build PASS; compile EDMX và HANA exit 0; diff check PASS. Warning vocabulary attachment có sẵn vẫn nằm ngoài diff.
- Ponytail review: `Lean already. Ship.` Thay đổi tái sử dụng responsive table native, formatter trạng thái, button, dialog và handler hiện có; không thêm CSS, nhánh controller, dependency hoặc abstraction.
- Codex Security diff scan `22c3ccf5-c51a-417c-9030-11109465c7b9` hoàn tất với zero finding cho năm item source/executable trong inventory, cộng review parent cho i18n/docs đã đổi. Preflight ready với parent fallback vì task không cho phép delegation; TAC advisory không dùng được vì connector chưa đăng nhập. Một lần ghi draft sai schema bị từ chối trước persistence và đã sửa trên cùng scan ID.
- Evidence release còn lại: readback exact branch/PR/CI/merge, rollout content-only `1.0.15`, và browser reacceptance cho View workload, details, ownership field cùng deep-link Bug Management cùng origin.

### Final rollout and live reacceptance / Rollout cuối và live reacceptance

- English: PR #351 moved from Draft to Ready only after GitHub `qa-depth-gate` run `32921658437` succeeded, then merged to `dev` at `5812b29f49a8a00ff79a877a347b911b0a851858`. The GitHub runner emitted only its unrelated Node 20 action-deprecation annotation.
- English: the content-only MTAR SHA-256 was `86BBEE7EF590707D7A8DC30BCBD145855AD43570E13F8E7A06F3132368A1BD34`. Deep inspection found exactly two nested apps: Bug Management `0.0.5` and User Administration `1.0.15`; User Administration had a cachebuster, packed `workloadStatus`/`viewWorkload`, and zero `node_modules`. Operation `a738f1e0-a0f3-11f1-8b5a-eeee0a9eb3ea` finished without service deletion, CAP/AppRouter/HDI deployment or active residual MTA operation.
- English: final readiness returned CAP/AppRouter `1/1`, health/ready `200`, unauthenticated protected API `401`, Web `200`, and `DEMO READY`. Browser reacceptance found one Workload status header, 13 View workload buttons, a DatDT dialog with two non-Closed Bugs, separate Technical Assignee/Current Action Owner columns, two Open Bug actions, and exact same-origin navigation to the `BUG-0008` Object Page. No data, assignment, status, comment, attachment, provider, user or role mutation was submitted.
- Vietnamese: PR #351 chỉ chuyển từ Draft sang Ready sau khi GitHub `qa-depth-gate` run `32921658437` SUCCESS, rồi merge vào `dev` tại `5812b29f49a8a00ff79a877a347b911b0a851858`. Runner GitHub chỉ có annotation deprecation Node 20 không liên quan.
- Vietnamese: MTAR content-only có SHA-256 `86BBEE7EF590707D7A8DC30BCBD145855AD43570E13F8E7A06F3132368A1BD34`. Deep inspection có đúng hai app lồng: Bug Management `0.0.5` và User Administration `1.0.15`; User Administration có cachebuster, packed `workloadStatus`/`viewWorkload` và zero `node_modules`. Operation `a738f1e0-a0f3-11f1-8b5a-eeee0a9eb3ea` hoàn tất mà không xóa service, deploy CAP/AppRouter/HDI hoặc để lại MTA operation active.
- Vietnamese: readiness cuối trả CAP/AppRouter `1/1`, health/ready `200`, protected API unauthenticated `401`, Web `200` và `DEMO READY`. Browser reacceptance thấy một header Workload status, 13 nút View workload, dialog DatDT có hai Bug non-Closed, tách cột Technical Assignee/Current Action Owner, hai action Open Bug và navigation cùng origin chính xác tới Object Page `BUG-0008`. Không submit mutation dữ liệu, assignment, status, comment, attachment, provider, user hoặc role.
