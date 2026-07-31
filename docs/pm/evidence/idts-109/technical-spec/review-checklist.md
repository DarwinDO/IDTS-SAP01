# IDTS-109 Candidate Review Checklist

Status: `LATEST-DEV TECHNICAL REVIEW COMPLETE — DATDT JIRA DELTA CONFIRMATION PENDING`

Approval evidence: Jira IDTS-109 comment `10763`, posted by DatDT on 2026-07-31.
The approval permits commit, merge and DonHV final-workbook integration; it does
not authorize overwriting the official Drive artifact from this candidate branch.

Source delta: after approval, `origin/dev` first added IDTS-114/115 provider and UI
evidence, then advanced to `a77b379` with Smart Assign application update-group
scoping. The candidate now covers the three AI UI traces and the Smart Assign
pending/loading/failure behavior. These deltas are not covered by Jira approval
comment `10763`.

## DatDT review

- [x] Functional Requirements are business-level and contain no source code or HTTP details.
- [x] Development Standards accurately map SAP concepts to CAP/Fiori equivalents used in IDTS.
- [x] Message catalog text exists in source or is explicitly marked as a safe grouped/internal summary.
- [x] Dynamic validation branches in `bug-write.js`, `drafts.js` and `permissions.js` are represented by the catalog families and retained in the final human-review note.
- [x] Login, profile, logout, dashboard, monitoring, notification and email traces are accurate.
- [x] All ten AI actions/functions have separate 14-part traces.
- [x] Direct OpenAI live remains `BLOCKED / NOT ACCEPTED`; the later Vercel Gateway
  path is documented separately as staged with `PARTIAL PASS`, not complete
  provider-primary acceptance.
- [x] No secret, token, password, private endpoint, raw prompt/response or full private email was included.
- [x] DatDT recorded candidate approval on Jira IDTS-109 comment `10763`.

## Known gaps / missing evidence

| Gap ID | Gap | Current status | Required owner/action |
| --- | --- | --- | --- |
| GAP-01 | OfficeCLI is unavailable in the current environment. | Open environment blocker | Install/configure OfficeCLI and rerun required workbook validation before final PASS. |
| GAP-02 | The original approval predates the latest `dev` UI/provider and Smart Assign update-group deltas. | Technical review complete; member confirmation pending | DatDT comments the final SHA/checks and confirms the reconciled candidate; DonHV reviews final integration. |
| GAP-03 | IDTS-115 interactive Tester/Developer role evidence is incomplete. | Open acceptance gap | Do not generalize PM browser PASS to every role; retain programmatic authorization evidence separately. |
| GAP-04 | Vercel/Qwen structured provider-primary acceptance is incomplete for Classification, Handoff Summary and Smart Assign. | `PARTIAL PASS` in IDTS-115 | Keep safe-fallback evidence separate from provider-primary success and link IDTS-114/115 follow-up. |
| GAP-05 | Source scan counts call sites; dynamic messages still require human semantic review. | Candidate groups known families | DatDT checks every dynamic branch before approval. |
| GAP-06 | Official v0.7 workbook uses fewer columns than the mentor-required message and 14-part trace structures. | Integration design required | DonHV preserves template while expanding rows/available columns or using clearly linked continuation blocks. |
| GAP-07 | Direct OpenAI live execution is not accepted by this candidate; a separate Vercel Gateway path now exists. | Direct OpenAI remains blocked/not accepted; Vercel evidence is partial | Do not claim full provider acceptance from mock/fallback or selected Vercel successes. |

## Post-dev-sync technical review

- [x] Apply Classification UI trace matches the merged source/evidence.
- [x] Confirm Duplicate UI trace matches the merged source/evidence.
- [x] PM AI Activity trace matches the merged source/evidence.
- [x] Vercel Gateway remains `PARTIAL PASS`; role/provider gaps are not generalized.
- [x] Smart Assign waits only on the application update group, refreshes derived classification and maps wait/refresh/read failures to the safe load error.
- [x] Message Definition includes the Smart Assign safe load error and internal timeout family.
- [ ] DatDT posts the final post-`dev` delta confirmation on Jira IDTS-109.

## Fresh local verification after merge

- [x] Source/trace structure: 17/17 traces contain all 14 required fields; 84 message rows.
- [x] Source manifest: 96 CAP message sites, 19 explicit throws, 62 UI feedback sites and 485 i18n entries.
- [x] `npm.cmd run qa:idts56:programmatic`: 14 PASS / 0 FAIL.
- [x] `npm.cmd run qa:idts69:programmatic`: 13 PASS / 0 FAIL.
- [x] `npm.cmd run qa:idts115:programmatic`: 241 checks passed.
- [x] `npm.cmd run qa:secret-scan`: PASS.
- [x] `npx.cmd ai-devkit@latest lint --json`: 5 ok / 0 miss / 0 warn.
- [x] `git diff --check`: PASS.
- [ ] GitHub `qa-depth-gate` passes on the final pushed head.

## Final integration gate

- [x] DatDT candidate approval is recorded in Jira and linked here.
- [ ] Candidate is merged to `dev`.
- [ ] DonHV integrates it into a new English Technical Specification revision.
- [ ] The official template/tab structure remains intact.
- [ ] OfficeCLI validation passes.
- [ ] Workbook formula/reference and source-trace validation passes.
- [ ] Visual review covers all 12 tabs and readable expanded content.
- [ ] Secret scan passes.
- [ ] DonHV uploads the approved revision to the same official Drive artifact ID.
- [ ] Jira evidence records the final revision, Drive link and validation results.
