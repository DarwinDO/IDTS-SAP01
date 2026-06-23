# Sprint 02 – Mentor Demo Script

**Prepared by:** NhanT (QA) | **Date:** 2026-06-17
**Sprint Goal:** Demonstrate happy-flow for one bug lifecycle end-to-end
**Jira:** IDTS-12 | **Sprint:** IDTS Sprint 2

Vietnamese: Kịch bản demo mentor cho Sprint 02 – happy flow vòng đời bug.

---

## 1. Pre-Demo Setup

### 1.1 Start the application

```bash
# Terminal 1: Start CAP server with Fiori UI
npx cds watch
```

Wait until: `server listening on http://localhost:4004`

### 1.2 Open the application

- Open browser → `http://localhost:4004`
- Click **`/bug-management-ui/webapp`** (Web Application link)
- If prompted for login: username = `alice`, password = `alice`

### 1.3 Seed data available

The system starts with 4 pre-loaded bugs (BUG-0001 to BUG-0004) and reference data for developers, components, categories.

---

## 2. Demo Flow – Happy Path

### Scene 1: Bug List Overview (List Report)

**Show to mentor:**
- Press **"Go"** button to load the bug list
- Point out the columns: Bug Number, Title, Status, Priority, Severity, Assignee
- Mention: "Đây là trang quản lý danh sách bug. Tất cả member trong team đều có thể xem."

**Talking point:** *"Theo feedback mentor, developer có quyền xem và thảo luận bug trong team – không chỉ bug được assign cho mình."*

---

### Scene 2: Create a New Bug (Tester role)

**Steps:**
1. Click **"Create"** button on List Report
2. Fill in the form:
   - Title: `Demo Bug – Login page timeout after 30s`
   - Description: `User reports timeout when accessing the login page`
   - Steps to Reproduce: `1. Open login page 2. Wait 30 seconds 3. Page shows timeout error`
   - Actual Result: `Timeout error displayed`
   - Expected Result: `Login page loads within 3 seconds`
   - Priority: `HIGH`
   - Severity: `MAJOR`
   - Environment: `QAS`
   - Application Component: *(select from dropdown)*
   - Defect Category: *(select from dropdown)*
3. Click **"Create"** (or Save)

**Expected result:**
- Bug is created with auto-generated `bugNumber` (e.g., BUG-0005)
- Status automatically set to `PENDING_ASSIGNMENT` (no assignee) or `ASSIGNED` (if assignee provided)

**Talking point:** *"Hệ thống tự sinh bugNumber, gán status mặc định, và validate bắt buộc các field quan trọng."*

---

### Scene 3: Assign to Developer (PM role)

**Steps:**
1. Open the newly created bug (or BUG-0001 which is in `NEW` status)
2. Click **"Assign to Developer"** action button
3. Select a developer from the list (e.g., DatDT)
4. Optionally add a note

**Expected result:**
- Status changes to `ASSIGNED`
- Assignee field shows the selected developer
- History log records the assignment

**Talking point:** *"PM hoặc Tester có thể assign bug cho developer. Hệ thống kiểm tra developer có trách nhiệm (Developer Responsibility) với Component Category tương ứng không."*

---

### Scene 4: Developer Review → Start Progress

**Steps:**
1. Developer reviews the bug details
2. Click **"Mark In Review"** → Status becomes `IN_REVIEW`
3. Click **"Start Progress"** → Status becomes `IN_PROGRESS`

**Talking point:** *"Developer xem bug, đánh dấu đang review, rồi bắt đầu xử lý. Note là optional ở các bước này (theo feedback mentor)."*

---

### Scene 5: Request More Information (Developer asks Tester)

**Steps:**
1. On the `IN_PROGRESS` bug, click **"Request More Information"**
2. System requires a **reason** → Enter: `"Cần log chi tiết của lỗi timeout"`
3. If reason is empty → System shows error 400 (demo validation)

**Expected result:**
- Status changes to `NEED_MORE_INFORMATION`
- nextProcessor switches to Tester (reporter)

**Talking point:** *"Đây là một trong các transition bắt buộc reason theo feedback mentor. Nếu developer không nhập lý do, hệ thống sẽ từ chối."*

---

### Scene 6: Reject Bug (Developer finds wrong classification)

**Steps:**
1. On a bug in `ASSIGNED`/`IN_REVIEW`/`IN_PROGRESS`, click **"Reject Bug"**
2. Enter reason: `"Bug này thuộc module khác, cần phân loại lại"`
3. Demo: Try with empty reason → Error 400

**Expected result:**
- Status changes to `REJECTED`
- Rejection reason is stored
- nextProcessor switches to Tester

**Talking point:** *"Reject cũng bắt buộc reason. Bug bị reject không phải là kết thúc – Tester có thể phân loại lại và gửi đến Pending Assignment."*

---

### Scene 7: Resolve Bug (IDTS-3 Fix Demo)

> ⚠️ **This is the key demo for IDTS-3 fix verification**

**Steps:**
1. Navigate to a bug in `IN_PROGRESS` status
2. Click **"Resolve Bug"**
3. **First attempt:** Leave note empty → **System rejects with HTTP 400** ← This is the IDTS-3 fix!
4. **Second attempt:** Enter note: `"Root cause identified: database connection pool exhausted. Fixed connection recycling."` → **Success, HTTP 200**

**Expected result:**
- Status changes to `RESOLVED`
- Resolution note is recorded in history

