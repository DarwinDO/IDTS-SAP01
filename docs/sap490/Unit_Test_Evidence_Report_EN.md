# IDTS-SAP01: Unit Test Evidence Report (Excel Format)

**Report Date:** 02/09/2026
**Tester:** NhanT candidate

---

### NO. 1

**Test Cases:**
valid local login normalizes the email and creates one session
Precondition: Use an isolated authentication fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call AuthService.login with a valid mixed-case, space-padded email and password.

**Predicted Test Results:**
The response returns one transient bearer token and a public active user; the persisted session contains only tokenHash.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AUTH-001.png", "Evidence")`

---

### NO. 2

**Test Cases:**
missing email is rejected without creating a session
Precondition: Use an isolated authentication fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call login without email.

**Predicted Test Results:**
HTTP 401 returns the generic invalid-credentials message and no AuthSession row is inserted.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AUTH-002.png", "Evidence")`

---

### NO. 3

**Test Cases:**
empty password is rejected without creating a session
Precondition: Use an isolated authentication fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call login with an empty password.

**Predicted Test Results:**
HTTP 401 returns the generic invalid-credentials message and no AuthSession row is inserted.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AUTH-003.png", "Evidence")`

---

### NO. 4

**Test Cases:**
non-string password is rejected at the CDS type boundary
Precondition: Use an isolated authentication fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call the AuthService.login OData endpoint with a non-string password value.

**Predicted Test Results:**
The malformed request is rejected by safe HTTP 400 validation without type internals or stack trace, and no AuthSession row is inserted. Wrong string credentials remain covered separately by the generic HTTP 401 boundary.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AUTH-004.png", "Evidence")`

---

### NO. 5

**Test Cases:**
unknown email and wrong password remain indistinguishable
Precondition: Use an isolated authentication fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Compare login for an unknown email with login for a known email and wrong password.

**Predicted Test Results:**
Both requests return the same safe HTTP 401 boundary and do not reveal account existence.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AUTH-005.png", "Evidence")`

---

### NO. 6

**Test Cases:**
inactive local user cannot create a session
Precondition: Use an isolated authentication fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call login for an inactive seeded user.

**Predicted Test Results:**
HTTP 401 is returned and no session is persisted.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AUTH-006.png", "Evidence")`

---

### NO. 7

**Test Cases:**
valid bearer token resolves the public current user
Precondition: Use an isolated authentication fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call AuthService.me with a valid local bearer token.

**Predicted Test Results:**
The public profile is returned without passwordHash, tokenHash, or private session data.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AUTH-007.png", "Evidence")`

---

### NO. 8

**Test Cases:**
expired bearer token is rejected
Precondition: Use an isolated authentication fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call a protected endpoint with an expired session token.

**Predicted Test Results:**
HTTP 401 is returned and no protected Bug data is exposed.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AUTH-008.png", "Evidence")`

---

### NO. 9

**Test Cases:**
revoked bearer token is rejected
Precondition: Use an isolated authentication fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call a protected endpoint with a revoked session token.

**Predicted Test Results:**
HTTP 401 is returned and the revoked session remains revoked.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AUTH-009.png", "Evidence")`

---

### NO. 10

**Test Cases:**
logout revokes the current session exactly once
Precondition: Use an isolated authentication fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Logout with a valid token and then reuse the same token.

**Predicted Test Results:**
Logout succeeds, the session is revoked, and subsequent use returns HTTP 401.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AUTH-010.png", "Evidence")`

---

### NO. 11

**Test Cases:**
custom login is disabled in XSUAA runtime
Precondition: Use an isolated authentication fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call AuthService.login through AppRouter while XSUAA mode is active.

**Predicted Test Results:**
HTTP 405 directs the user to SAP BTP authentication and no local session is created.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AUTH-011.png", "Evidence")`

---

### NO. 12

**Test Cases:**
mapped XSUAA identity resolves one active IDTS user
Precondition: Use an isolated authentication fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Sign in through AppRouter with an identity mapped to one active IDTS user and one allowed role.

**Predicted Test Results:**
The mapped public profile and protected OData access are returned for the same role.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AUTH-012.png", "Evidence")`

---

### NO. 13

**Test Cases:**
unmapped XSUAA identity is denied safely
Precondition: Use an isolated authentication fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Sign in with a valid SAP identity that has no active IDTS mapping.

**Predicted Test Results:**
HTTP 403 is returned without identity internals, HANA diagnostics, or business mutation.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AUTH-013.png", "Evidence")`

---

### NO. 14

**Test Cases:**
XSUAA identity with multiple application roles is denied
Precondition: Use an isolated authentication fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Sign in with more than one IDTS application role.

**Predicted Test Results:**
HTTP 403 is returned without identity internals, HANA diagnostics, or business mutation.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AUTH-014.png", "Evidence")`

---

### NO. 15

**Test Cases:**
XSUAA role mismatch with the IDTS user is denied
Precondition: Use an isolated authentication fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Sign in when the platform role differs from the mapped IDTS role.

**Predicted Test Results:**
HTTP 403 is returned without identity internals, HANA diagnostics, or business mutation.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AUTH-015.png", "Evidence")`

---

### NO. 16

**Test Cases:**
Tester creates a NEW draft with server-owned reporter
Precondition: Use an isolated bug write fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Create a NEW Bugs draft as Tester.

**Predicted Test Results:**
A draft is created and reporter_ID is derived from the authenticated Tester.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-BUG-001.png", "Evidence")`

---

### NO. 17

**Test Cases:**
PM creates a NEW draft with server-owned reporter
Precondition: Use an isolated bug write fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Create a NEW Bugs draft as PM.

**Predicted Test Results:**
A draft is created and reporter_ID is derived from the authenticated PM.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-BUG-002.png", "Evidence")`

---

### NO. 18

**Test Cases:**
Developer cannot create a NEW draft
Precondition: Use an isolated bug write fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Create a NEW Bugs draft as Developer.

**Predicted Test Results:**
HTTP 403 is returned and no draft or active Bug is created.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-BUG-003.png", "Evidence")`

---

### NO. 19

**Test Cases:**
PATCH preserves fields not included in a partial draft update
Precondition: Use an isolated bug write fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: PATCH only title on an existing draft.

**Predicted Test Results:**
The new title is merged with the old draft and unrelated fields remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-BUG-004.png", "Evidence")`

---

### NO. 20

**Test Cases:**
saving an unassigned draft creates Pending Assignment
Precondition: Use an isolated bug write fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: SAVE a complete draft with assignee_ID null.

**Predicted Test Results:**
The active Bug is PENDING_ASSIGNMENT, assignee remains null, and PM is the next processor.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-BUG-005.png", "Evidence")`

---

### NO. 21

**Test Cases:**
saving a draft with a valid assignee creates Assigned
Precondition: Use an isolated bug write fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: SAVE a complete draft with a valid available responsible assignee.

**Predicted Test Results:**
The active Bug is ASSIGNED and the assigned Developer is the next processor.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-BUG-006.png", "Evidence")`

---

### NO. 22

**Test Cases:**
direct CREATE replaces forged bug number and reporter
Precondition: Use an isolated bug write fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: CREATE an active Bug while supplying client-owned bugNumber and reporter_ID values.

