# Knowledge: `srv/auth/platform-role.js`

## Purpose

This helper keeps SAP BTP authorization and the existing IDTS business profile consistent. XSUAA proves the platform identity and scopes; `idts.cap.Users` remains the business record used by ownership, history and notification logic.

Helper này giữ phân quyền SAP BTP và business profile IDTS nhất quán. XSUAA xác nhận platform identity/scope; `idts.cap.Users` vẫn là business record dùng cho ownership, history và notification.

## Flow

1. `isXsuaaRuntime()` reads the effective CAP auth profile. A custom middleware implementation means local/Render mode even if another profile contributed XSUAA defaults.
2. `platformBusinessRoles()` checks only `TESTER`, `DEVELOPER` and `PM`.
3. `enforcePlatformRoleAlignment()` rejects zero/multiple roles or a role different from `Users.role_code`.
4. The validated user continues to `AuthService.me()` or the BugService handler.

## Breakpoints and failure paths

- Break at `isXsuaaRuntime()` when Render unexpectedly behaves like BTP.
- Break at `platformBusinessRoles()` when a role collection was assigned but CAP does not see it.
- Break at `enforcePlatformRoleAlignment()` when login succeeds but IDTS returns 403.
- Never log the JWT or XSUAA service credential.

## Safe changes

Add a business role here only together with `xs-security.json`, IDTS role catalogs, permission tests and knowledge updates. Do not silently choose one role when multiple roles are present.

## Ownership

- Primary owner: DonHV
- Backup: NhanT
- Last reviewed: 2026-07-28
