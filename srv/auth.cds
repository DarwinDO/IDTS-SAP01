using idts.cap as db from '../db/schema';

service AuthService {
  type AuthUser {
    ID          : UUID;
    displayName : String(120);
    email       : String(255);
    role_code   : String(40);
    roleName    : String(120);
  }

  type LoginResult {
    token     : String(120);
    tokenType : String(20);
    expiresAt : Timestamp;
    user      : AuthUser;
  }

  action login(email: String(255), password: String(255)) returns LoginResult;

  @requires: 'authenticated-user'
  action logout() returns Boolean;

  @requires: 'authenticated-user'
  function me() returns AuthUser;
}
