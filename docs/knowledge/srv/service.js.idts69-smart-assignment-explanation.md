# `srv/service.js` - IDTS-69 Smart Assignment Explanation supplemental note

## English

### What changed

IDTS-69 wires the CAP action `explainSmartAssignment` to the runtime handler exported from `srv/ai`.

### Beginner explanation

Declaring an action in `srv/service.cds` only describes the OData contract. CAP still needs JavaScript runtime code to handle the request. `srv/service.js` is where IDTS connects the service action name to the actual backend function.

### Important source anchors

- **Location**: `this.on('explainSmartAssignment', ...)`
  **IDTS concept**: Runtime bridge from OData Smart Assign explanation request to backend AI explanation logic.
  **Impact if broken**: Metadata may show the action, but calling it returns an unimplemented-handler error or no explanation data.
  **Must check together**: `srv/service.cds`, `srv/ai/assignment-explanation.js`, and Smart Assign UI.

## Vietnamese

### Da thay doi gi

IDTS-69 noi CAP action `explainSmartAssignment` vao runtime handler export tu `srv/ai`.

### Giai thich cho nguoi moi

Khai bao action trong `srv/service.cds` chi mo ta contract OData. CAP van can JavaScript runtime de xu ly request. `srv/service.js` la noi IDTS noi ten action cua service voi function backend that.

### Important source anchors

- **Vi tri**: `this.on('explainSmartAssignment', ...)`
  **Khai niem IDTS**: Cau noi runtime tu request OData Smart Assign explanation sang logic AI explanation backend.
  **Anh huong neu sai**: Metadata co the van hien action, nhung khi goi se bi loi handler chua implement hoac khong co explanation.
  **Phai kiem tra cung**: `srv/service.cds`, `srv/ai/assignment-explanation.js`, va Smart Assign UI.