**Predicted Test Results:**
Server-generated bugNumber and authenticated reporter values replace the forged input.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-BUG-007.png", "Evidence")`

---

### NO. 23

**Test Cases:**
authorized partial UPDATE persists one grouped edit event
Precondition: Use an isolated bug write fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: UPDATE title and severity without changing status or assignee.

**Predicted Test Results:**
Only submitted fields change and one EDIT history event contains both field logs.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-BUG-008.png", "Evidence")`

---

### NO. 24

**Test Cases:**
unauthorized Bug update is rejected before transition validation
Precondition: Use an isolated bug write fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: PATCH a Bug as a role that lacks write permission.

**Predicted Test Results:**
HTTP 403 is returned before transition validation and no data or side effect changes.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-BUG-009.png", "Evidence")`

---

### NO. 25

**Test Cases:**
unknown Bug update target returns not found without side effects
Precondition: Use an isolated bug write fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: UPDATE a syntactically valid Bug ID that does not exist.

**Predicted Test Results:**
HTTP 404 is returned and no history, notification, or delivery row is created.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-BUG-010.png", "Evidence")`

---

### NO. 26

**Test Cases:**
illegal direct status update is rejected
Precondition: Use an isolated bug write fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: PATCH status_code to a transition that is not allowed from the stored status.

**Predicted Test Results:**
HTTP 400 is returned and status, history, and notification remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-BUG-011.png", "Evidence")`

---

### NO. 27

**Test Cases:**
missing required field title is rejected
Precondition: Use an isolated validation fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: SAVE or CREATE a Bug with title omitted.

**Predicted Test Results:**
HTTP 400 targets title; no active write, history, notification, or delivery is committed.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-TITLE.png", "Evidence")`

---

### NO. 28

**Test Cases:**
missing required field description is rejected
Precondition: Use an isolated validation fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: SAVE or CREATE a Bug with description omitted.

**Predicted Test Results:**
HTTP 400 targets description; no active write, history, notification, or delivery is committed.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-DESCRIPTION.png", "Evidence")`

---

### NO. 29

**Test Cases:**
missing required field stepsToReproduce is rejected
Precondition: Use an isolated validation fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: SAVE or CREATE a Bug with stepsToReproduce omitted.

**Predicted Test Results:**
HTTP 400 targets stepsToReproduce; no active write, history, notification, or delivery is committed.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-STEPS.png", "Evidence")`

---

### NO. 30

**Test Cases:**
missing required field actualResult is rejected
Precondition: Use an isolated validation fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: SAVE or CREATE a Bug with actualResult omitted.

**Predicted Test Results:**
HTTP 400 targets actualResult; no active write, history, notification, or delivery is committed.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-ACTUAL.png", "Evidence")`

---

### NO. 31

**Test Cases:**
missing required field expectedResult is rejected
Precondition: Use an isolated validation fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: SAVE or CREATE a Bug with expectedResult omitted.

**Predicted Test Results:**
HTTP 400 targets expectedResult; no active write, history, notification, or delivery is committed.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-EXPECTED.png", "Evidence")`

---

### NO. 32

**Test Cases:**
missing required field priority_code is rejected
Precondition: Use an isolated validation fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: SAVE or CREATE a Bug with priority_code omitted.

**Predicted Test Results:**
HTTP 400 targets priority_code; no active write, history, notification, or delivery is committed.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-PRIORITY.png", "Evidence")`

---

### NO. 33

**Test Cases:**
missing required field severity_code is rejected
Precondition: Use an isolated validation fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: SAVE or CREATE a Bug with severity_code omitted.

**Predicted Test Results:**
HTTP 400 targets severity_code; no active write, history, notification, or delivery is committed.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-SEVERITY.png", "Evidence")`

---

### NO. 34

**Test Cases:**
missing required field applicationComponent_ID is rejected
Precondition: Use an isolated validation fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: SAVE or CREATE a Bug with applicationComponent_ID omitted.

**Predicted Test Results:**
HTTP 400 targets applicationComponent_ID; no active write, history, notification, or delivery is committed.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-COMPONENT.png", "Evidence")`

---

### NO. 35

**Test Cases:**
missing required field defectCategory_ID is rejected
Precondition: Use an isolated validation fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: SAVE or CREATE a Bug with defectCategory_ID omitted.

**Predicted Test Results:**
HTTP 400 targets defectCategory_ID; no active write, history, notification, or delivery is committed.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-CATEGORY.png", "Evidence")`

---

### NO. 36

**Test Cases:**
server-owned reporter derivation rejects an unresolved authenticated actor
Precondition: Use an isolated validation fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: SAVE or CREATE a Bug when the authenticated actor cannot be resolved to one active IDTS user.

**Predicted Test Results:**
The write is rejected safely before persistence; no Bug, history, notification, or delivery is committed. A client omission of reporter_ID remains valid when the authenticated actor resolves.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-REPORTER.png", "Evidence")`

---

### NO. 37

**Test Cases:**
whitespace-only required text is treated as missing
Precondition: Use an isolated validation fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Submit a required text field containing only spaces.

**Predicted Test Results:**
HTTP 400 targets the field and no active write occurs.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-WHITESPACE.png", "Evidence")`

---

### NO. 38

**Test Cases:**
unknown code-list value is rejected
Precondition: Use an isolated validation fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Submit a code that does not exist in the target code list.

**Predicted Test Results:**
HTTP 400 identifies the invalid catalog reference and no business write occurs.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-CODE-UNKNOWN.png", "Evidence")`

---

### NO. 39

**Test Cases:**
inactive code-list value is rejected
Precondition: Use an isolated validation fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Submit a historical code-list row with isActive=false.

**Predicted Test Results:**
HTTP 400 identifies the invalid catalog reference and no business write occurs.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-CODE-INACTIVE.png", "Evidence")`

---

### NO. 40

**Test Cases:**
space-padded code-list value is rejected
Precondition: Use an isolated validation fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Submit an otherwise valid code with leading or trailing spaces.

**Predicted Test Results:**
HTTP 400 identifies the invalid catalog reference and no business write occurs.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-CODE-SPACES.png", "Evidence")`

---

### NO. 41

**Test Cases:**
empty code-list value is rejected
Precondition: Use an isolated validation fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Submit an empty string for a required code-list field.

**Predicted Test Results:**
HTTP 400 identifies the invalid catalog reference and no business write occurs.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-CODE-EMPTY.png", "Evidence")`

---

### NO. 42

**Test Cases:**
non-string code-list value is rejected
Precondition: Use an isolated validation fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Submit a non-string value for a code-list field.

**Predicted Test Results:**
HTTP 400 identifies the invalid catalog reference and no business write occurs.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-CODE-TYPE.png", "Evidence")`

---

### NO. 43

**Test Cases:**
valid component and defect-category pair derives Component Category
Precondition: Use an isolated classification fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Submit an active Application Component and Defect Category pair with an active bridge.

**Predicted Test Results:**
The matching componentCategory_ID is derived and persisted.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-PAIR-VALID.png", "Evidence")`

---

### NO. 44

**Test Cases:**
component and defect-category pair without an active bridge is rejected
Precondition: Use an isolated classification fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Submit two active codes whose Component Category bridge does not exist or is inactive.

