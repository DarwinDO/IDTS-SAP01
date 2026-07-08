# `srv/service.cds` - IDTS-69 Smart Assignment Explanation supplemental note

## English

### Why this supplemental note exists

The existing mirror `docs/knowledge/srv/service.cds.md` contains older invalid UTF-8 bytes, so the safe patch tool could not update it directly in this work session. This note records the IDTS-69 change without rewriting the older mirror.

### What changed

IDTS-69 adds the unbound OData action `explainSmartAssignment(...)` and result type `SmartAssignmentExplanationCandidate`.

The action lets the Smart Assign dialog request an explanation for each developer candidate. It returns explanation text, warnings, confidence, provider/grounding status, workload context, and `requiresReview`.

### Beginner explanation

In CAP, `srv/service.cds` is the public service contract. If a UI needs to call a backend operation through OData, that operation must be declared here. For IDTS-69, the operation is not a save action. It is a read-style suggestion action: the UI asks, "Please explain these Smart Assign candidates," and the backend responds with reviewable explanation rows.

The action does not assign a developer. The user still chooses manually, and existing assignment validation remains the final authority.

### Important source anchors

- **Location**: `srv/service.cds`, `type SmartAssignmentExplanationCandidate`
  **IDTS concept**: Shape of the explanation row shown in Smart Assign.
  **Impact if broken**: The UI may lose provider status, warning text, workload context, or the `requiresReview` reminder.
  **Must check together**: `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`, `srv/ai/assignment-explanation.js`, and `scripts/qa/test-idts69-assignment-explanation.js`.

- **Location**: `srv/service.cds`, `action explainSmartAssignment(...)`
  **IDTS concept**: Public OData contract for AI-assisted assignment explanation.
  **Impact if broken**: Smart Assign cannot request explanations, or clients may confuse explanation with assignment mutation.
  **Must check together**: `srv/service.js`, `srv/ai/assignment-explanation.js`, `srv/bug-service/read-models.js`, and IDTS-56 Smart Assign tests.

### Cross-folder impact

- `srv/service.js` wires the action to runtime.
- `srv/ai/assignment-explanation.js` implements the explanation logic.
- `srv/bug-service/read-models.js` provides the same candidate source used by `/AssignableDevelopers`.
- `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js` displays the explanation.

## Vietnamese

### Vi sao co note bo sung nay

Mirror cu `docs/knowledge/srv/service.cds.md` dang co byte UTF-8 cu bi loi, nen patch tool an toan khong update truc tiep duoc trong phien nay. Note nay ghi lai thay doi IDTS-69 ma khong rewrite file mirror cu.

### Da thay doi gi

IDTS-69 them unbound OData action `explainSmartAssignment(...)` va result type `SmartAssignmentExplanationCandidate`.

Action nay cho phep dialog Smart Assign request explanation cho tung developer candidate. Backend tra ve explanation, warning, confidence, provider/grounding status, workload context va `requiresReview`.

### Giai thich cho nguoi moi

Trong CAP, `srv/service.cds` la contract public cua service. Neu UI can goi mot operation backend qua OData thi operation do phai duoc khai bao o day. Voi IDTS-69, operation nay khong phai action luu du lieu. No la action goi y dang read-style: UI hoi "hay giai thich cac Smart Assign candidate nay", backend tra ve cac dong explanation de user review.

Action nay khong assign developer. User van tu chon, va backend validation hien co van la lop quyet dinh cuoi cung.

### Important source anchors

- **Vi tri**: `srv/service.cds`, `type SmartAssignmentExplanationCandidate`
  **Khai niem IDTS**: Cau truc mot dong explanation hien trong Smart Assign.
  **Anh huong neu sai**: UI co the mat provider status, warning, workload context, hoac nhac nho `requiresReview`.
  **Phai kiem tra cung**: `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`, `srv/ai/assignment-explanation.js`, va `scripts/qa/test-idts69-assignment-explanation.js`.

- **Vi tri**: `srv/service.cds`, `action explainSmartAssignment(...)`
  **Khai niem IDTS**: Contract OData public cho AI ho tro giai thich assignment.
  **Anh huong neu sai**: Smart Assign khong request duoc explanation, hoac client co the hieu nham explanation la action phan cong.
  **Phai kiem tra cung**: `srv/service.js`, `srv/ai/assignment-explanation.js`, `srv/bug-service/read-models.js`, va test Smart Assign IDTS-56.

### Lien ket voi folder khac

- `srv/service.js` noi action vao runtime.
- `srv/ai/assignment-explanation.js` trien khai logic explanation.
- `srv/bug-service/read-models.js` cung cap cung nguon candidate ma `/AssignableDevelopers` dung.
- `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js` hien explanation len UI.
