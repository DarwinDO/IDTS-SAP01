// AuthService tách login/session khỏi BugService. CDS chỉ khai báo request/response;
// `srv/auth.js` verify password, tạo/revoke session và không expose hash/credential.
using idts.cap as db from '../db/schema';

service AuthService {
  // AuthUser là profile public an toàn; không chứa passwordHash, tokenHash hay internal session row.
  type AuthUser {
    ID          : UUID;
    displayName : String(120);
    email       : String(255);
    role_code   : String(40);
    roleName    : String(120);
    canAdministerUsers : Boolean;
  }

  type LoginResult {
    // Raw bearer token chỉ xuất hiện trong response login này; server database chỉ lưu token hash.
    token     : String(120);
    tokenType : String(20);
    expiresAt : Timestamp;
    user      : AuthUser;
  }

  // Login là public để user lấy token; logout/me yêu cầu middleware xác thực token trước.
  action login(email: String(255), password: String(255)) returns LoginResult;

  @requires: 'authenticated-user'
  action logout() returns Boolean;

  @requires: 'authenticated-user'
  function me() returns AuthUser;
}