**Predicted Test Results:**
HTTP 400 targets classification and no stale derived value is retained.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-PAIR-NOMAP.png", "Evidence")`

---

### NO. 45

**Test Cases:**
client-supplied mismatching Component Category is rejected
Precondition: Use an isolated classification fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Submit componentCategory_ID different from the ID derived by the selected pair.

**Predicted Test Results:**
HTTP 400 is returned and no classification write occurs.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-PAIR-MISMATCH.png", "Evidence")`

---

### NO. 46

**Test Cases:**
changing to another valid pair updates the derived Component Category atomically
Precondition: Use an isolated classification fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: PATCH both classification inputs from one valid pair to another.

**Predicted Test Results:**
The new derived componentCategory_ID is persisted with the pair in one transaction.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-PAIR-CHANGE.png", "Evidence")`

---

### NO. 47

**Test Cases:**
partial classification clears the stale derived Component Category
Precondition: Use an isolated classification fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: PATCH only one classification input and leave the pair incomplete.

**Predicted Test Results:**
The stale componentCategory_ID is cleared and final Save remains blocked until the pair is valid.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-VAL-PAIR-PARTIAL.png", "Evidence")`

---

### NO. 48

**Test Cases:**
available responsible Developer can be assigned
Precondition: Use an isolated assignment fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Assign an active, available Developer with a matching active responsibility.

**Predicted Test Results:**
The Bug becomes ASSIGNED; assignee and next processor persist with exact assignment history.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ASN-001.png", "Evidence")`

---

### NO. 49

**Test Cases:**
PM can reassign to another valid Developer
Precondition: Use an isolated assignment fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Reassign an active Bug as PM to another eligible Developer.

**Predicted Test Results:**
The new assignee is persisted and the exact reassignment audit identifies PM as actor.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ASN-002.png", "Evidence")`

---

### NO. 50

**Test Cases:**
missing assignee ID is rejected
Precondition: Use an isolated assignment fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call assignToDeveloper without assigneeID.

**Predicted Test Results:**
HTTP 400 targets assignee and no assignment side effect occurs.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ASN-003.png", "Evidence")`

---

### NO. 51

**Test Cases:**
unknown Developer profile is rejected
Precondition: Use an isolated assignment fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Assign a syntactically valid DeveloperProfile ID that does not exist.

**Predicted Test Results:**
HTTP 400 is returned and assignment state remains unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ASN-004.png", "Evidence")`

---

### NO. 52

**Test Cases:**
inactive Developer profile is rejected
Precondition: Use an isolated assignment fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Assign a DeveloperProfile whose user or profile is inactive.

**Predicted Test Results:**
HTTP 400 is returned and assignment state remains unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ASN-005.png", "Evidence")`

---

### NO. 53

**Test Cases:**
unavailable Developer is rejected
Precondition: Use an isolated assignment fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Assign a candidate whose availability status is UNAVAILABLE.

**Predicted Test Results:**
HTTP 400 is returned and no assignment/history/notification occurs.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ASN-006.png", "Evidence")`

---

### NO. 54

**Test Cases:**
missing active responsibility is rejected
Precondition: Use an isolated assignment fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Assign a Developer without an active responsibility for the derived Component Category.

**Predicted Test Results:**
HTTP 400 is returned and no mutation occurs.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ASN-007.png", "Evidence")`

---

### NO. 55

**Test Cases:**
conflicting SAP Module responsibility is rejected
Precondition: Use an isolated assignment fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Assign a Developer whose responsibility SAP Module conflicts with the Bug SAP Module.

**Predicted Test Results:**
HTTP 400 is returned and no mutation occurs.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ASN-008.png", "Evidence")`

---

### NO. 56

**Test Cases:**
module-neutral responsibility remains eligible
Precondition: Use an isolated assignment fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Assign a Developer with a matching category responsibility and no module restriction.

**Predicted Test Results:**
Assignment succeeds when the other eligibility rules pass.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ASN-009.png", "Evidence")`

---

### NO. 57

**Test Cases:**
Developer cannot assign or reassign a Bug
Precondition: Use an isolated assignment fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call assignToDeveloper as Developer.

**Predicted Test Results:**
HTTP 403 is returned and status, assignee, history, notification, and delivery remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ASN-010.png", "Evidence")`

---

### NO. 58

**Test Cases:**
AssignableDevelopers excludes ineligible and inactive candidates
Precondition: Use an isolated assignment fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Read AssignableDevelopers for one valid classification pair.

**Predicted Test Results:**
Only active profiles with matching responsibility are returned with safe workload fields.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ASN-011.png", "Evidence")`

---

### NO. 59

**Test Cases:**
assignToDeveloper performs the allowed transition and exact audit
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Tester or PM assigns a valid Developer.

**Predicted Test Results:**
Status becomes ASSIGNED; exact ActionType ASSIGN_TO_DEVELOPER, next processor, history, notification, and reload state match the contract.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-01A.png", "Evidence")`

---

### NO. 60

**Test Cases:**
assignToDeveloper rejects an unauthorized actor
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call assignToDeveloper as a role or Developer owner not permitted for the stored Bug.

**Predicted Test Results:**
HTTP 403 is returned before mutation; Bug, history, notification, delivery, and comment counts remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-01B.png", "Evidence")`

---

### NO. 61

**Test Cases:**
assignToDeveloper rejects an illegal source status
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call assignToDeveloper from one disallowed stored status while all required input is valid.

**Predicted Test Results:**
HTTP 400 rejects the transition and the transaction produces no partial side effect.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-01C.png", "Evidence")`

---

### NO. 62

**Test Cases:**
assignToDeveloper rejects missing assigneeID
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call assignToDeveloper without assigneeID.

**Predicted Test Results:**
HTTP 400 targets assigneeID and no state changes.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-01D.png", "Evidence")`

---

### NO. 63

**Test Cases:**
moveToPendingAssignment performs the allowed transition and exact audit
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Tester or PM clears the current assignee.

**Predicted Test Results:**
Status becomes PENDING_ASSIGNMENT; exact ActionType MOVE_TO_PENDING_ASSIGNMENT, next processor, history, notification, and reload state match the contract.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-02A.png", "Evidence")`

---

### NO. 64

**Test Cases:**
moveToPendingAssignment rejects an unauthorized actor
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call moveToPendingAssignment as a role or Developer owner not permitted for the stored Bug.

**Predicted Test Results:**
HTTP 403 is returned before mutation; Bug, history, notification, delivery, and comment counts remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-02B.png", "Evidence")`

---

### NO. 65

**Test Cases:**
moveToPendingAssignment rejects an illegal source status
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call moveToPendingAssignment from one disallowed stored status while all required input is valid.

**Predicted Test Results:**
HTTP 400 rejects the transition and the transaction produces no partial side effect.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-02C.png", "Evidence")`

---

### NO. 66

**Test Cases:**
markInReview performs the allowed transition and exact audit
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: The assigned Developer marks the Bug in review.

**Predicted Test Results:**
Status becomes IN_REVIEW; exact ActionType MARK_IN_REVIEW, next processor, history, notification, and reload state match the contract.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-03A.png", "Evidence")`

