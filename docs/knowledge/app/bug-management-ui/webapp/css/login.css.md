# Knowledge: `app/bug-management-ui/webapp/css/login.css`

> **Ownership / debug anchor:** DatDT owns login layout styling (backup: SangVN). Visual breakage starts with viewport and selector inspection, not authentication code.
> **Ownership / điểm debug:** DatDT sở hữu style layout login (backup: SangVN). Lỗi hiển thị bắt đầu bằng viewport và selector, không phải code authentication.

## English

### What this file is for

`login.css` contains the page-specific visual styling for the standalone IDTS login screen. It works together with SAPUI5 controls from `login-page.js`; it does not implement authentication logic.

### Beginner explanation

SAPUI5 controls provide the basic Fiori look, but a login page still needs a layout: where the card sits, how much spacing it has, and how it behaves on mobile. This CSS handles those layout details while using SAP theme variables such as `--sapBackgroundColor`, `--sapTile_Background`, and `--sapContent_Shadow2`.

Using SAP theme variables is important because the page can follow the active SAP Horizon theme more naturally than hardcoded colors.

### Flow in IDTS

1. `login.html` loads this CSS before `login-page.js`.
2. `login-page.js` creates UI5 controls and adds classes such as `idtsLoginShell`, `idtsLoginCard`, and `idtsLoginMessage`.
3. This CSS controls the login layout, card width, responsive behavior, and spacing.
4. On smaller screens, the login card uses the available width.

### Important source anchors

| Location | IDTS concept | Impact if broken | Must check together |
| --- | --- | --- | --- |
| `.idtsLoginShell` | Login page layout | Login card may be misaligned or hard to use. | `login-page.js` HBox root |
| `.idtsLoginCard` | Sign-in card container | Inputs/buttons may look inconsistent or too wide/narrow. | `login-page.js` Panel |
| `.idtsLoginMessage` | Error message spacing | Validation/auth errors may overlap surrounding controls. | `login-page.js` MessageStrip |
| `@media (max-width: 48rem)` | Mobile layout | Phone/tablet layout may break. | Browser smoke responsive check |

### Cross-folder impact

- No direct backend dependency exists. This file affects only frontend layout.
- It indirectly depends on `login-page.js` because the class names in CSS must match the classes added to UI5 controls.
- It indirectly relates to `srv/auth.js` only through UX: safe login errors from the backend are displayed inside UI controls styled by this file.

### Safe editing checklist

- Keep class names aligned with `login-page.js`.
- Prefer SAP CSS variables over hardcoded colors.
- Do not add password, token, endpoint, or user data to CSS comments.
- Test desktop and mobile width after layout changes.
- If changing message spacing, verify empty-submit and wrong-password display.

## Vietnamese

### File này dùng để làm gì

`login.css` chứa styling riêng cho màn hình login standalone của IDTS. Nó đi cùng các SAPUI5 controls được tạo trong `login-page.js`; nó không xử lý logic authentication.

### Giải thích cho người mới

SAPUI5 controls đã có giao diện Fiori cơ bản, nhưng một trang login vẫn cần layout: card nằm ở đâu, khoảng cách như thế nào, trên mobile có bị vỡ không, và phần giới thiệu bên trái nhìn ra sao. CSS này xử lý các chi tiết layout đó, đồng thời dùng SAP theme variables như `--sapBackgroundColor`, `--sapTile_Background`, và `--sapContent_Shadow2`.

Dùng SAP theme variables quan trọng vì trang login sẽ đi theo theme SAP Horizon tự nhiên hơn so với việc hardcode màu.

### Flow hoạt động trong IDTS

1. `login.html` load CSS này trước `login-page.js`.
2. `login-page.js` tạo UI5 controls và gắn class như `idtsLoginShell`, `idtsLoginCard`, `idtsLoginMessage`.
3. CSS này điều khiển layout login, độ rộng card, responsive behavior, và spacing.
4. Trên màn hình nhỏ, login card dùng toàn bộ chiều rộng phù hợp.

### Các điểm source quan trọng

| Vị trí | Khái niệm IDTS | Ảnh hưởng nếu sai | Phải kiểm tra cùng |
| --- | --- | --- | --- |
| `.idtsLoginShell` | Layout trang login | Login card có thể lệch vị trí hoặc khó dùng. | Root HBox trong `login-page.js` |
| `.idtsLoginCard` | Container card đăng nhập | Input/button có thể nhìn lệch hoặc quá rộng/hẹp. | Panel trong `login-page.js` |
| `.idtsLoginMessage` | Khoảng cách message lỗi | Lỗi validation/auth có thể chồng lên control khác. | MessageStrip trong `login-page.js` |
| `@media (max-width: 48rem)` | Layout mobile | Giao diện phone/tablet có thể vỡ. | Browser smoke responsive |

### Liên kết với folder khác

- Không có dependency trực tiếp tới backend. File này chỉ ảnh hưởng frontend layout.
- File này phụ thuộc gián tiếp vào `login-page.js` vì tên class trong CSS phải khớp class được gắn vào UI5 controls.
- File này liên quan gián tiếp tới `srv/auth.js` ở góc UX: lỗi login an toàn từ backend được hiển thị trong UI controls có styling từ file này.

### Checklist sửa file an toàn

- Giữ class names khớp với `login-page.js`.
- Ưu tiên SAP CSS variables thay vì hardcode màu.
- Không đưa password, token, endpoint, hoặc dữ liệu user vào comment CSS.
- Test desktop và mobile width sau khi đổi layout.
- Nếu đổi spacing message, verify empty-submit và wrong-password display.
