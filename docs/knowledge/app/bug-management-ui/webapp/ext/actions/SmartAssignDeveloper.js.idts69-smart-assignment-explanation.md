# `SmartAssignDeveloper.js` - IDTS-69 Smart Assignment Explanation supplemental note

## English

### Why this supplemental note exists

The main mirror already explains the Smart Assign picker from IDTS-56/61. IDTS-69 adds an AI explanation column and a backend action call. This supplemental note records that specific change for onboarding and review.

### What changed

The Smart Assign dialog now asks the backend for explanations after loading developer candidates. It displays a new `Explanation` column with:

- explanation text,
- review confidence,
- review-required marker,
- warnings when the candidate is busy, unavailable, overloaded, or when the AI explanation is unavailable.

### Beginner explanation

The dialog still gets candidates from `/AssignableDevelopers`. That endpoint decides who is a valid candidate. After the candidates load, the UI calls `/explainSmartAssignment(...)` to ask the backend to explain those candidates.

This separation matters:

- `/AssignableDevelopers` answers "Who can be selected?"
- `/explainSmartAssignment(...)` answers "Why might this person fit?"
- The user still manually selects the assignee.
- Backend assignment validation still protects the final save.

### Important source anchors

- **Location**: `readAssignmentExplanations(...)`
  **IDTS concept**: Calls the backend AI explanation action after candidates are loaded.
  **Impact if broken**: The dialog still opens, but users lose the reason/warning context for each candidate.
  **Must check together**: `srv/service.cds` `explainSmartAssignment`, `srv/ai/assignment-explanation.js`, and `scripts/qa/test-idts56-smart-assign.js`.

- **Location**: `applyAssignmentExplanations(...)`
  **IDTS concept**: Merges backend explanation rows into already-visible Smart Assign candidates without changing candidate eligibility.
  **Impact if broken**: Explanation can attach to the wrong developer, or candidate selection can be reset while the user is reviewing.
  **Must check together**: candidate `developerProfileID`, `readCandidates(...)`, and the Smart Assign table binding.

- **Location**: Explanation table column
  **IDTS concept**: Makes AI output reviewable, not authoritative.
  **Impact if broken**: Users may not see warning/review-required text and may trust AI too strongly.
  **Must check together**: `i18n.properties`, `i18n_en.properties`, SAP Fiori AI guidance, and browser/UX evidence.

### Safe editing checklist

- Do not add wording that says AI selected or decided the assignee.
- Do not hide the manual review message.
- Do not make the explanation call block the dialog from opening.
- Keep AI failure as a safe "explanation unavailable" state.
- Rerun `npm run qa:idts56:programmatic` and `npm run qa:idts69:programmatic`.

## Vietnamese

### Vi sao co note bo sung nay

Mirror chinh da giai thich Smart Assign picker tu IDTS-56/61. IDTS-69 them cot AI explanation va mot backend action call. Note bo sung nay ghi ro thay doi do de thanh vien moi doc de hieu.

### Da thay doi gi

Dialog Smart Assign bay gio request explanation tu backend sau khi load developer candidates. UI hien them cot `Explanation` gom:

- noi dung giai thich,
- review confidence,
- nhan review-required,
- warning khi candidate busy, unavailable, overloaded, hoac khi AI explanation khong san sang.

### Giai thich cho nguoi moi

Dialog van lay candidate tu `/AssignableDevelopers`. Endpoint do quyet dinh ai la candidate hop le. Sau khi candidate load xong, UI goi `/explainSmartAssignment(...)` de hoi backend vi sao tung candidate phu hop.

Viec tach nay quan trong:

- `/AssignableDevelopers` tra loi "Ai co the duoc chon?"
- `/explainSmartAssignment(...)` tra loi "Vi sao nguoi nay co the phu hop?"
- User van tu chon assignee.
- Backend assignment validation van bao ve lan luu cuoi.

### Important source anchors

- **Vi tri**: `readAssignmentExplanations(...)`
  **Khai niem IDTS**: Goi backend AI explanation action sau khi candidate duoc load.
  **Anh huong neu sai**: Dialog van mo duoc, nhung user mat ly do/warning cho tung candidate.
  **Phai kiem tra cung**: `srv/service.cds` `explainSmartAssignment`, `srv/ai/assignment-explanation.js`, va `scripts/qa/test-idts56-smart-assign.js`.

- **Vi tri**: `applyAssignmentExplanations(...)`
  **Khai niem IDTS**: Gan explanation backend vao candidate dang hien thi ma khong doi eligibility.
  **Anh huong neu sai**: Explanation co the gan nham developer, hoac selection bi reset khi user dang review.
  **Phai kiem tra cung**: candidate `developerProfileID`, `readCandidates(...)`, va Smart Assign table binding.

- **Vi tri**: cot Explanation trong table
  **Khai niem IDTS**: Bien output AI thanh noi dung review duoc, khong phai quyet dinh cuoi.
  **Anh huong neu sai**: User co the khong thay warning/review-required va tin AI qua muc.
  **Phai kiem tra cung**: `i18n.properties`, `i18n_en.properties`, SAP Fiori AI guidance, va evidence browser/UX.

### Checklist sua file an toan

- Khong viet text noi AI da chon hoac da quyet dinh assignee.
- Khong an thong diep manual review.
- Khong de explanation call lam dialog khong mo duoc.
- Neu AI loi, phai hien trang thai an toan "explanation unavailable".
- Chay lai `npm run qa:idts56:programmatic` va `npm run qa:idts69:programmatic`.