---

### NO. 67

**Test Cases:**
markInReview rejects an unauthorized actor
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call markInReview as a role or Developer owner not permitted for the stored Bug.

**Predicted Test Results:**
HTTP 403 is returned before mutation; Bug, history, notification, delivery, and comment counts remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-03B.png", "Evidence")`

---

### NO. 68

**Test Cases:**
markInReview rejects an illegal source status
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call markInReview from one disallowed stored status while all required input is valid.

**Predicted Test Results:**
HTTP 400 rejects the transition and the transaction produces no partial side effect.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-03C.png", "Evidence")`

---

### NO. 69

**Test Cases:**
markInReview rejects missing assigned Developer
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call markInReview on an eligible Bug without assignee_ID.

**Predicted Test Results:**
HTTP 400 targets assignee and no state changes.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-03D.png", "Evidence")`

---

### NO. 70

**Test Cases:**
requestMoreInformation performs the allowed transition and exact audit
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: The assigned Developer submits a nonblank reason.

**Predicted Test Results:**
Status becomes NEED_MORE_INFORMATION; exact ActionType REQUEST_MORE_INFORMATION, next processor, history, notification, and reload state match the contract.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-04A.png", "Evidence")`

---

### NO. 71

**Test Cases:**
requestMoreInformation rejects an unauthorized actor
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call requestMoreInformation as a role or Developer owner not permitted for the stored Bug.

**Predicted Test Results:**
HTTP 403 is returned before mutation; Bug, history, notification, delivery, and comment counts remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-04B.png", "Evidence")`

---

### NO. 72

**Test Cases:**
requestMoreInformation rejects an illegal source status
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call requestMoreInformation from one disallowed stored status while all required input is valid.

**Predicted Test Results:**
HTTP 400 rejects the transition and the transaction produces no partial side effect.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-04C.png", "Evidence")`

---

### NO. 73

**Test Cases:**
requestMoreInformation rejects missing assigned Developer
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call requestMoreInformation on an eligible Bug without assignee_ID.

**Predicted Test Results:**
HTTP 400 targets assignee and no state changes.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-04D.png", "Evidence")`

---

### NO. 74

**Test Cases:**
requestMoreInformation rejects blank reason
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call requestMoreInformation with a blank reason.

**Predicted Test Results:**
HTTP 400 targets reason and no state changes.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-04E.png", "Evidence")`

---

### NO. 75

**Test Cases:**
resubmitToDeveloper performs the allowed transition and exact audit
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Tester or PM resubmits with a nonblank follow-up note.

**Predicted Test Results:**
Status becomes ASSIGNED; exact ActionType RESUBMIT_TO_DEVELOPER, next processor, history, notification, and reload state match the contract.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-05A.png", "Evidence")`

---

### NO. 76

**Test Cases:**
resubmitToDeveloper rejects an unauthorized actor
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call resubmitToDeveloper as a role or Developer owner not permitted for the stored Bug.

**Predicted Test Results:**
HTTP 403 is returned before mutation; Bug, history, notification, delivery, and comment counts remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-05B.png", "Evidence")`

---

### NO. 77

**Test Cases:**
resubmitToDeveloper rejects an illegal source status
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call resubmitToDeveloper from one disallowed stored status while all required input is valid.

**Predicted Test Results:**
HTTP 400 rejects the transition and the transaction produces no partial side effect.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-05C.png", "Evidence")`

---

### NO. 78

**Test Cases:**
resubmitToDeveloper rejects blank update summary
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call resubmitToDeveloper with a blank note.

**Predicted Test Results:**
HTTP 400 targets note and no state changes.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-05D.png", "Evidence")`

---

### NO. 79

**Test Cases:**
resubmitToDeveloper rejects missing assigned Developer
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call resubmitToDeveloper on an eligible Bug without assignee_ID.

**Predicted Test Results:**
HTTP 400 targets assignee and no state changes.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-05E.png", "Evidence")`

---

### NO. 80

**Test Cases:**
rejectBug performs the allowed transition and exact audit
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: The assigned Developer submits a nonblank rejection reason.

**Predicted Test Results:**
Status becomes REJECTED; exact ActionType REJECT_BUG, next processor, history, notification, and reload state match the contract.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-06A.png", "Evidence")`

---

### NO. 81

**Test Cases:**
rejectBug rejects an unauthorized actor
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call rejectBug as a role or Developer owner not permitted for the stored Bug.

**Predicted Test Results:**
HTTP 403 is returned before mutation; Bug, history, notification, delivery, and comment counts remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-06B.png", "Evidence")`

---

### NO. 82

**Test Cases:**
rejectBug rejects an illegal source status
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call rejectBug from one disallowed stored status while all required input is valid.

**Predicted Test Results:**
HTTP 400 rejects the transition and the transaction produces no partial side effect.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-06C.png", "Evidence")`

---

### NO. 83

**Test Cases:**
rejectBug rejects missing assigned Developer
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call rejectBug on an eligible Bug without assignee_ID.

**Predicted Test Results:**
HTTP 400 targets assignee and no state changes.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-06D.png", "Evidence")`

---

### NO. 84

**Test Cases:**
rejectBug rejects blank rejection reason
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call rejectBug with a blank reason.

**Predicted Test Results:**
HTTP 400 targets reason and no state changes.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-06E.png", "Evidence")`

---

### NO. 85

**Test Cases:**
startProgress performs the allowed transition and exact audit
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: The assigned Developer starts progress.

**Predicted Test Results:**
Status becomes IN_PROGRESS; exact ActionType START_PROGRESS, next processor, history, notification, and reload state match the contract.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-07A.png", "Evidence")`

---

### NO. 86

**Test Cases:**
startProgress rejects an unauthorized actor
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call startProgress as a role or Developer owner not permitted for the stored Bug.

**Predicted Test Results:**
HTTP 403 is returned before mutation; Bug, history, notification, delivery, and comment counts remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-07B.png", "Evidence")`

---

### NO. 87

**Test Cases:**
startProgress rejects an illegal source status
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call startProgress from one disallowed stored status while all required input is valid.

**Predicted Test Results:**
HTTP 400 rejects the transition and the transaction produces no partial side effect.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-07C.png", "Evidence")`

---

### NO. 88

**Test Cases:**
startProgress rejects missing assigned Developer
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call startProgress on an eligible Bug without assignee_ID.

**Predicted Test Results:**
HTTP 400 targets assignee and no state changes.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-07D.png", "Evidence")`

---

### NO. 89

**Test Cases:**
resolveBug performs the allowed transition and exact audit
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: The assigned Developer resolves with a nonblank note.

**Predicted Test Results:**
Status becomes RESOLVED; exact ActionType RESOLVE_BUG, next processor, history, notification, and reload state match the contract.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-08A.png", "Evidence")`

---

### NO. 90

**Test Cases:**
resolveBug rejects an unauthorized actor
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call resolveBug as a role or Developer owner not permitted for the stored Bug.

**Predicted Test Results:**
HTTP 403 is returned before mutation; Bug, history, notification, delivery, and comment counts remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-08B.png", "Evidence")`

---

### NO. 91

**Test Cases:**
resolveBug rejects an illegal source status
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call resolveBug from one disallowed stored status while all required input is valid.

