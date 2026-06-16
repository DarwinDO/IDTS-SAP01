# Sprint 02 Walkthrough & Demo Script

This document details the final implementation, backend validations, and manual UI verification flow for **Sprint 02** features in the Issue and Defect Tracking System (IDTS).

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
* Running `node scripts/qa/test-idts6-programmatic.js` results in **21/21 PASS**.

```text
==============================================
 TOTAL: 21 PASS  |  0 FAIL  |  21 tests
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

#### Step 2: Switch Personas via Mock Login
1. Because mock authentication is active, CAP provides a Mock Login popup/banner if you access the direct service page or click a restricted action, or you can supply basic authorization in headers.
2. Log in as **DonHV** (PM / Coordinator):
   - In the List Report toolbar, verify that the **Delete** button is completely missing.
   - Open **BUG-0003** (currently `IN_PROGRESS` status).
   - Because `DonHV` is a PM, they **only see PM actions** (such as *Close Bug* or *Reopen Bug* once resolved) and they do NOT see developer technical buttons (`Resolve Bug`, `Start Progress`) on the Object Page header, keeping their UI completely clean.
3. Switch login to **DatDT** (Developer / Assignee for BUG-0003):
   - Reload the Object Page for **BUG-0003**.
   - Because `DatDT` is the assigned developer, they **see technical actions** (`Request More Information`, `Reject Bug`, and `Resolve Bug`) on the header.
   - Click **Resolve Bug**. A popup parameter prompt will request a reason/note (mandatory rule). Fill in the note to successfully transition the bug to `RESOLVED`.
   - Once resolved, the developer buttons dynamically disappear.
