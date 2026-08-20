# DonHV Composite Knowledge Gate — User Administration and SAP Access Provisioning

## English

### Record purpose

This is a coverage synthesis of previously completed DonHV Knowledge Gates and the controlled User Administration exercise. It is not a new assessment, does not invent answers, and does not sign or acknowledge on DonHV's behalf.

- Member: DonHV
- Evidence synthesis date: 2026-08-20 (Asia/Bangkok)
- Ownership flow: User Administration and SAP access provisioning
- Result: PASS by composite coverage
- Conservative score: 90% (the lowest score among the reused passing gates; not a newly calculated score)
- Critical questions: PASS
- Debug exercise: PASS
- Teach-back: PASS

### Reused passing gates

| Source gate | Recorded result | Coverage reused for this flow |
| --- | --- | --- |
| `docs/pm/evidence/idts-89/knowledge-gate-donhv-2026-07-23.md` | 90%, Critical/Debug/Teach-back PASS | OData-to-CAP dispatch, server-side authorization, validation before persistence, transactions and audit integrity |
| `docs/pm/evidence/idts-90/knowledge-gate-donhv-2026-07-23.md` | 90%, Critical/Debug/Teach-back PASS | Assignment ownership, Developer capability data, direct-call authorization, predicted state and rollback |
| `docs/pm/evidence/idts-82/knowledge-gate-donhv-email-2026-08-12.md` | 100%, Critical/Debug/Teach-back PASS | Invitation email/outbox, scheduler/worker boundary, retries, locking, sanitized provider failures and no-secret evidence |

### Controlled User Administration exercise

DonHV personally executed the human-controlled steps recorded in `docs/pm/evidence/user-administration/ua-track-a2-provider-recovery-broker-artifact.md` and the matching DonHV status entries:

1. Sent and received the controlled invitation without exposing password, OTP, passkey or provider credentials.
2. Completed SAP ID authentication and identity verification.
3. Observed invitation expiry, provider-unavailable, ambiguous/manual-review, request-invalid and forbidden states without bypassing the operation journal.
4. Triggered only the explicitly bounded Retry/Reconcile actions and did not perform a direct manual Role Collection assignment.
5. Reproduced the HTML5 503 with both PM and TESTER, then repeated the browser acceptance after the shared-content repair.
6. Confirmed the controlled request reached `ACTIVE`; sanitized readback proved exactly `IDTS_TESTER` and no PM, Developer or UserAdmin privilege.
7. Confirmed a fresh private session goes directly through SAP ID and that the TESTER can open the Bug Management UI.

This is the flow-specific controlled debug evidence. The previously recorded teach-backs establish the shared authorization, assignment, transaction, audit, retry and security principles used by User Administration. The practical exercise demonstrates their application to the complete invitation-to-access path.

### Composite flow trace

The combined verified understanding covers this path:

```text
PM + UserAdmin creates an invitation
  -> email outbox sends a one-time link
  -> the invited person authenticates with SAP ID
  -> CAP validates and links immutable platform identity
  -> the access operation is queued transactionally
  -> the dedicated broker reconciles the allowlisted Role Collection
  -> provider readback proves the desired role
  -> CAP activates the internal user/request
  -> audit and safe operational state remain reloadable
```

UI visibility never replaces CAP authorization. `ACTIVE` is not reached before provider readback. Ambiguous provider outcomes are read back before another bounded action. Credentials, raw tokens, provider bodies, full personal identity and private endpoints are excluded from evidence.

### Count mapping for PR automation

- Base questions: 9 total across the three recorded gates.
- Inactive-day questions: 4, already assessed in the email/outbox gate.
- Additional-flow questions: 2, already assessed in the assignment/Developer-capability gate.
- Score: 90%, using the conservative minimum recorded passing score.

## Vietnamese

### Mục đích bản ghi

Đây là bản tổng hợp coverage từ các Knowledge Gate DonHV đã PASS và bài thực hành User Administration có kiểm soát. Đây không phải bài thi mới, không tạo câu trả lời mới và không ký/xác nhận thay DonHV.

- Thành viên: DonHV
- Ngày tổng hợp evidence: 2026-08-20 (Asia/Bangkok)
- Flow ownership: User Administration và SAP access provisioning
- Kết quả: PASS theo composite coverage
- Điểm bảo thủ: 90% (lấy mức thấp nhất trong các gate đã PASS, không tính ra một điểm mới)
- Câu critical: PASS
- Bài debug: PASS
- Teach-back: PASS

Ba gate được tái sử dụng đã chứng minh: CAP/OData và transaction/audit; assignment/Developer capability và backend authorization; invitation email/outbox, retry, lock và no-secret handling. Bài thực hành live ngày 19–20/08 bổ sung đúng phần User Administration: invitation, SAP ID, identity verification, provider failure, bounded Retry/Reconcile, trạng thái `ACTIVE`, Role Collection chính xác và TESTER login.

Luồng tổng hợp được coverage:

```text
PM + UserAdmin gửi invitation
  -> email outbox gửi link một lần
  -> user đăng nhập SAP ID
  -> CAP validate và link immutable identity
  -> operation được queue trong transaction
  -> broker reconcile Role Collection theo allowlist
  -> provider readback chứng minh role đúng
  -> CAP mới activate user/request
  -> audit và trạng thái vận hành đọc lại được sau reload
```

UI không thay thế backend authorization. Không set `ACTIVE` trước provider readback. Kết quả provider mơ hồ phải readback trước action tiếp theo. Evidence không chứa credential, raw token, provider body, PII đầy đủ hoặc endpoint private.