**Predicted Test Results:**
HTTP 400 rejects the transition and the transaction produces no partial side effect.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-08C.png", "Evidence")`

---

### NO. 92

**Test Cases:**
resolveBug rejects missing assigned Developer
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call resolveBug on an eligible Bug without assignee_ID.

**Predicted Test Results:**
HTTP 400 targets assignee and no state changes.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-08D.png", "Evidence")`

---

### NO. 93

**Test Cases:**
resolveBug rejects blank resolution note
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call resolveBug with a blank note.

**Predicted Test Results:**
HTTP 400 targets note and no state changes.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-08E.png", "Evidence")`

---

### NO. 94

**Test Cases:**
sendToRetest performs the allowed transition and exact audit
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Tester or PM sends a resolved Bug to retest.

**Predicted Test Results:**
Status becomes RETEST_REQUIRED; exact ActionType SEND_TO_RETEST, next processor, history, notification, and reload state match the contract.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-09A.png", "Evidence")`

---

### NO. 95

**Test Cases:**
sendToRetest rejects an unauthorized actor
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call sendToRetest as a role or Developer owner not permitted for the stored Bug.

**Predicted Test Results:**
HTTP 403 is returned before mutation; Bug, history, notification, delivery, and comment counts remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-09B.png", "Evidence")`

---

### NO. 96

**Test Cases:**
sendToRetest rejects an illegal source status
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call sendToRetest from one disallowed stored status while all required input is valid.

**Predicted Test Results:**
HTTP 400 rejects the transition and the transaction produces no partial side effect.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-09C.png", "Evidence")`

---

### NO. 97

**Test Cases:**
closeBug performs the allowed transition and exact audit
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Tester or PM closes an eligible Bug.

**Predicted Test Results:**
Status becomes CLOSED; exact ActionType CLOSE_BUG, next processor, history, notification, and reload state match the contract.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-10A.png", "Evidence")`

---

### NO. 98

**Test Cases:**
closeBug rejects an unauthorized actor
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call closeBug as a role or Developer owner not permitted for the stored Bug.

**Predicted Test Results:**
HTTP 403 is returned before mutation; Bug, history, notification, delivery, and comment counts remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-10B.png", "Evidence")`

---

### NO. 99

**Test Cases:**
closeBug rejects an illegal source status
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call closeBug from one disallowed stored status while all required input is valid.

**Predicted Test Results:**
HTTP 400 rejects the transition and the transaction produces no partial side effect.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-10C.png", "Evidence")`

---

### NO. 100

**Test Cases:**
reopenBug performs the allowed transition and exact audit
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Tester or PM reopens with a nonblank reason.

**Predicted Test Results:**
Status becomes REOPENED; exact ActionType REOPEN_BUG, next processor, history, notification, and reload state match the contract.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-11A.png", "Evidence")`

---

### NO. 101

**Test Cases:**
reopenBug rejects an unauthorized actor
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call reopenBug as a role or Developer owner not permitted for the stored Bug.

**Predicted Test Results:**
HTTP 403 is returned before mutation; Bug, history, notification, delivery, and comment counts remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-11B.png", "Evidence")`

---

### NO. 102

**Test Cases:**
reopenBug rejects an illegal source status
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call reopenBug from one disallowed stored status while all required input is valid.

**Predicted Test Results:**
HTTP 400 rejects the transition and the transaction produces no partial side effect.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-11C.png", "Evidence")`

---

### NO. 103

**Test Cases:**
reopenBug rejects blank reopen reason
Precondition: Use an isolated lifecycle fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call reopenBug with a blank reason.

**Predicted Test Results:**
HTTP 400 targets reason and no state changes.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-LC-11D.png", "Evidence")`

---

### NO. 104

**Test Cases:**
TESTER adds a nonblank comment with server-owned author
Precondition: Use an isolated comments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Add a nonblank comment as TESTER.

**Predicted Test Results:**
The comment persists with authenticated author and role, survives reload, and does not change Bug status.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-CMT-001.png", "Evidence")`

---

### NO. 105

**Test Cases:**
DEVELOPER adds a nonblank comment with server-owned author
Precondition: Use an isolated comments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Add a nonblank comment as DEVELOPER.

**Predicted Test Results:**
The comment persists with authenticated author and role, survives reload, and does not change Bug status.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-CMT-002.png", "Evidence")`

---

### NO. 106

**Test Cases:**
PM adds a nonblank comment with server-owned author
Precondition: Use an isolated comments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Add a nonblank comment as PM.

**Predicted Test Results:**
The comment persists with authenticated author and role, survives reload, and does not change Bug status.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-CMT-003.png", "Evidence")`

---

### NO. 107

**Test Cases:**
empty comment is rejected
Precondition: Use an isolated comments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Submit an empty comment.

**Predicted Test Results:**
HTTP 400 targets content and no comment/history row is inserted.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-CMT-004.png", "Evidence")`

---

### NO. 108

**Test Cases:**
whitespace-only comment is rejected
Precondition: Use an isolated comments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Submit a comment containing only whitespace.

**Predicted Test Results:**
HTTP 400 targets content and no comment/history row is inserted.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-CMT-005.png", "Evidence")`

---

### NO. 109

**Test Cases:**
forged comment author is replaced by the authenticated actor
Precondition: Use an isolated comments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Submit comment author_ID and authorRole_code for another user.

**Predicted Test Results:**
Server-owned actor values are persisted; impersonation data is not accepted.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-CMT-006.png", "Evidence")`

---

### NO. 110

**Test Cases:**
addComment action writes readable audit without lifecycle change
Precondition: Use an isolated comments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call the bound addComment action with valid content.

**Predicted Test Results:**
One comment and one readable comment audit are committed while status and next processor remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-CMT-007.png", "Evidence")`

---

### NO. 111

**Test Cases:**
invalid comment actor role is rejected safely
Precondition: Use an isolated comments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Attempt a direct composition write with an invalid or inactive actor role.

**Predicted Test Results:**
HTTP 400/403 is returned and no comment row is inserted.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-CMT-008.png", "Evidence")`

---

### NO. 112

**Test Cases:**
new-draft file remains client-pending until activation
Precondition: Use an isolated attachments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Select one allowed file on a root NEW draft, then save the Bug.

**Predicted Test Results:**
No binary is uploaded before SAVE; after activation metadata and binary are linked to the active Bug.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ATT-001.png", "Evidence")`

---

### NO. 113

**Test Cases:**
allowed attachment persists metadata and bytes
Precondition: Use an isolated attachments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Upload an allowed file below the UI size limit to an active Bug.

**Predicted Test Results:**
Metadata and bytes persist with the recorded size and safe filename.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ATT-002.png", "Evidence")`

---

### NO. 114

**Test Cases:**
S3 upload stores HANA metadata and one object
Precondition: Use an isolated attachments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Upload through the production S3 binding.

**Predicted Test Results:**
HANA stores metadata, S3 stores one binary object, and no secret appears in the response.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ATT-003.png", "Evidence")`

---

### NO. 115

**Test Cases:**
download bytes match the uploaded SHA-256
Precondition: Use an isolated attachments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Download a previously uploaded attachment and calculate SHA-256.

