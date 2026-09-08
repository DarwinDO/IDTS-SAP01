# IDTS-110 final execution candidate report

> Candidate-only handoff. Result review is **PENDING_DONHV_REVIEW**. DonHV must review the case results and workbook before any official disposition. This report does not claim final PASS, merge, deployment, Drive replacement, Jira completion, or release.

## Authority and status

| Field | Frozen value |
| --- | --- |
| Jira | IDTS-110 |
| Approved source base / PR | `6eb6f73840d7150598a993f8656d2b44e5b0cd4b` / PR #388 merge |
| Independent review head | `a82de8e3f8521d5e9d1de4f2f2fc2071669126f0` |
| Result review status | `PENDING_DONHV_REVIEW` |
| External mutations | `[]` |

The source base is the PR #388 merge. The independent review receipt found 0 Critical, 0 Major, and 0 Important findings. No Minor findings are recorded. The clean review does not approve any result, workbook, merge, deployment, Drive replacement, Jira update, or release.

## Frozen inputs and hashes

| Input | Count / binding | SHA-256 |
| --- | ---: | --- |
| Unit-test catalog (canonical JSON) | 278 cases | `16603BEC649C4E6A09E907B2C7A1FC2B21C393BEFE7BD5C99B76AEA75BB60E30` |
| Unit-test catalog (file bytes) | 278 cases | `BCE7A6FBF7D1E71CDDBEA342A13B1C195015B1EF8790D1F3EE554E0A686717D5` |
| Case number map (canonical JSON) | 278 entries; bijective 1..278 | `90E90685483EC33ED7651C4343060374933C5E21F79CB9816093D1B0A58941B1` |
| Case number map (file bytes) | 278 entries | `51B83E3520143A01A9C1AAD51C5EA3F030AD4BCA3AEBB8B66FB95C0D14017A1D` |
| New atomic result aggregate (file bytes) | 90 rows; 90 candidate PASS | `659AD9613A63BB7A5C9FAC2A56D3BCAF7F42133F8095215851D892ECA130730D` |
| New atomic result aggregate (canonical JSON) | 90 rows | `5C538C38074DB7F3160B6BD081232DE2DCB67F325D851EE3A2078172646B6B5D` |
| Candidate workbook v0.6 | 278 visible cases; 25649942 bytes | `457BC346BD3C17D687E2AC77A33087C34B3A24F435916E8280F1903FFA266DCC` |
| Official template | frozen authority reference | `5764937D3CF12EF7FBA107BB1104A018CB509D2DB7E4D2F6793A7FF245A0A334` |
| Mentor card set | 278 PNG cards | `EB2BBB33168B6D513552370809A8CFEF3EF0F3FE7EFDC7A533EACE40CFB7564A` |
| Atomic mapping receipt | 135 PASS rows; pending DonHV review | `CE1E1CE736473C0480FFB75B5D092D063EABD99D5713C763A308FF1DB13A7E79` |

The catalog has 188 historical rows and 90 new rows. The number map preserves catalog order and the complete 1..278 bijection.

## Execution totals

| Slice | Cases | Candidate assertion | Review state |
| --- | ---: | --- | --- |
| Historical evidence | 188 | 40 PASS / 135 prior mapping-only / 13 blocked | PENDING_DONHV_REVIEW |
| Atomic mapping receipt | 135 | 135 PASS; supersedes the prior mapping-only slice | PENDING_DONHV_REVIEW |
| New aggregate | 90 | 90 PASS / 0 FAIL / 0 BLOCKED | PENDING_DONHV_REVIEW |
| User Administration | 45 | included in new aggregate | PENDING_DONHV_REVIEW |
| Notifications and email | 45 | included in new aggregate | PENDING_DONHV_REVIEW |

The User Administration adapter accounting is exactly **11 EXISTING_EXACT / 33 ADD_TO_EXISTING / 1 NEW_ROLE_RUNNER**. The Notification slice is exactly **45 rows**, including **8 rendered browser/runtime visual cases**. The complete new package has 9 visual cases because User Administration contributes the ninth visual case.

## Workbook and evidence package

- Candidate workbook v0.6 status totals are **265 Candidate PASS / 13 Blocked / 278 total**; **Mapping Only is 0**. The 265 candidate rows are 40 historical PASS, 90 new assertions, and 135 receipt-bound atomic mapping assertions; they are not official PASS.
- The workbook has 278 native UT-to-Evidence links and 0 external Evidence hyperlinks. The 278 number-only cards span `Case-001.png` through `Case-278.png` and are embedded as native anchors.
- The packaged unit evidence has 90 case manifests, 90 result records, and 313 PNG artifacts: 9 runtime screenshots, 81 structured result images, 71 before-state images, 71 after-state images, and 81 reload/readback images.
- Card-set SHA-256 is `EB2BBB33168B6D513552370809A8CFEF3EF0F3FE7EFDC7A533EACE40CFB7564A`; first and last card hashes are `B7F0390D1FF0B7075D3ACD2AE72C6A39667CB224809E0D3625926EE33C304A00` and `AA2D5312BAB864CB8860B62B8BC703DCBED2793E71E306198654E5B1EA58CB06`.

### v0.6 PDF binding

- Receipt-bound PDF SHA-256 is `6F2B777673187D20CFA7A7D2540D44D1DB20AE460E370D851C5C866BC1871EF6`, 22358411 bytes, 391 pages: 113 other-sheet pages and 278 Evidence pages.

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
| Minor | 0 | none found |



## Gates and limitations

The receipt gate fails closed for a substituted workbook, a stale workbook/review/mapping/ledger receipt, a missing card, a remaining Mapping Only result, or totals other than 265 Candidate PASS / 0 Mapping Only / 13 Blocked / 278 total. It does not substitute for DonHV result approval or a full repository security/release gate.

The 13 historical BTP-required rows remain **Blocked** because an authorized target, fixture, rollback plan, and sanitized readback are not available. Any rerun requiring Cloud Foundry/BTP, provider/email, HANA, or deployment state is intentionally not performed and cannot be treated as a local failure.

No product source, dependency manifest, lockfile, schema/data/seed, BTP/HANA state, provider, real email, Drive file, Jira issue, branch push, merge, deployment, or release state was mutated.
