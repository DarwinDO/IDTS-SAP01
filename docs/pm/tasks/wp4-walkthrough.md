# Sprint 02 Walkthrough & Demo Script

This document details the final implementation, backend validations, and manual UI verification flow for **Sprint 02** features in the Issue and Defect Tracking System (IDTS).

Presentation script for the mentor demo: [wp4-mentor-demo-script.md](wp4-mentor-demo-script.md)
The companion script now covers the main happy flow plus the `Need More Information -> Resubmit` and `Rejected -> Pending Assignment -> Reassign` follow-up branches.

## Changes Accomplished

### 1. Mock Authentication Configuration
* Local CAP mocked users are declared in `package.json` with their corresponding roles:
  - `DonHV` (PM)
  - `NhanT` (Tester)
  - `DatDT` (Developer)
  - `SangVN` (Developer)
* This enables switching mock sessions via the standard CAP Mock Login screen during local runs.
* File modified: [package.json](file:///e:/IDTS-SAP01/package.json#L28-L64)

### 2. Physical Deletion Disabled
* Standard Fiori elements `Delete` button is blocked on the List Report table toolbar and Object Page header toolbar via `@Capabilities.DeleteRestrictions.Deletable: false`.
* File modified: [annotations.cds](file:///e:/IDTS-SAP01/app/bug-management-ui/annotations.cds#L3)

### 3. Performance-Optimized Capability Calculation (N+1 Fix)
* The handler `enrichBugCapabilities` resolves the request user's developer profile ID once at the beginning of the transaction.
* Direct memory check `row.assignee_ID === actorDeveloperProfileID` is performed in the loop instead of redundant individual database queries, improving performance from O(N) queries to O(1) query.
* File modified: [service.js](file:///e:/IDTS-SAP01/srv/service.js#L916-L971)

### 4. Role-Based Actions Visibility Separation
* **Developer Actions** (`Mark In Review`, `Start Progress`, `Resolve Bug`, `Request More Information`, `Reject Bug`) are visible ONLY to the **Assigned Developer** of the bug.
* **Coordination Actions** (`Assign Developer`, `Move to Pending Assignment`, `Send to Retest`, `Close Bug`, `Reopen Bug`) are visible ONLY to the **PM and Tester** roles.
* This dramatically reduces action bar clutter and separates workflow responsibilities cleanly.

---

## Verification & Test Results

### 1. Automated Programmatic Test Suite
* The happy-flow verification checklist runs simulated requests using the test suite.
* Running `node scripts/qa/test-idts6-programmatic.js` now results in **30/30 PASS**.
* Running `powershell -ExecutionPolicy Bypass -File scripts/qa/test-comments-attachments.ps1 -BaseUrl http://localhost:4014/odata/v4/bug` also passes the comment/attachment HTTP path end to end.

```text
==============================================
 TOTAL: 30 PASS  |  0 FAIL  |  30 tests
==============================================
```

### 2. Manual UI Walkthrough Script

Follow these steps to demonstrate the dynamic visibility and mock login capabilities:

#### Step 1: Start the Local Application
1. Launch the server in-memory:
   ```bash
   npx cds serve --in-memory
   ```
2. Open the Fiori Elements application in your browser:
   `http://localhost:4004/idts.bugmanagementui/index.html?sap-ui-xx-viewCache=false`

#### Step 2: Happy Flow Create + Review Demo
1. Log in as **NhanT** (Tester).
2. From the Bugs List Report, click **Create**.
3. Fill the required fields with a **valid** classification pair:
   - Application Component: **IDTS Bug Report**
   - Defect Category: **SAP Fiori UI5**
4. Upload a real file in **Evidence / Attachments** during create.
5. Click **Create**.
6. Verify the bug is created successfully and receives a new bug number.
7. Add a comment through **Add Comment**.
8. Use **Assign Developer** and choose **DatDT** from the filtered value help.
9. Switch persona to **DatDT** and open the same bug.
10. Verify developer actions are available, then execute **Mark In Review**.

### 2A. Happy Flow Demo Checklist

Use this as the live script during mentor review.

| Step | Persona | Action | Test data / focus | Expected result | Current risk to watch |
| --- | --- | --- | --- | --- | --- |
| HF-01 | NhanT | Open List Report and press `Go` | Seed/demo data visible | Bug list loads without blank screen or auth error | Low |
| HF-02 | NhanT | Click `Create` | Create page must open | Create flow opens with Bug Summary, Classification and Assignment, Reproduction and Test Context, and Evidence / Attachments | Low |
| HF-03 | NhanT | Fill required fields | Use valid pair: `IDTS Bug Report` + `SAP Fiori UI5` | No validation error while entering required data | Low |
| HF-04 | NhanT | Upload one real file before save | Example: `.tmp/demo-attachment.txt` | Uploaded file row appears on draft page before save | Low |
| HF-05 | NhanT | Save bug | Same valid data | Bug is created, bug number is generated, Object Page opens | Low |
| HF-06 | NhanT | Check attachment section after create | Same created bug | Attachment should still be visible on active Object Page | Low |
| HF-07 | NhanT | Add comment | Example comment about evidence uploaded | Comment row appears with author name and role | Low |
| HF-08 | NhanT | Assign Developer | Choose `DatDT` from value help | Bug becomes `Assigned`, assignee becomes `DatDT` | Low |
| HF-09 | DatDT | Open same bug | Assigned bug | Developer actions are visible only for valid developer flow | Low |
| HF-10 | DatDT | Run `Mark In Review` or `Start Progress` | Optional developer note empty for `Mark In Review`; required note for `Start Progress` | Backend status changes successfully and the Object Page refreshes to the new state immediately | Low |
| HF-11 | DonHV | Open bug as PM | Review only | PM can review bug, comments, attachments, history, notifications without developer-only action clutter | Low |

### 2B. Demo Safety Rules

- Always use the valid classification pair `IDTS Bug Report` + `SAP Fiori UI5` for live create.
- Keep one seeded fallback bug ready only as a contingency for operator error; the refreshed happy flow now passes on the local demo stack.
- The Assign Developer dialog should continue to be watched as a regression check, but the current verified runtime already shows the selected developer name correctly.

#### Step 3: Switch Personas via Mock Login
1. Because mock authentication is active, CAP provides a Mock Login popup/banner if you access the direct service page or click a restricted action, or you can supply basic authorization in headers.
2. Log in as **DonHV** (PM / Coordinator):
   - In the List Report toolbar, verify that the **Delete** button is completely missing.
   - Open an assigned bug such as **BUG-0003** or the newly created demo bug.
   - Because `DonHV` is a PM, they **only see PM actions** (such as *Close Bug* or *Reopen Bug* once resolved) and they do NOT see developer technical buttons (`Resolve Bug`, `Start Progress`) on the Object Page header, keeping their UI completely clean.
3. Switch login to **DatDT** (Developer / Assignee for BUG-0003):
   - Reload the Object Page for **BUG-0003**.
    - Because `DatDT` is the assigned developer, they **see technical actions** (`Request More Information`, `Reject Bug`, and `Resolve Bug`) on the header.
    - Click **Resolve Bug**. A popup parameter prompt will request a reason/note (mandatory rule). Fill in the note to successfully transition the bug to `RESOLVED`.
    - Once resolved, the developer buttons dynamically disappear.

### 3. Current Known Risks Before Mentor Demo

- No product-blocking FE issue is currently open on the verified happy flow path HF-01 to HF-11.
- Keep the Assign Developer selected-text path as a regression check only. On the current verified runtime, the dialog shows the selected developer name (`DatDT`) instead of the UUID.

### 3A. Fix Priority Recommendation

| Priority | Gap | Why it comes first | Recommended owner |
| --- | --- | --- | --- |
| P3 | Assign dialog regression check | Keep one quick browser check for the Assign Developer dialog in the mentor-demo prep run to confirm the selected value still renders the developer name on the active stack. No targeted FE customization is currently required. | DatDT / SangVN |

### 4. Current Safe Demo Recommendation

- Use the valid classification pair above.
- A prepared fallback seed bug is optional rather than required; the rerun on `localhost:4004` already passed the create + attachment + comment + assignment + developer-review path.
- No FE polish item currently needs proactive mention in the demo script. Only mention the Assign Developer dialog if a regression reappears during the final rerun.

## Vietnamese Walkthrough

### 1. Chạy ứng dụng local
1. Khởi động server:
   ```bash
   npx cds serve --in-memory
   ```
2. Mở ứng dụng:
   `http://localhost:4004/idts.bugmanagementui/index.html?sap-ui-xx-viewCache=false`

### 2. Đổi người dùng bằng Mock Login
1. Vì mock authentication đang bật ở môi trường local, CAP sẽ cho phép đăng nhập mock user bằng màn hình Mock Login hoặc basic auth.
2. Đăng nhập bằng **DonHV** (PM / Coordinator):
   - Kiểm tra nút **Delete** không còn xuất hiện ở List Report.
   - Mở **BUG-0003** đang ở trạng thái `IN_PROGRESS`.
   - DonHV chỉ thấy nhóm action quản lý như *Close Bug* hoặc *Reopen Bug* khi bug phù hợp, không thấy action kỹ thuật của developer.
3. Chuyển sang **DatDT** (Developer / assignee của BUG-0003):
   - Reload Object Page của **BUG-0003**.
   - DatDT sẽ thấy các action kỹ thuật như `Request More Information`, `Reject Bug`, và `Resolve Bug`.
   - Bấm **Resolve Bug**, nhập note/lý do bắt buộc, rồi xác nhận bug chuyển sang `RESOLVED`.
   - Sau khi resolve xong, các action của developer sẽ tự ẩn đi.