**Predicted Test Results:**
The downloaded hash matches the sanitized source evidence hash.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ATT-004.png", "Evidence")`

---

### NO. 116

**Test Cases:**
attachment survives service restart and reload
Precondition: Use an isolated attachments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Restart/redeploy the service, reload the Bug, and download the attachment.

**Predicted Test Results:**
Metadata and byte hash remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ATT-005.png", "Evidence")`

---

### NO. 117

**Test Cases:**
delete removes metadata and storage object
Precondition: Use an isolated attachments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Delete an existing attachment.

**Predicted Test Results:**
Metadata and object are removed while unrelated Bug state remains unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ATT-006.png", "Evidence")`

---

### NO. 118

**Test Cases:**
unsupported MIME is blocked by the UI allowlist
Precondition: Use an isolated attachments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Select a MIME type outside the UI allowlist.

**Predicted Test Results:**
The UI rejects the selection before upload and shows the safe supported-type message.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** BLOCKED
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ATT-007.png", "Evidence")`

---

### NO. 119

**Test Cases:**
file above ten megabytes is blocked by the UI limit
Precondition: Use an isolated attachments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Select a payload larger than 10 MB.

**Predicted Test Results:**
The UI rejects the selection before upload and shows the safe 10 MB message.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** BLOCKED
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ATT-008.png", "Evidence")`

---

### NO. 120

**Test Cases:**
unauthenticated attachment write is denied
Precondition: Use an isolated attachments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Upload without an authenticated IDTS role.

**Predicted Test Results:**
HTTP 401/403 is returned before storage access and existing attachment state is unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ATT-009.png", "Evidence")`

---

### NO. 121

**Test Cases:**
storage upload failure does not leave orphan metadata
Precondition: Use an isolated attachments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Inject a controlled S3 upload failure after metadata preparation.

**Predicted Test Results:**
A safe error is returned and metadata/object state rolls back consistently.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ATT-010.png", "Evidence")`

---

### NO. 122

**Test Cases:**
storage download failure does not mutate Bug workflow
Precondition: Use an isolated attachments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Inject a controlled S3 download failure.

**Predicted Test Results:**
A safe error is returned and Bug status/history/notification remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ATT-011.png", "Evidence")`

---

### NO. 123

**Test Cases:**
storage delete failure keeps a truthful attachment state
Precondition: Use an isolated attachments fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Inject a controlled S3 delete failure.

**Predicted Test Results:**
The UI/API reports failure and does not falsely report deletion or mutate Bug workflow.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-ATT-012.png", "Evidence")`

---

### NO. 124

**Test Cases:**
Bug creation writes one create event
Precondition: Use an isolated history fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Create a valid Bug.

**Predicted Test Results:**
One create HistoryEvent identifies the actor and readable summary.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-HIS-001.png", "Evidence")`

---

### NO. 125

**Test Cases:**
multi-field edit writes one event with one log per changed field
Precondition: Use an isolated history fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Update multiple important fields in one transaction.

**Predicted Test Results:**
One EDIT event contains one HistoryLog per changed field.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-HIS-002.png", "Evidence")`

---

### NO. 126

**Test Cases:**
all lifecycle actions retain exact one-to-one ActionType values
Precondition: Use an isolated history fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Execute each of the eleven lifecycle actions on eligible fixtures.

**Predicted Test Results:**
Each event stores the exact registered ActionType rather than inferred generic status text.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-HIS-003.png", "Evidence")`

---

### NO. 127

**Test Cases:**
history display enrichment remains stable after reload
Precondition: Use an isolated history fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Read and reload an event containing code, user, status, and attachment values.

**Predicted Test Results:**
Display labels and values are stable and ordered newest first.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-HIS-004.png", "Evidence")`

---

### NO. 128

**Test Cases:**
validation failure inserts no history
Precondition: Use an isolated history fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Force a validation rejection before a write.

**Predicted Test Results:**
No HistoryEvent or HistoryLog is inserted.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-HIS-005.png", "Evidence")`

---

### NO. 129

**Test Cases:**
authorization failure inserts no history
Precondition: Use an isolated history fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Force an authorization rejection before a write.

**Predicted Test Results:**
No HistoryEvent or HistoryLog is inserted.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-HIS-006.png", "Evidence")`

---

### NO. 130

**Test Cases:**
post-update side-effect failure rolls back the whole transaction
Precondition: Use an isolated history fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Inject a controlled history or notification failure after an attempted update.

**Predicted Test Results:**
Bug, history, comment, and notification changes roll back together.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-HIS-007.png", "Evidence")`

---

### NO. 131

**Test Cases:**
eligible workflow event creates the correct in-app notification
Precondition: Use an isolated notifications and email fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Trigger a status event with a valid next recipient.

**Predicted Test Results:**
One IN_APP/SENT notification identifies the correct recipient and event.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-NTF-001.png", "Evidence")`

---

### NO. 132

**Test Cases:**
rejected workflow action creates no notification or delivery
Precondition: Use an isolated notifications and email fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Trigger an invalid lifecycle action.

**Predicted Test Results:**
No notification or email delivery row is inserted.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-NTF-002.png", "Evidence")`

---

### NO. 133

**Test Cases:**
valid email recipient creates one unique pending delivery
Precondition: Use an isolated notifications and email fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Create a notification with email enabled and a valid recipient.

**Predicted Test Results:**
One EMAIL/PENDING delivery with a safe snapshot is persisted.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-NTF-003.png", "Evidence")`

---

### NO. 134

**Test Cases:**
disabled email marks delivery skipped without rolling back workflow
Precondition: Use an isolated notifications and email fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Process notification while email delivery is disabled.

**Predicted Test Results:**
Delivery is SKIPPED with a safe reason and the Bug workflow remains committed.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-NTF-004.png", "Evidence")`

---

### NO. 135

**Test Cases:**
missing recipient email is skipped without provider call
Precondition: Use an isolated notifications and email fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Process an active recipient with no email.

**Predicted Test Results:**
Delivery is SKIPPED and sendMail is not called.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-NTF-005.png", "Evidence")`

---

### NO. 136

**Test Cases:**
inactive recipient is skipped without provider call
Precondition: Use an isolated notifications and email fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Process a notification for an inactive recipient.

**Predicted Test Results:**
Delivery is SKIPPED and sendMail is not called.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-NTF-006.png", "Evidence")`

---

### NO. 137

**Test Cases:**
worker claims and sends one eligible delivery
Precondition: Use an isolated notifications and email fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Run one worker against an eligible PENDING delivery.

**Predicted Test Results:**
Lock and attempt count update atomically; final status is SENT and lock/error are cleared.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-NTF-007.png", "Evidence")`

---

### NO. 138

**Test Cases:**
provider failure records sanitized FAILED and bounded retry
Precondition: Use an isolated notifications and email fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Inject a controlled provider failure on the first attempt.

**Predicted Test Results:**
Status is FAILED, diagnostic is sanitized, nextAttemptAt is bounded, and workflow remains committed.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-NTF-008.png", "Evidence")`

---

### NO. 139

**Test Cases:**
delivery before nextAttemptAt is not retried
Precondition: Use an isolated notifications and email fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Evaluate a FAILED row whose nextAttemptAt is in the future through processEmailDeliveries.

