# Knowledge: `srv/user-admin.cds`

`UserAdministrationService` is a separate authenticated CAP boundary for controlled onboarding and access administration. It exposes invitation/verification/search plus `approveProvisioning`, `requestRoleChange`, `requestRevoke`, and `retryAccessOperation`. Every mutating administration action is PM+UserAdmin protected, version checked, and returns only a sanitized request summary. The service intentionally omits token hash, nonce, issuer, subject, leases and provider internals.

Authorization is completed in `srv/user-admin.js`: administration requires both PM and `UserAdmin` plus a matching active internal PM. The verification action accepts a bounded invitation token and requires an authenticated SAP identity, but never asks IDTS to collect an SAP password, OTP, passkey, or recovery code.

Vietnamese: Service nay tach user administration khoi BugService. API quan tri bat buoc PM + UserAdmin; callback chi nhan SAP identity da duoc AppRouter/XSUAA xac thuc. Contract public khong expose token hash, nonce, signing key hoac lock cua worker.
