# WP8 Gate 6.3 — Developer Workload and Bug Drill-Down Source Evidence

## Exact scope and baseline

- Owner/executor: DonHV / Gate 6.3 source executor.
- Branch: `feature/wp8-user-admin-developer-workload-donhv`.
- Worktree: `C:\Users\LapHub\.codex\worktrees\b3a3\IDTS-SAP01`.
- Required base: `d53f402ab92215e44d29da2e1d3da73a576fffd3`.
- `origin/dev`, local `dev`, merge-base and initial detached checkout all matched the required SHA before the branch was created.
- Pre-remediation source/evidence head: `912aa5792b25beeab794d7c1fa3680baf78319cd`.
- Scope: named BugService model, read-only Developers → Workload overview, bounded assigned non-Closed Bug details, exact same-origin Bug Object Page links, the authorized narrow `srv/bug-service/monitoring.js` authorization remediation, focused contracts, bilingual mirrors, PM evidence and one Draft PR handoff.
- Explicitly out of scope: `db/`, schema/HANA/HDI, any `srv/` file other than the authorized `srv/bug-service/monitoring.js` guard/scoping fix, ordinary `BugService.Bugs` read-policy changes, dependency/lockfile, assignment/status mutation, platform/provider/user/role/data/email mutation, deployment, merge, Ready transition, runtime rollout, Gate 6.4 and worktree cleanup.

## Implemented source contract

- `manifest.json` adds `bugService` at `/odata/v4/bug/` and named `bugApi` with OData V4 server operation mode, `autoExpandSelect: true`, `earlyRequests: false`, and no preload.
- `Main.controller.js` creates an independent `workload` JSONModel with bounded page state, selected Developer state, and independent Bug-detail busy/error state.
- `DeveloperWorkloads` is read through `bugApi` with server order `isOverloaded desc, overdueOwnedBugCount desc, developerName asc, developerProfileID asc`; each request is capped at 100. Appends preserve server order and update the key set while iterating so duplicate Developer Profile rows are not rendered, including duplicates within one incoming page.
- Numeric counts and effort are normalized in the UI model. `developerProfileID` and `developerUserID` remain state-only values; internal IDs are not bound to visible XML. Readiness is a display hint from the active profile/link state and is not an authorization decision.
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
- The RED runner initially used a long-lived `srv.tx` outside the callback form and stopped before the new assertions; the test harness was corrected to use callback-scoped transactions, then the genuine RED and GREEN runs were observed. No ordinary `BugService.Bugs` read policy was changed.

## Fresh verification matrix

| Check | Result |
| --- | --- |
| `officecli --version` | `1.0.144`; OfficeCLI supports DOCX/XLSX/PPTX semantic operations, not Markdown editing, so the repository patch workflow was used for Markdown. |
| `npm run qa:user-admin-workload:programmatic` | PASS. Covers order, page boundary, duplicate removal, numeric normalization, open/limit formatting, UTC overdue boundary, closed exclusion, owner distinction, field allowlist and deep-link safety. |
| `npm run qa:user-admin-ui:programmatic` | PASS. Existing User Administration contracts remain green. |
| `npm run qa:user-admin-active-users:programmatic` | PASS. |
| `npm run qa:user-access:programmatic` | PASS. |
| `npm run qa:developer-workload:programmatic` | PASS: `49 PASS / 0 FAIL`, proving aggregate semantics plus PM all, Developer own-row, role denial, active identity resolution and client filter/search/page/count isolation. |
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

Updated matching bilingual mirrors for `manifest.json`, `Main.controller.js`, `Main.view.xml`, `formatter.js`, `i18n.properties`, `i18n_en.properties`, `i18n_vi.properties`, the new `DeveloperWorkloadDetails.fragment.xml`, and `srv/bug-service/monitoring.js`. Each mirror explains the IDTS flow, source anchors, authorization boundary, impact, linked contracts and safe-editing rules.

## Tóm tắt tiếng Việt

Gate 6.3 bổ sung model OData V4 có tên `bugApi` để đọc `DeveloperWorkloads` và detail Bug bounded, không tạo aggregation hoặc persistence mới. Workload dùng order phía server, page tối đa 100, giữ thứ tự khi append và loại duplicate theo `developerProfileID`. Detail chỉ đọc Bug chưa Closed được giao cho Developer, chỉ lấy allowlist field, tính overdue theo ngày UTC và tách rõ Technical Assignee với Current Action Owner. UUID hợp lệ mở đúng Bug Object Page cùng origin; ID sai không navigate.

Các contract TDD, suite User Administration/Active Users/User Access, workload backend `49/0`, secret scan, agent rules, QA-depth, CAP EDMX/HANA compile, UI5 MCP lint/manifest validation, UI lint/build và diff guard đều đã có evidence mới. Server đã scope PM all/Developer own-row trước filter/page/count và fail-closed role/identity; ordinary `BugService.Bugs` read policy không đổi. Đây chỉ là source gate; chưa có runtime/manual acceptance, deploy, mutation dữ liệu/provider/user/role/email, merge, Ready hoặc Gate 6.4.

## Approval boundary

This evidence supports source review and exactly one Draft PR only. It does not claim runtime/manual acceptance, deployment, merge, Ready, release, or Gate 6.4. Any unresolved Critical/Major/Important finding is a NO-GO and must stop PR handoff.
