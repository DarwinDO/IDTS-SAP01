# Knowledge: `app/bug-management-ui/webapp/ext/fragment/HandoffSummarySection.fragment.xml`

## English

### What this file is for

This fragment renders the small Handoff Summary section on the Bug Object Page.

It gives the user one button, `Review Handoff Summary`, which opens the review dialog implemented in `HandoffSummaryReview.js`.

### Beginner explanation

Fiori Elements builds most of the Object Page automatically from annotations and manifest configuration. When IDTS needs a small custom area that Fiori Elements does not create by itself, the app can insert a custom fragment.

This fragment is that custom area. It does not contain business logic. It only declares the visible section text and the button that calls the JavaScript action.

### Flow inside IDTS

1. `manifest.json` registers this fragment under the `IdtsHandoffSummary` Object Page section.
2. Fiori Elements loads the fragment when rendering an active Bug Object Page.
3. The section shows a short user-facing hint.
4. The button loads `HandoffSummaryReview.js` through `core:require`.
5. Pressing the button calls `HandoffSummaryReview.openDialog`.

### Important source anchors

- **Location**: `section:SmartAssignmentSection`
  **IDTS concept**: Reuses the existing lightweight custom section wrapper instead of introducing another layout control.
  **Impact if broken**: The section may not match the existing Object Page extension layout.
  **Must check together**: `SmartAssignmentSection.js`, `manifest.json`, and UI5 build.

- **Location**: `visible="{= ${IsActiveEntity} === true }"`
  **IDTS concept**: The review helper is for persisted Bugs, because the backend action needs a real Bug ID.
  **Impact if broken**: Users could try to summarize an unsaved draft that has no stable source Bug.
  **Must check together**: `HandoffSummaryReview.js`, `srv/service.cds`, and browser smoke.

- **Location**: `core:require`
  **IDTS concept**: Loads the UI action module only for this button.
  **Impact if broken**: The button can render but do nothing when pressed.
  **Must check together**: `HandoffSummaryReview.js`, UI5 linter, and IDTS-76 browser evidence.

### Cross-folder impact

- `app/bug-management-ui/webapp/manifest.json` decides where this section appears.
- `app/bug-management-ui/webapp/ext/actions/HandoffSummaryReview.js` owns the dialog and backend call.
- `app/bug-management-ui/webapp/i18n/i18n.properties` and `i18n_en.properties` provide the section title, hint, and button text.
- `srv/service.cds` and `srv/ai/bug-summary.js` provide the data returned by the dialog.

### Safe editing checklist

- Keep the section review-only.
- Do not add technical or environment-facing text to the visible hint.
- Do not make it visible for unsaved draft create pages unless backend behavior is redesigned.
- Keep button text in i18n, not hardcoded in the fragment.
- Run UI5 build and IDTS-76 browser smoke after changes.

## Vietnamese

### File nay dung de lam gi

Fragment nay render section Handoff Summary nho tren Bug Object Page.

No cho user mot nut `Review Handoff Summary`, nut nay mo dialog review trong `HandoffSummaryReview.js`.

### Giai thich cho nguoi moi

Fiori Elements tu tao phan lon Object Page dua tren annotation va manifest. Khi IDTS can mot vung custom nho ma Fiori Elements khong tu tao, app co the chen custom fragment.

Fragment nay chinh la vung custom do. No khong chua business logic. No chi khai bao text hien tren man hinh va nut goi JavaScript action.

### Flow trong IDTS

1. `manifest.json` dang ky fragment nay duoi section Object Page `IdtsHandoffSummary`.
2. Fiori Elements load fragment khi render mot active Bug Object Page.
3. Section hien mot hint ngan cho user.
4. Button load `HandoffSummaryReview.js` qua `core:require`.
5. Khi bam button, UI goi `HandoffSummaryReview.openDialog`.

### Anchor quan trong

- **Vi tri**: `section:SmartAssignmentSection`
  **Khai niem IDTS**: Tai su dung custom section wrapper nhe da co thay vi them layout control moi.
  **Anh huong neu sai**: Section co the khong khop layout extension hien co tren Object Page.
  **Phai kiem tra cung**: `SmartAssignmentSection.js`, `manifest.json`, va UI5 build.

- **Vi tri**: `visible="{= ${IsActiveEntity} === true }"`
  **Khai niem IDTS**: Review helper chi dung cho Bug da persist, vi backend action can Bug ID that.
  **Anh huong neu sai**: User co the thu summarize draft chua save va chua co Bug ID on dinh.
  **Phai kiem tra cung**: `HandoffSummaryReview.js`, `srv/service.cds`, va browser smoke.

- **Vi tri**: `core:require`
  **Khai niem IDTS**: Load module UI action rieng cho nut nay.
  **Anh huong neu sai**: Nut co the hien nhung bam khong lam gi.
  **Phai kiem tra cung**: `HandoffSummaryReview.js`, UI5 linter, va browser evidence IDTS-76.

### Lien ket voi folder/file khac

- `app/bug-management-ui/webapp/manifest.json` quyet dinh section nay nam o dau.
- `app/bug-management-ui/webapp/ext/actions/HandoffSummaryReview.js` xu ly dialog va backend call.
- `app/bug-management-ui/webapp/i18n/i18n.properties` va `i18n_en.properties` giu title, hint va button text.
- `srv/service.cds` va `srv/ai/bug-summary.js` cung cap du lieu backend cho dialog.

### Checklist sua an toan

- Giu section chi de review.
- Khong them text ky thuat, moi truong, hoac noi bo vao hint hien tren UI.
- Khong hien section cho create draft chua save tru khi backend duoc thiet ke lai.
- Button text phai nam trong i18n, khong hardcode trong fragment.
- Sau khi sua phai chay UI5 build va browser smoke IDTS-76.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/fragment/HandoffSummarySection.fragment.xml`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/fragment/HandoffSummarySection.fragment.xml.md`
- Source layer: `app`
- Last reviewed: 2026-07-09
