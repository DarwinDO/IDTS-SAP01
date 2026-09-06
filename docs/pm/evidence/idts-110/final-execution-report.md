# IDTS-110 final execution candidate report

> Candidate-only handoff. Result review is **PENDING_DONHV_REVIEW**. DonHV must review the case results and workbook before any official disposition. This report does not claim final PASS, merge, deployment, Drive replacement, Jira completion, or release.

## Authority and status

| Field | Frozen value |
| --- | --- |
| Jira | IDTS-110 |
| Approved source base / PR | `6eb6f73840d7150598a993f8656d2b44e5b0cd4b` / PR #388 merge |
| Independent review head | `9d573e1a61933bc503e80d38e7f9555cfa58eceb` |
| Result review status | `PENDING_DONHV_REVIEW` |
| External mutations | `[]` |

The source base is the PR #388 merge. The independent review receipt found 0 Critical, 0 Major, and 0 Important findings; 2 Minor findings remain explicitly deferred. The clean review does not approve any result, workbook, merge, deployment, Drive replacement, Jira update, or release.

## Frozen inputs and hashes

| Input | Count / binding | SHA-256 |
| --- | ---: | --- |
| Unit-test catalog (canonical JSON) | 278 cases | `7F9D68D2185E95B166BEFB928069D6DFBCAFFAE563667692A1C319755C88E253` |
| Unit-test catalog (file bytes) | 278 cases | `1C72CAD523371D795A61892EE1267260BE182DA6627945764940572928FD3D4F` |
| Case number map (canonical JSON) | 278 entries; bijective 1..278 | `90E90685483EC33ED7651C4343060374933C5E21F79CB9816093D1B0A58941B1` |
| Case number map (file bytes) | 278 entries | `51B83E3520143A01A9C1AAD51C5EA3F030AD4BCA3AEBB8B66FB95C0D14017A1D` |
| New atomic result aggregate (file bytes) | 90 rows; 90 candidate PASS | `659AD9613A63BB7A5C9FAC2A56D3BCAF7F42133F8095215851D892ECA130730D` |
| New atomic result aggregate (canonical JSON) | 90 rows | `5C538C38074DB7F3160B6BD081232DE2DCB67F325D851EE3A2078172646B6B5D` |
| Candidate workbook | 278 visible cases | `C0C49CE78A6AF43FD59CC634CB5DBE56919EF10937300217F5BDEF763D2D2A5D` |
| Official template | frozen authority reference | `5764937D3CF12EF7FBA107BB1104A018CB509D2DB7E4D2F6793A7FF245A0A334` |
| Mentor card set | 278 PNG cards | `0EEEC2066DDD97D493DFD63B702C56CBDB0BE932F14217901307725A32CA4598` |

The catalog has 188 historical rows and 90 new rows. The number map preserves catalog order and the complete 1..278 bijection.

## Execution totals

| Slice | Cases | Candidate assertion | Review state |
| --- | ---: | --- | --- |
| Historical evidence | 188 | 40 PASS / 135 mapping-only / 13 blocked | PENDING_DONHV_REVIEW |
| New aggregate | 90 | 90 PASS / 0 FAIL / 0 BLOCKED | PENDING_DONHV_REVIEW |
| User Administration | 45 | included in new aggregate | PENDING_DONHV_REVIEW |
| Notifications and email | 45 | included in new aggregate | PENDING_DONHV_REVIEW |

The User Administration adapter accounting is exactly **11 EXISTING_EXACT / 33 ADD_TO_EXISTING / 1 NEW_ROLE_RUNNER**. The Notification slice is exactly **45 rows**, including **8 rendered browser/runtime visual cases**. The complete new package has 9 visual cases because User Administration contributes the ninth visual case.

## Workbook and evidence package

- Candidate workbook status totals are **130 Candidate PASS / 135 Mapping Only / 13 Blocked / 278 total**. The 130 Candidate PASS rows are exactly 40 historical PASS rows plus 90 new candidate assertions; they are not official PASS.
- The workbook has 278 native UT-to-Evidence links and 278 native Evidence-to-card links. The 278 number-only cards span `Case-001.png` through `Case-278.png`.
- The packaged unit evidence has 90 case manifests, 90 result records, and 313 PNG artifacts: 9 runtime screenshots, 81 structured result images, 71 before-state images, 71 after-state images, and 81 reload/readback images.
- Card-set SHA-256 is `0EEEC2066DDD97D493DFD63B702C56CBDB0BE932F14217901307725A32CA4598`; first and last card hashes are `FEA67E2FAF912104CB5D1D27F859C89B830DD6FF2CF54349E18E52333735265C` and `24A4399FD7CC09AFD2FDF0D1F87E842389F9EAAC7B1AFF5C1486D7ECEF851154`.

### Frozen template warnings

The candidate preserves exactly **15 inherited authority-template warnings**, with no introduced warning: 13 broken defined-name `#REF!` advisories, one Histories overflow advisory at `Histories/C2`, and one at `Histories/F2`. These warnings remain disclosed and unchanged.

### Security and mentor-output boundary

Independent review and the package/card checks found no secret values, PII/email addresses, internal case keys, raw internal case-selector commands, private endpoints, credential assignments, `undefined`, or unresolved placeholders in mentor-visible outputs. Generic words such as “password” and “bearer token” remain only as test-description text, not values.

## Independent review

| Severity | Count | Disposition |
| --- | ---: | --- |
| Critical | 0 | none found |
| Major | 0 | none found |
| Important | 0 | none found |
| Minor | 2 | deferred, non-blocking |

Deferred minors are source-trace symbol hygiene for six approved literal assertion snippets and Task 5 report prose that does not print its final fix head even though Git binds it to `67838224`. Neither changes result or workbook truth.

## Gates and limitations

The final local gate sequence is recorded separately from result approval:

- Extension manifest, extended catalog, workbook contract, OfficeCLI validation, fidelity validation, secret scan, agent rules, and `git diff --check`: **PASS**.
- Atomic runner: **PASS** after reusing the existing old-harness `ajv` through `NODE_PATH`; no dependency was installed or changed.
- Evidence contract: the first read-only attempt was blocked because the required Playwright executable was unavailable. The contract script also rewrites the existing 90 evidence packages and 278 cards, so it was not rerun with a browser download or any other mutation. Existing Task 9 package/card evidence and the independent review remain the recorded evidence.
- `ai-devkit lint --json`: **PASS using the existing local command; no install**. The required `npx ai-devkit@latest lint --json` form was not invoked because it could install dependencies, which is outside this task.

OfficeCLI preflight was `officecli --version` → `1.0.147`; OfficeCLI does not author Markdown, so it was used only as the required preflight/inspection tool for this report task.

The 13 historical BTP-required rows remain **Blocked** because an authorized target, fixture, rollback plan, and sanitized readback are not available. Any rerun requiring Cloud Foundry/BTP, provider/email, HANA, or deployment state is intentionally not performed and cannot be treated as a local failure. The evidence-contract browser/dependency limitation is tooling/environmental, not a product result.

No product source, dependency manifest, lockfile, schema/data/seed, BTP/HANA state, provider, real email, Drive file, Jira issue, branch push, merge, deployment, or release state was mutated.
