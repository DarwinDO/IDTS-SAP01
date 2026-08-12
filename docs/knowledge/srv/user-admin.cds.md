# Knowledge: `srv/user-admin.cds`

`UserAdministrationService` is a separate authenticated CAP boundary for controlled IDTS onboarding. It exposes `requestOnboarding`, `verifySapIdentity`, and the administration-only `searchOnboarding` action. Search uses POST, returns at most 200 safe summary rows, and avoids placing the entered email query in an OData `$filter` URL. Its read projection and summary type intentionally omit token hash, nonce, issuer, subject, and delivery locks.

Authorization is completed in `srv/user-admin.js`: administration requires both PM and `UserAdmin` plus a matching active internal PM. The verification action accepts a bounded invitation token and requires an authenticated SAP identity, but never asks IDTS to collect an SAP password, OTP, passkey, or recovery code.

Vietnamese: Service nay tach user administration khoi BugService. API quan tri bat buoc PM + UserAdmin; callback chi nhan SAP identity da duoc AppRouter/XSUAA xac thuc. Contract public khong expose token hash, nonce, signing key hoac lock cua worker.
