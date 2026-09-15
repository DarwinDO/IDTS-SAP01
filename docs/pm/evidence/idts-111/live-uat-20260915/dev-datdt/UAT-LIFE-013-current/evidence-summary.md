# UAT-LIFE-013 — repeated lifecycle action is idempotently rejected

Result: **PASS**.

After the CAP-only rollout of merge commit `64bb215bd1b5b7d83f4d4557e8433874b68e703b`, DatDT started progress on controlled fixture `BUG-0026`. The first request completed through OData batch HTTP `200` and the Bug became `IN_PROGRESS`. The repeated direct `startProgress` request returned HTTP `400` with the safe status-targeted message `Status transition from IN_PROGRESS to IN_PROGRESS is not allowed.`

The current UI readback shows exactly one **Start Progress** history event, status remains `IN_PROGRESS`, the two pre-existing notification rows remain the Pending Assignment and Assigned events, and the single controlled attachment remains present. No duplicate lifecycle history or notification was observed.

- Executor: `NhanT (DonHV support)`.
- Actor: `DatDT` (`DEVELOPER`).
- Deployment: CAP module `idts-sap01-srv` only, blue-green operation `7855cb3b-b104-11f1-840e-eeee0a848ae2`.
- Post-deployment readiness: app `1/1`, health `200`, ready `200`, `DEMO READY`.
- Evidence sources: sanitized CAP router/application logs and current runtime UI readback.
- No database/schema/seed, UI, AppRouter, Drive, workbook, or unrelated source mutation was performed.
