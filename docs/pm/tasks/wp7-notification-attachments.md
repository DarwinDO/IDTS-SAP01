# WP7 - Notifications and Attachments

Status: Ready after WP1 and WP3
Owner workstream: Backend CAP / Fiori UI5
Last updated: 2026-06-01

## Goal

Support MVP notification records and attachment metadata without hardcoding external delivery or storage services.

## Inputs

- WP1 `Notifications` and `Attachments` metadata entities.
- WP3 handler events.
- WP4 object page layout.

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| WP7-T01 | Create notification records for important assignment/status events. | Ready after WP3 |
| WP7-T02 | Create notification records for Rejected bugs that identify the follow-up owner or queue. | Ready after WP3 |
| WP7-T03 | Display notification records where useful for users or PM. | Ready after WP4 |
| WP7-T04 | Support attachment metadata display and entry. | Ready after WP4 |
| WP7-T05 | Keep external delivery/storage integration out of MVP unless separately approved. | Ready after WP3 |

## Definition of Done

- Important events can create in-app notification records.
- Attachment metadata exists without committing private storage endpoints or credentials.
- Rejected notifications make the next responsible person or queue clear.

Vietnamese:

- Notification cho bug `Rejected` phải giúp Tester hoặc PM biết họ cần follow-up, không chỉ thông báo rằng Developer đã reject.
