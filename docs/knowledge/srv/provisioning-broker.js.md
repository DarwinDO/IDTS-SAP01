# Knowledge: `srv/provisioning-broker.js`

## English

After the external provider confirms the exact DEVELOPER Role Collection, CAP materializes the desired Developer Profile and responsibilities in the same transaction that activates the User and onboarding request. Missing desired data aborts local completion, so `ACTIVE` cannot be written with an incomplete Developer. Role change or revoke away from DEVELOPER deactivates the profile and responsibilities without changing existing Bug assignees.

## Tiếng Việt

Sau khi external provider xác nhận đúng Role Collection DEVELOPER, CAP materialize Developer Profile và responsibilities mong muốn trong cùng transaction kích hoạt User và onboarding request. Thiếu desired data sẽ chặn local completion, nên không thể ghi `ACTIVE` cho Developer chưa đủ profile. Đổi role hoặc revoke khỏi DEVELOPER sẽ deactivate profile và responsibilities nhưng không đổi assignee của Bug hiện có.
