# IDTS-100 Shared QA attachment deletion verification

- Environment: Render Shared QA.
- Source bug: `BUG-0013` (`1cb269fa-c2fa-421e-bd6d-23d6e415113e`).
- Attachment ID: `6a791205-47e7-424a-b407-4d139a3d7c24`.
- Pre-delete download: HTTP `200`.
- Pre-delete SHA-256 previously verified after redeploy: `82a9c333284b792cff526add07df5ad4b5594aa120be718d86e076c23a8b832d`.
- Delete request: HTTP `204`.
- Post-delete download: HTTP `404` with a safe generic `Not Found` response.

Result: PASS. PostgreSQL metadata and the S3-backed object were removed through the supported attachment navigation endpoint. No credential, token, private database URL, or private recipient address is included in this evidence.
