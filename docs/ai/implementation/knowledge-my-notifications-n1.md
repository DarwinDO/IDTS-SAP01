---
phase: implementation
title: My Notifications N1 implementation knowledge
description: Caller-only notification persistence, service, read state, and dry-run backfill
---

# My Notifications N1 implementation knowledge

## Overview

N1 adds a federated personal inbox index without replacing Bug notifications or access audits. CAP resolves one active aligned internal user before every read or mutation. The implementation is Node.js/CDS with SQLite contract tests and HANA/EDMX compilation.

## Implementation Details

- `db/schema.cds` adds nullable unique Bug `sourceKey`, inbox index/read state, and a future digest delivery snapshot table.
- `srv/notification.cds` exposes two caller-only reads and two read-state actions through a privacy-safe DTO.
- `srv/notification/inbox.js` applies recipient scope before filters/order/page/count, hydrates a page with at most two source reads, and uses optimistic/snapshot read-state updates.
- `scripts/db/backfill-notification-inbox.js` defaults to a non-mutating 30-day Bug-only plan; live `--execute` remains a later migration approval.

## Dependencies

```mermaid
flowchart LR
  N[Bug Notifications] --> I[UserNotificationInboxEntries]
  A[Final access audits] --> I
  U[Resolved active Users identity] --> S[NotificationService]
  S --> I
  I --> H[Bounded source hydration]
  H --> D[Safe NotificationSummary DTO]
```

- Imports: existing `resolveRequestUser`, CAP CQL and managed/cuid aspects.
- Services: dedicated `NotificationService`; no new worker/provider/scheduler.
- Persistence: authoritative Bug/access sources plus recipient/read-state index.

## Visual Diagrams

```mermaid
sequenceDiagram
  participant C as Caller
  participant S as NotificationService
  participant I as Inbox index
  participant B as Bug/access sources
  C->>S: search(category, readState, skip, top)
  S->>S: resolve active aligned internal user
  S->>I: recipient-scoped bounded page
  S->>B: max one Bug read + one access read
  S-->>C: safe DTO rows
```

## Additional Insights

- Security: audit detail is never selected for the public DTO; access copy is event-allowlisted.
- Concurrency: a repeated already-read version is idempotent; an unread stale version returns 409.
- Performance: stable server order and two-source-read ceiling avoid client sorting and N+1 hydration.
- Scope: no UI, event producer, email policy, digest scheduler, migration or deployment is part of N1.

## Metadata

- Date: 2026-08-27
- Analysis depth: service, source model, authorization helpers, persistence and QA boundaries
- Main files: `db/schema.cds`, `srv/notification.cds`, `srv/notification.js`, `srv/notification/inbox.js`, `scripts/db/backfill-notification-inbox.js`

## Next Steps

- Complete the exact-head source/security review.
- Create one Draft N1 PR only if required severities are zero.
- Keep migration/backfill execution and N2 UI behind later approvals.
