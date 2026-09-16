# Case 81 — UAT-ATT-007 — unauthorized attachment deletion

## Result

**PASS** — the protected attachment delete was denied with the exact inner `HTTP/1.1 403 Forbidden` response, while the attachment metadata and binary remained available in the authorized PM readback.

- Executor: **NhanT (DonHV support)**
- Developer actor: **dodepzai6 / Developer**
- PM readback identity: **DonHV / Project Manager**
- Target: **BUG-0024** (`0f4428e3-a6bc-46de-8c19-b41dcac37d5f`)
- Attachment: `idts-127-att007-bug0024-donhv-20260916.txt`, 62 bytes, `Unscanned`
- Binary SHA-256 before and after: `28B9E0CA658C97A037AA4B0B82414ACB8C0038CDEDAF6B71D773DC1456B91645`

## Test definition

**Precondition:** `BUG-0024` is `Assigned` to `dodepzai6@gmail.com`; the saved attachment was created by the DonHV Project Manager identity.

**Action:** In the Developer draft, choose Delete for the PM-created attachment and confirm exactly once.

**Expected result:** The protected delete returns HTTP 403, the draft is discarded, and an authorized PM can still read the attachment metadata and binary with no Delete History event.

## Observed assertions

- Exactly one UI Delete and one in-app confirmation were performed by the authenticated `dodepzai6` Developer.
- No retry or alternate request path was used; Discard Draft succeeded and the active edit view returned.
- The OData `$batch` envelope returned outer `HTTP/1.1 200 OK`; its actual attachment DELETE response was inner `HTTP/1.1 403 Forbidden`.
- The safe response message was: `Only the attachment uploader or a PM user can delete this attachment.`
- The final DonHV PM readback showed one attachment, the expected filename, `Unscanned`, 62 bytes, and the expected downloaded SHA-256.
- History contained exactly three entries (assignment, setup edit/add attachment, and create) and zero Delete events.

## Persistence readback

| Entity | Before | After discard | Final PM readback |
| --- | --- | --- | --- |
| Bug status | `Assigned` | `Assigned` | `Assigned` |
| Technical/current owner | `dodepzai6@gmail.com` | `dodepzai6@gmail.com` | `dodepzai6@gmail.com` |
| Attachment rows | 1 | 1 | 1 |
| Attachment metadata | PM-created; `Unscanned`; 62 bytes | unchanged | present and unchanged |
| Attachment binary | SHA-256 `28B9E0CA...91645` | unchanged | downloaded; SHA-256 `28B9E0CA...91645` |
| History entries | 3 | 3 | 3 |
| Delete History events | 0 | 0 | 0 |

The supplied PM readback is the authoritative post-discard state. The capture report does not retain a distinct reload action, so the final readback is not presented as a separately timestamped reload.

## Transport proof

| Layer | Observed response |
| --- | --- |
| OData `$batch` outer envelope | `HTTP/1.1 200 OK` |
| Attachment DELETE inner response | `HTTP/1.1 403 Forbidden` |
| Safe message | `Only the attachment uploader or a PM user can delete this attachment.` |
| Request count | 1 DELETE; 1 confirmation; no retry |
| HAR | Not retained; no HAR is claimed |

## Provenance

- Catalog: `docs/qa/idts-111-uat-catalog.json`, UAT-ATT-007 / display number 81.
- Capture source: `att007-capture-report.md` and the coordinator-confirmed Developer transport chronology.
- Structured evidence: `baseline-before.json`, `setup.json`, `delete-receipt.json`, `after-readback.json`, `final-reload-readback.json`, and `pm-readback.json`.
- The JSON files are sanitized; credentials, cookies, tokens, and other secrets are omitted.
- `card/result.png` is a generated summary card. It is not a substitute for the supplied runtime screenshot.

## Runtime screenshot

[runtime-final.png](runtime-final.png)

The supplied final Edge Profile 1 screenshot shows `BUG-0024` History with the three setup/assignment entries and no Delete entry. It is retained unchanged as the current runtime evidence.
