# Debug Lab: Authentication and Session

## English

### Goal

Learn how one Sign In click becomes a CAP login action, a stored session, and a protected OData request. This lab must be run locally; never place a real password or bearer token in evidence.

### Safe setup

Run `cds watch` from the repository root. Open `login.html`, enter a known local QA user, and open the browser Network tab. Put a breakpoint at `login` in `srv/auth.js` (line 28), then at `verifyPassword` in `srv/auth/passwords.js`, and finally at the session `INSERT` in `srv/auth.js` (around line 56).

### Expected execution order

1. `app/bug-management-ui/webapp/ext/login/LoginController.js` sends the OData `AuthService.login` action.
2. `srv/auth.js:login` normalizes the email, reads `idts.cap.Users`, and rejects missing, inactive, or unknown users with the same safe 401 message.
3. `verifyPassword` compares the entered password with `passwordHash`; plaintext must never be stored or returned.
4. `createSessionToken` creates the bearer token. Only `hashToken(token)` is inserted into `idts.cap.AuthSessions`.
5. The UI stores only the returned session information needed for later authenticated calls. `srv/auth/custom-auth.js` maps the bearer token back to a user for protected BugService requests.

### Inspect

At the first breakpoint inspect `email`, `password` only while debugging locally, and `user.active`. At the insert breakpoint inspect `user.ID`, `expiresAt`, and confirm the row contains `tokenHash`, not the raw token. After login, inspect the request header of one `/odata/v4/bug/` call: it should carry a Bearer token; do not copy it into a note.

### Failure exercise and teach-back

Try an incorrect password. Explain why the same `Invalid email or password.` response is deliberately used for both a nonexistent user and a wrong password. Then explain what `logout` changes in `AuthSessions`, and why a browser refresh after logout must no longer open the protected app.

## Vietnamese

### Mục tiêu

Học cách một lần bấm Sign In đi từ UI đến CAP login action, lưu session và gọi được OData có bảo vệ. Chỉ chạy lab ở local; không đưa password thật hoặc bearer token vào evidence.

### Chuẩn bị an toàn

Chạy `cds watch` tại root repository. Mở `login.html`, nhập tài khoản QA local đã biết và bật Network trong browser. Đặt breakpoint tại hàm `login` của `srv/auth.js` (dòng 28), tiếp theo là `verifyPassword` trong `srv/auth/passwords.js`, rồi câu `INSERT` session trong `srv/auth.js` (khoảng dòng 56).

### Thứ tự chạy mong đợi

1. `app/bug-management-ui/webapp/ext/login/LoginController.js` gọi OData action `AuthService.login`.
2. `srv/auth.js:login` chuẩn hóa email, đọc `idts.cap.Users`, và từ chối user thiếu, inactive hoặc không tồn tại bằng cùng một lỗi 401 an toàn.
3. `verifyPassword` so sánh mật khẩu nhập với `passwordHash`; không được lưu hoặc trả plaintext password.
4. `createSessionToken` tạo bearer token. Chỉ `hashToken(token)` được insert vào `idts.cap.AuthSessions`.
5. UI chỉ giữ thông tin session cần thiết cho request sau. `srv/auth/custom-auth.js` dùng bearer token để map lại user khi gọi BugService có bảo vệ.

### Cần quan sát

Tại breakpoint đầu, quan sát `email`, `password` chỉ trong local và `user.active`. Tại insert, kiểm tra `user.ID`, `expiresAt`, và xác nhận row có `tokenHash`, không có raw token. Sau login, xem header của một request `/odata/v4/bug/`: phải có Bearer token nhưng không được copy token vào note.

### Bài lỗi và giải thích lại

Thử sai password. Giải thích vì sao user không tồn tại và password sai phải cùng trả `Invalid email or password.`. Sau đó giải thích `logout` thay đổi gì trong `AuthSessions`, và vì sao refresh browser sau logout không được vào app protected.
