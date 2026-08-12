# Knowledge: `srv/user-admin.cds`

`UserAdministrationService` is a separate authenticated CAP boundary for controlled IDTS onboarding. It exposes two actions: `requestOnboarding` and `verifySapIdentity`. Its read projection intentionally omits token hash, nonce, issuer, and delivery locks.

Authorization is completed in `srv/user-admin.js`: administration requires both PM and `UserAdmin` plus a matching active internal PM. The verification action accepts a bounded invitation token and requires an authenticated SAP identity, but never asks IDTS to collect an SAP password, OTP, passkey, or recovery code.

Vietnamese: Service nay tach user administration khoi BugService. API quan tri bat buoc PM + UserAdmin; callback chi nhan SAP identity da duoc AppRouter/XSUAA xac thuc. Contract public khong expose token hash, nonce, signing key hoac lock cua worker.