**Talking point:** *"Trước IDTS-3, developer có thể resolve bug mà không cần ghi lý do. Sau fix, hệ thống bắt buộc nhập note khi resolve – đúng yêu cầu mentor."*

---

### Scene 8: Send to Retest → Close Bug

**Steps:**
1. On `RESOLVED` bug, click **"Send to Retest"** → Status: `RETEST_REQUIRED`
2. Tester verifies the fix
3. Click **"Close Bug"** → Status: `CLOSED`

**Expected result:**
- Full lifecycle completed: NEW → ASSIGNED → IN_REVIEW → IN_PROGRESS → RESOLVED → RETEST_REQUIRED → CLOSED

**Talking point:** *"Luồng hoàn chỉnh từ tạo bug đến đóng bug. Mọi thay đổi trạng thái đều được ghi vào History Log."*

---

### Scene 9: Reopen Bug (edge case)

**Steps:**
1. On a `CLOSED` or `RETEST_REQUIRED` bug, click **"Reopen Bug"**
2. Enter reason: `"Lỗi vẫn tái hiện sau khi fix"`
3. Demo: Try with empty reason → Error 400

**Talking point:** *"Nếu QA phát hiện lỗi chưa fix xong, có thể mở lại bug. Bắt buộc nhập lý do."*

---

### Scene 10: History Logs Verification

**Steps:**
1. Open any bug that has gone through multiple status changes
2. Scroll down to the **History** section on Object Page
3. Show the history entries: who did what, when, old value → new value

**Alternative (API):**
```
GET http://localhost:4004/odata/v4/bug/HistoryLogs?$filter=bug_ID eq '<bugID>'&$orderby=createdAt desc
```

**Talking point:** *"Mọi thay đổi trạng thái, assignment, rejection đều được ghi lại có timestamp, actor, old/new value. Đây là audit trail của hệ thống."*

---

## 3. Backend Verification Evidence

### 3.1 Automated Test

```bash
# Run the programmatic test (20 scenarios)
node scripts/qa/test-idts6-programmatic.js
```

**Expected output:** `20 PASS / 1 SKIP / 0 FAIL`

### 3.2 CDS Compile Check

```bash
npx cds compile srv app/bug-management-ui --to edmx
```

**Expected:** EDMX output with no errors.

### 3.3 Manual API Test (VS Code REST Client)

Open `scripts/qa/manual-test.http` in VS Code with REST Client extension installed. Click "Send Request" on each block.

---

## 4. Known Issues (Honest List)

| # | Issue | Severity | Impact on Demo | Workaround |
| --- | --- | --- | --- | --- |
| 1 | Real attachment upload not implemented | Low | Cannot demo file upload | Attachments entity exists but upload handler is deferred |
| 2 | External notification not delivered | Low | Notifications are recorded but not sent via email/push | Notification records visible in DB; delivery is future work |
| 3 | Authorization/XSUAA not enforced | Medium | All users can perform all actions in dev mode | CAP mocked auth used for demo; real XSUAA is deployment concern |
| 4 | SC-01a CREATE test skipped in automation | Low | In-process test limitation, not a business bug | CREATE validation proven by SC-01b (missing title = 400) |
| 5 | `cds-plugin-ui5` blocks `cds.test()` HTTP | Low | Cannot use standard cds.test() for HTTP-based testing | Solved by using direct `cds.srv.dispatch` in-process |
| 6 | Deeper browser QA not yet complete | Medium | Some UI edge cases may not be covered | Manual Fiori preview testing covers happy flow |

---

## 5. Sprint 02 Deliverables Summary

| Deliverable | Status | Owner | Evidence |
| --- | --- | --- | --- |
| Backend note/reason validation (IDTS-3) | ✅ Done | NhanT | `srv/service.js` line 137; 10/10 logic test PASS |
| Happy-flow QA checklist (IDTS-6) | ✅ Done | NhanT | `docs/qa/idts6-happy-flow-checklist.md`; 20/21 PASS |
| Automation test script | ✅ Done | NhanT | `scripts/qa/test-idts6-programmatic.js` |
| Manual test file | ✅ Done | NhanT | `scripts/qa/manual-test.http` |
| Demo script (IDTS-12) | ✅ Done | NhanT | This document |
| Bug Detail layout redesign (IDTS-7/8) | ⏳ DatDT | DatDT | See `docs/pm/status/datdt.md` |
| Status value help (IDTS-9) | ⏳ SangVN | SangVN | See `docs/pm/status/sangvn.md` |
| Backend bug fixes (IDTS-4) | ⏳ DonHV | DonHV | See `docs/pm/status/donhv.md` |

---

## 6. Demo Checklist (Before Mentor Meeting)

- [ ] `npx cds watch` starts without errors
- [ ] Browser opens `localhost:4004` and shows welcome page
- [ ] Fiori app shows bug list after pressing "Go"
- [ ] Create Bug flow works end-to-end
- [ ] Assign → Review → Progress → Resolve → Retest → Close works
- [ ] Resolve without note shows error (IDTS-3 fix)
- [ ] Reject without reason shows error
- [ ] History logs are visible
- [ ] `node scripts/qa/test-idts6-programmatic.js` returns 20 PASS
- [ ] Known issues list is ready to present honestly

---

*This demo script is owned by NhanT. DonHV, DatDT, and SangVN should update their own status files with their respective evidence before the mentor meeting.*
