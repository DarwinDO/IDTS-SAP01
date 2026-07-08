# `srv/bug-service/read-models.js` - IDTS-69 Smart Assignment Explanation supplemental note

## English

### What changed

IDTS-69 exports `buildAssignableDeveloperRows(...)` so the AI explanation module can reuse the same candidate source as `/AssignableDevelopers`.

### Beginner explanation

Before explaining why a developer is a good candidate, the backend must first know who is allowed to be a candidate. That logic already exists in `read-models.js`. IDTS-69 deliberately reuses it instead of creating a second candidate algorithm inside the AI module.

This prevents a mismatch where the UI shows one list of selectable developers but AI explains a different list.

### Important source anchors

- **Location**: `buildAssignableDeveloperRows(tx, entities, criteria = {})`
  **IDTS concept**: Shared candidate source for Smart Assign and AI explanations.
  **Impact if broken**: Smart Assign and AI explanation may disagree about eligible developers.
  **Must check together**: `readAssignableDevelopers(...)`, `srv/ai/assignment-explanation.js`, `DeveloperProfiles`, `DeveloperResponsibilities`, and IDTS-56/69 tests.

- **Location**: `toPublicAssignableDeveloperRow(row)`
  **IDTS concept**: Keeps internal-only data such as workload limit out of the public `/AssignableDevelopers` response while still letting backend AI logic use it.
  **Impact if broken**: OData clients may receive undeclared/internal fields, or AI may lose workload context.
  **Must check together**: `srv/service.cds` `AssignableDevelopers`, Smart Assign UI bindings, and CAP compile output.

### Safe editing checklist

- Do not duplicate candidate filtering in the AI layer.
- Keep public `/AssignableDevelopers` response stable.
- If adding internal candidate fields, strip them before returning public OData rows unless the service contract is explicitly updated.

## Vietnamese

### Da thay doi gi

IDTS-69 export `buildAssignableDeveloperRows(...)` de module AI explanation tai su dung cung nguon candidate voi `/AssignableDevelopers`.

### Giai thich cho nguoi moi

Truoc khi giai thich vi sao mot developer phu hop, backend phai biet ai duoc phep la candidate. Logic nay da nam trong `read-models.js`. IDTS-69 co tinh tai su dung logic do thay vi tao them mot thuat toan candidate rieng trong AI module.

Dieu nay tranh viec UI hien mot danh sach developer co the chon, nhung AI lai giai thich mot danh sach khac.

### Important source anchors

- **Vi tri**: `buildAssignableDeveloperRows(tx, entities, criteria = {})`
  **Khai niem IDTS**: Nguon candidate dung chung cho Smart Assign va AI explanation.
  **Anh huong neu sai**: Smart Assign va AI explanation co the bat dong ve developer hop le.
  **Phai kiem tra cung**: `readAssignableDevelopers(...)`, `srv/ai/assignment-explanation.js`, `DeveloperProfiles`, `DeveloperResponsibilities`, va test IDTS-56/69.

- **Vi tri**: `toPublicAssignableDeveloperRow(row)`
  **Khai niem IDTS**: Giu field noi bo nhu workload limit khong lo ra response public `/AssignableDevelopers`, nhung backend AI van dung duoc.
  **Anh huong neu sai**: OData client co the nhan field noi bo/chua khai bao, hoac AI mat context workload.
  **Phai kiem tra cung**: `srv/service.cds` `AssignableDevelopers`, binding UI Smart Assign, va CAP compile output.

### Checklist sua file an toan

- Khong viet lai filtering candidate rieng trong AI layer.
- Giu response public `/AssignableDevelopers` on dinh.
- Neu them field noi bo cho candidate, can strip truoc khi tra ve OData public tru khi service contract duoc update ro rang.
