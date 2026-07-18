# Debug Lab: Authentication and Session

## English

### Goal and mental model

Follow one Sign In click through four boundaries: SAPUI5 form -> HTTP/OData -> CAP handler -> PostgreSQL/SQLite session row. The password is checked once; later protected requests use a bearer token whose hash, not raw value, is stored in `AuthSessions`.

### Step 1 — Prepare safely

1. Start the local application with `cds watch`.
2. Open `/bug-management-ui/webapp/login.html` and Browser DevTools > Network.
3. Use a local QA account. Never copy its password or returned bearer token into screenshots.
4. In VS Code, place breakpoints by symbol, not line number:
   - `app/bug-management-ui/webapp/login-page.js` -> `submitLogin`;
   - `srv/auth.js` -> `login`;
   - `srv/auth/passwords.js` -> `verifyPassword`;
   - `srv/auth.js` -> the `INSERT.into(AuthSessions)` statement;
   - `srv/auth/custom-auth.js` -> exported `idtsCustomAuth` middleware.

### Step 2 — Trigger and identify the request

Click **Sign In**. In Network, select `POST /odata/v4/auth/login`. Its JSON body has `email` and `password`. The first UI breakpoint shows those values before `fetch`; continue until the request reaches CAP.

### Step 3 — Follow the backend in order

1. `srv/auth.js:init` registers `this.on('login', ...)`; CAP dispatches the OData action to `login(req)`.
2. In `login`, inspect normalized `email`, the selected `user`, `user.active`, and `user.passwordHash`. Do not print the password/hash.
3. Step into `verifyPassword(password, storedHash)`. It returns a boolean; it does not persist anything.
4. Back in `login`, `createSessionToken()` creates the raw value returned to this browser. `hashToken(token)` creates the value safe to persist.
5. At `INSERT.into(AuthSessions)`, inspect `user_ID`, `tokenHash`, `expiresAt`, and `revokedAt`. After stepping over it, a session row is the database side effect.
6. The response returns safe user profile, raw session token, and expiry to `login-page.js`; the UI stores them in `sessionStorage` and redirects to the Fiori app.

### Step 4 — Follow the next protected request

After redirect, select a `/odata/v4/bug/...` request. `auth-guard.js` adds `Authorization: Bearer ...`. Break in `idtsCustomAuth`: it hashes the received token, reads `AuthSessions` and `Users`, rejects expired/revoked sessions, then maps the profile to `req.user`. Control then continues to the relevant `BugService` handler.

### Failure exercise

Submit a wrong password. Expected: `401 Invalid email or password.` for both an unknown email and wrong password, no new `AuthSessions` row, and no SQL/stack details in UI. Then log out through the profile menu; `srv/auth.js:logout` revokes the matching row, client storage is cleared, and refresh must return to login.

### Teach-back

Explain: why the same 401 protects account discovery; why only `tokenHash` is stored; and which file converts a later bearer token into the CAP user.

## Vietnamese

### Mục tiêu và mô hình dễ nhớ

Lần theo một lần bấm Sign In qua bốn ranh giới: form SAPUI5 -> HTTP/OData -> CAP handler -> dòng session trong PostgreSQL/SQLite. Password chỉ được kiểm tra lúc login; các request protected sau đó dùng bearer token, nhưng database chỉ giữ hash của token chứ không giữ raw token.

### Bước 1 — Chuẩn bị an toàn

1. Chạy local bằng `cds watch`.
2. Mở `/bug-management-ui/webapp/login.html` và Browser DevTools > Network.
3. Dùng account QA local. Không chụp hoặc copy password/bearer token vào evidence.
4. Trong VS Code, đặt breakpoint theo symbol thay vì line number:
   - `app/bug-management-ui/webapp/login-page.js` -> `submitLogin`;
   - `srv/auth.js` -> `login`;
   - `srv/auth/passwords.js` -> `verifyPassword`;
   - `srv/auth.js` -> câu `INSERT.into(AuthSessions)`;
   - `srv/auth/custom-auth.js` -> middleware export `idtsCustomAuth`.

### Bước 2 — Trigger và nhận diện request

Bấm **Sign In**. Trong Network, chọn `POST /odata/v4/auth/login`. Body JSON có `email` và `password`. Breakpoint UI đầu tiên cho thấy hai giá trị trước khi `fetch`; tiếp tục chạy đến khi request vào CAP.

### Bước 3 — Đi qua backend đúng thứ tự

1. `srv/auth.js:init` đăng ký `this.on('login', ...)`; CAP chuyển OData action vào `login(req)`.
2. Trong `login`, xem `email` đã normalize, `user` được đọc, `user.active` và `user.passwordHash`. Không in password/hash ra log.
3. Step into `verifyPassword(password, storedHash)`. Hàm chỉ trả boolean, không ghi database.
4. Quay lại `login`: `createSessionToken()` tạo raw token trả cho browser; `hashToken(token)` tạo giá trị an toàn để lưu.
5. Tại `INSERT.into(AuthSessions)`, xem `user_ID`, `tokenHash`, `expiresAt`, `revokedAt`. Step over xong thì side effect là database có một session row.
6. Response trả safe user profile, raw session token và expiry về `login-page.js`; UI lưu chúng trong `sessionStorage` rồi redirect sang Fiori app.

### Bước 4 — Đi theo request protected kế tiếp

Sau redirect, chọn một request `/odata/v4/bug/...`. `auth-guard.js` gắn `Authorization: Bearer ...`. Dừng tại `idtsCustomAuth`: middleware hash token nhận được, đọc `AuthSessions` và `Users`, chặn session hết hạn/bị revoke, rồi map profile vào `req.user`. Sau đó quyền xử lý mới chuyển tới handler tương ứng của `BugService`.

### Bài lỗi

Nhập sai password. Kết quả đúng: email không tồn tại và password sai đều nhận `401 Invalid email or password.`, không có session row mới, UI không lộ SQL/stack. Sau đó logout bằng profile menu; `srv/auth.js:logout` revoke row tương ứng, client storage bị xóa và refresh phải quay lại login.

### Teach-back

Giải thích: vì sao dùng chung lỗi 401 để tránh dò account; vì sao database chỉ giữ `tokenHash`; và file nào đổi bearer token của request sau thành CAP user.