**Predicted Test Results:**
The row is not claimed or sent.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-NTF-009.png", "Evidence")`

---

### NO. 140

**Test Cases:**
delivery at or after nextAttemptAt is retried
Precondition: Use an isolated notifications and email fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Evaluate a FAILED row whose nextAttemptAt has elapsed through processEmailDeliveries.

**Predicted Test Results:**
The row becomes eligible and attempt count increments once.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-NTF-010.png", "Evidence")`

---

### NO. 141

**Test Cases:**
delivery at max attempts remains failed
Precondition: Use an isolated notifications and email fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Evaluate a FAILED row whose attemptCount reached maxAttempts through processEmailDeliveries.

**Predicted Test Results:**
The row is not retried and remains FAILED.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-NTF-011.png", "Evidence")`

---

### NO. 142

**Test Cases:**
two workers cannot send the same delivery twice
Precondition: Use an isolated notifications and email fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Start two controlled workers against the same eligible delivery.

**Predicted Test Results:**
Only one compare-and-set claim succeeds and exactly one provider send occurs; repeat on HANA for production-parity evidence.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-NTF-012.png", "Evidence")`

---

### NO. 143

**Test Cases:**
Job Scheduler invokes outbox with technical authorization
Precondition: Use an isolated notifications and email fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Invoke processEmailOutbox through the bound Job Scheduler task.

**Predicted Test Results:**
The authorized batch runs and HANA/provider statuses agree without exposing credentials.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-NTF-013.png", "Evidence")`

---

### NO. 144

**Test Cases:**
overdue flag respects due-date boundary and excludes Closed
Precondition: Use an isolated monitoring fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Evaluate open/closed Bugs before, on, and after due date.

**Predicted Test Results:**
Only open Bugs past due are overdue.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-MON-001.png", "Evidence")`

---

### NO. 145

**Test Cases:**
pending assignment count matches unassigned workflow rows
Precondition: Use an isolated monitoring fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Aggregate seeded pending-assignment Bugs.

**Predicted Test Results:**
Count matches stored eligible rows.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-MON-002.png", "Evidence")`

---

### NO. 146

**Test Cases:**
developer open-status counts match assigned Bugs
Precondition: Use an isolated monitoring fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Aggregate open Bugs for each Developer.

**Predicted Test Results:**
Open counts match stored assignee/status data.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-MON-003.png", "Evidence")`

---

### NO. 147

**Test Cases:**
workload threshold changes overload only above the configured limit
Precondition: Use an isolated monitoring fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Evaluate below, equal, and above workload limits.

**Predicted Test Results:**
isOverloaded changes at the documented boundary only.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-MON-004.png", "Evidence")`

---

### NO. 148

**Test Cases:**
current-action totals include only the correct next processor
Precondition: Use an isolated monitoring fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Aggregate Bugs across next-processor roles and statuses.

**Predicted Test Results:**
Only rows currently requiring that Developer action are counted.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-MON-005.png", "Evidence")`

---

### NO. 149

**Test Cases:**
search filter and order remain deterministic
Precondition: Use an isolated monitoring fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Apply search, where, orderBy, and limit to the same workload rows.

**Predicted Test Results:**
The same stable filtered order is returned.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-MON-006.png", "Evidence")`

---

### NO. 150

**Test Cases:**
non-PM cannot read AI operational metrics
Precondition: Use an isolated monitoring fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call readAiOperationalMetrics as Tester and Developer.

**Predicted Test Results:**
HTTP 403 is returned and no metric payload is exposed.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-MON-007.png", "Evidence")`

---

### NO. 151

**Test Cases:**
disabled provider returns AI_DISABLED without network access
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call provider operations with AI disabled.

**Predicted Test Results:**
A stable AI_DISABLED result is returned and no provider/network/business mutation occurs.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-001.png", "Evidence")`

---

### NO. 152

**Test Cases:**
deterministic structured mock maps a safe result
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call structured generation with controlled mock output.

**Predicted Test Results:**
The schema result is normalized and excluded secrets remain absent.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-002.png", "Evidence")`

---

### NO. 153

**Test Cases:**
embedding dimension equals configured vector length
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Request a controlled embedding with configured dimension six.

**Predicted Test Results:**
Exactly six finite values and the embedding model alias are returned.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-003.png", "Evidence")`

---

### NO. 154

**Test Cases:**
provider timeout returns safe retryable status
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Inject a controlled provider timeout.

**Predicted Test Results:**
AI_TIMEOUT is returned without raw stack, key, endpoint, or business input.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-004.png", "Evidence")`

---

### NO. 155

**Test Cases:**
provider network failure returns safe retryable status
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Inject a controlled network failure.

**Predicted Test Results:**
A safe retryable provider status is returned without raw diagnostics.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-005.png", "Evidence")`

---

### NO. 156

**Test Cases:**
malformed structured output falls back safely
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Return malformed structured provider output.

**Predicted Test Results:**
Validation rejects the payload and produces the documented safe fallback.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-006.png", "Evidence")`

---

### NO. 157

**Test Cases:**
secret redactor removes representative credential patterns
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Pass synthetic key, token, email, DB URL, and private endpoint-shaped text.

**Predicted Test Results:**
Sensitive patterns are removed without retaining raw input.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-007.png", "Evidence")`

---

### NO. 158

**Test Cases:**
Similar Bugs ranks grounded candidates without self-match
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Suggest similar Bugs for a persisted source with eligible candidates.

**Predicted Test Results:**
Grounded candidates are ranked; source Bug is excluded; review audit is safe.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-008.png", "Evidence")`

---

### NO. 159

**Test Cases:**
Similar Bugs no-result path creates no duplicate link
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Use input with no candidate above the threshold.

**Predicted Test Results:**
An empty/safe result is returned and DuplicateLinks remains unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-009.png", "Evidence")`

---

### NO. 160

**Test Cases:**
Classification suggestions contain only active catalog values
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Request classification for a Bug with adequate context.

**Predicted Test Results:**
Every suggested code maps to an active catalog row and audit remains review-only.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-010.png", "Evidence")`

---

### NO. 161

**Test Cases:**
Classification sparse-data path does not invent codes
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Request classification with minimal title/description context.

**Predicted Test Results:**
Unsafe or ungrounded fields return no suggestion or rules-based baseline, not invented codes.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-011.png", "Evidence")`

---

### NO. 162

**Test Cases:**
Handoff Summary grounds current state, comments, and history
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Summarize a Bug with comments and lifecycle history.

**Predicted Test Results:**
Summary, comment summary, events, and next action are grounded in stored data.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-012.png", "Evidence")`

---

### NO. 163

**Test Cases:**
Handoff comment prompt injection is treated as data
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Include instruction-like text inside a stored comment.

**Predicted Test Results:**
The comment is summarized as data and cannot override system constraints.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-013.png", "Evidence")`

---

### NO. 164

**Test Cases:**
Smart Assign explanation uses backend-issued candidates only
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Request explanations for the eligible candidate list.

**Predicted Test Results:**
Every explanation maps by safe candidate reference and no assignment occurs.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-014.png", "Evidence")`

---

### NO. 165

