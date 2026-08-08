# Developer capacity helper / Helper capacity Developer

## English

Primary owner: DonHV. Backup: NhanT. Flow owners: SangVN for assignment and DatDT for Dashboard monitoring.

`capacity.js` derives effective availability from manual availability plus assigned Bugs whose status is not `Closed`: 0-1 Available, 2 Busy, and 3+ Unavailable. Manual Unavailable always wins. The helper reads counts but never persists an aggregate or changes a Bug.

Debug `effectiveCapacity` for boundary errors and `readOpenOwnedBugCounts` when `Rejected`/`Closed` counting is wrong. Check changes with assignment validation, read models, AI explanation, and capacity/workload tests.

## Tiếng Việt

Owner chính: DonHV. Backup: NhanT. Flow owner: SangVN cho assignment và DatDT cho Dashboard monitoring.

`capacity.js` tính effective availability từ availability thủ công và các Bug còn assignee có status khác `Closed`: 0-1 Available, 2 Busy, từ 3 là Unavailable. Manual Unavailable luôn được ưu tiên. Helper chỉ đọc count, không persist aggregate và không sửa Bug.

Debug `effectiveCapacity` khi sai boundary và `readOpenOwnedBugCounts` khi đếm sai `Rejected`/`Closed`. Kiểm tra cùng assignment validation, read models, AI explanation và test capacity/workload.

## Metadata

- Source: `srv/bug-service/capacity.js`
- Last reviewed: 2026-08-08