**Test Cases:**
Smart Assign unknown provider candidate is ignored
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Return an explanation for a candidate not issued by the backend.

**Predicted Test Results:**
The unknown row is discarded and no Developer ID is accepted from AI.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-015.png", "Evidence")`

---

### NO. 166

**Test Cases:**
Accept pending suggestion records one terminal review
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Accept a PENDING suggestion as an allowed role.

**Predicted Test Results:**
Review state, reviewer, and time persist; Bug workflow remains unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-016.png", "Evidence")`

---

### NO. 167

**Test Cases:**
Reject pending suggestion records one terminal review
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Reject a PENDING suggestion as an allowed role.

**Predicted Test Results:**
Review state, reviewer, and time persist; Bug workflow remains unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-017.png", "Evidence")`

---

### NO. 168

**Test Cases:**
Ignore pending suggestion records one terminal review
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Ignore a PENDING suggestion as an allowed role.

**Predicted Test Results:**
Review state, reviewer, and time persist; Bug workflow remains unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-018.png", "Evidence")`

---

### NO. 169

**Test Cases:**
repeated review of an ACCEPTED suggestion is rejected
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Review an already ACCEPTED suggestion again.

**Predicted Test Results:**
HTTP 409 is returned and original review/business state remains unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-019A.png", "Evidence")`

---

### NO. 170

**Test Cases:**
repeated review of a REJECTED suggestion is rejected
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Review an already REJECTED suggestion again.

**Predicted Test Results:**
HTTP 409 is returned and original review/business state remains unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-019B.png", "Evidence")`

---

### NO. 171

**Test Cases:**
repeated review of an IGNORED suggestion is rejected
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Review an already IGNORED suggestion again.

**Predicted Test Results:**
HTTP 409 is returned and original review/business state remains unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-019C.png", "Evidence")`

---

### NO. 172

**Test Cases:**
expired suggestion review is rejected
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Review a suggestion after expiresAt.

**Predicted Test Results:**
HTTP 409 is returned and no state is changed.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-020.png", "Evidence")`

---

### NO. 173

**Test Cases:**
accepted current Classification suggestion applies allowlisted fields
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Apply one ACCEPTED, unexpired, non-stale classification suggestion as Tester or PM.

**Predicted Test Results:**
Only classification allowlist fields change atomically; status/assignee/next processor remain unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-021.png", "Evidence")`

---

### NO. 174

**Test Cases:**
stale Classification suggestion cannot overwrite current Bug data
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Change source classification after suggestion creation, then Apply.

**Predicted Test Results:**
HTTP 409 is returned and current classification remains unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-022.png", "Evidence")`

---

### NO. 175

**Test Cases:**
accepted Similar Bugs candidate creates one grounded DuplicateLink
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Confirm one candidate stored in an ACCEPTED Similar Bugs suggestion as Tester or PM.

**Predicted Test Results:**
One normalized DuplicateLink is committed without lifecycle mutation.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-023.png", "Evidence")`

---

### NO. 176

**Test Cases:**
self duplicate candidate is rejected
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Confirm the source Bug as its own duplicate.

**Predicted Test Results:**
HTTP 400 is returned and no DuplicateLink is created.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-024.png", "Evidence")`

---

### NO. 177

**Test Cases:**
repeated forward duplicate link is idempotently rejected
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Confirm a pair whose forward link already exists.

**Predicted Test Results:**
HTTP 409 or the documented idempotent boundary is returned with one stored link only.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-025A.png", "Evidence")`

---

### NO. 178

**Test Cases:**
reverse duplicate link is idempotently rejected
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Confirm a pair whose reverse link already exists.

**Predicted Test Results:**
HTTP 409 or the documented idempotent boundary is returned with one stored link only.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-025B.png", "Evidence")`

---

### NO. 179

**Test Cases:**
PM reads allowlisted operational metrics only
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Read 30-day metrics as PM through the OData function.

**Predicted Test Results:**
Only aggregate capability/status/latency/review counts are returned; prompt/response/error/secret fields are absent. Repeat on BTP for deployed-role confirmation.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-026.png", "Evidence")`

---

### NO. 180

**Test Cases:**
controlled provider rate limit preserves safe no-mutation fallback
Precondition: Use an isolated ai fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Inject a controlled HTTP 429 provider response.

**Predicted Test Results:**
The documented cooldown/fallback result is recorded without retry storm or business mutation; live quota behavior is acceptance evidence, not a prerequisite for this component case.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-AI-027.png", "Evidence")`

---

### NO. 181

**Test Cases:**
anonymous BugService request is rejected
Precondition: Use an isolated security fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Call protected BugService without authentication.

**Predicted Test Results:**
HTTP 401 returns no business data.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-SEC-001.png", "Evidence")`

---

### NO. 182

**Test Cases:**
Developer cannot process another Developer assigned Bug
Precondition: Use an isolated security fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Run a Developer-only lifecycle action on another Developer assignee.

**Predicted Test Results:**
HTTP 403 is returned and no mutation occurs.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-SEC-002.png", "Evidence")`

---

### NO. 183

**Test Cases:**
read-only code-list entity rejects client write
Precondition: Use an isolated security fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: CREATE, UPDATE, or DELETE a projected code-list entity.

**Predicted Test Results:**
HTTP 405/403 is returned and the entity remains unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-SEC-003.png", "Evidence")`

---

### NO. 184

**Test Cases:**
audit entity rejects client write
Precondition: Use an isolated security fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: CREATE, UPDATE, or DELETE HistoryEvents, HistoryLogs, AiSuggestions, or Notifications.

**Predicted Test Results:**
HTTP 405/403 is returned and the entity remains unchanged.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-SEC-004.png", "Evidence")`

---

### NO. 185

**Test Cases:**
public projections omit credential and lock fields
Precondition: Use an isolated security fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Read public Users, sessions, notifications, and AI projections.

**Predicted Test Results:**
passwordHash, tokenHash, lockToken, raw email body, prompt, and response are absent.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-SEC-005.png", "Evidence")`

---

### NO. 186

**Test Cases:**
database exception is sanitized at the public boundary
Precondition: Use an isolated security fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Inject a controlled database exception containing sensitive text.

**Predicted Test Results:**
Public error and persisted diagnostic omit SQL, credentials, endpoint, and stack.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-SEC-006.png", "Evidence")`

---

### NO. 187

**Test Cases:**
provider exception is sanitized at the public boundary
Precondition: Use an isolated security fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Inject a controlled provider exception containing sensitive text.

**Predicted Test Results:**
Public error and audit diagnostic contain only allowlisted stable tokens.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-SEC-007.png", "Evidence")`

---

### NO. 188

**Test Cases:**
failed operation leaves no cross-entity partial mutation
Precondition: Use an isolated security fixture at baseline bc0c47e522ae; capture the relevant before-state.
Action: Force a failure during an operation that would touch Bug, history, notification, duplicate, classification, or attachment state.

**Predicted Test Results:**
The transaction leaves all affected business entities consistent with the before-state.

**Tester:** NhanT candidate
**Test Date:** 02/09/2026
**Result:** PASS
**Evidence:** `=HYPERLINK("Unit_Test_PNG_Evidence\UT-SEC-008.png", "Evidence")`

---