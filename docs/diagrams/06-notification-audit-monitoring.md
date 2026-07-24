# 06 - Notification, Audit, and PM Monitoring

## Submit Bug and Notification Sequence

```mermaid
sequenceDiagram
    actor Tester as Tester
    participant UI as Fiori App
    participant CAP as CAP OData Service
    participant DB as Database
    participant Outbox as Notifications + Email Outbox
    participant Worker as Email Worker / Provider
    actor Dev as Developer
    actor PM as Project Manager

    Tester->>UI: Enter bug details and submit
    UI->>CAP: Create bug request
    CAP->>CAP: Validate required fields and assignment choice

    alt Developer selected
        CAP->>DB: Save bug with status Assigned
        CAP->>DB: Write history log: Create + Assign
        CAP->>Outbox: Persist in-app SENT event + email delivery row
        Outbox-->>Dev: In-app notification available
    else No suitable developer
        CAP->>DB: Save bug with status Pending Assignment
        CAP->>DB: Write history log: Create + Pending Assignment
        CAP->>Outbox: Persist in-app SENT event + email delivery row
        Outbox-->>PM: In-app notification / monitoring item available
    end

    CAP-->>UI: Return created bug
    UI-->>Tester: Show created bug and current status

    opt Email enabled and configuration complete
        Worker->>Outbox: Claim committed PENDING / retryable FAILED row
        Worker->>Worker: Send through configured SMTP or Brevo provider
        alt Provider accepts message
            Worker->>Outbox: Mark delivery SENT
        else Provider fails
            Worker->>Outbox: Mark FAILED and schedule bounded retry
            Note over Worker,Outbox: Email failure never rolls back the committed bug workflow
        end
    end
```

## Developer Review Notification Sequence

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant UI as Fiori App
    participant CAP as CAP OData Service
    participant DB as Database
    participant Outbox as Notifications + Email Outbox
    participant Worker as Email Worker / Provider
    actor Tester as Tester
    actor PM as Project Manager

    Dev->>UI: Open assigned bug
    UI->>CAP: Read bug details, comments, history
    CAP->>DB: Fetch bug context
    DB-->>CAP: Return data
    CAP-->>UI: Show bug details

    alt Need more information
        Dev->>UI: Request more information
        UI->>CAP: Update status to Need More Information
        CAP->>DB: Save status and history log
        CAP->>Outbox: Persist information-request event + email delivery row
        Outbox-->>Tester: In-app notification available
    else Wrong classification or assignee
        Dev->>UI: Reject bug
        UI->>CAP: Update status to Rejected
        CAP->>DB: Save rejection reason, nextProcessor, and history log
        CAP->>Outbox: Persist rejection event + email delivery row
        Outbox-->>Tester: In-app notification available
        Outbox-->>PM: Monitoring/escalation event when applicable
    else Valid bug
        Dev->>UI: Move to In Progress or Resolved
        UI->>CAP: Update status and developer note
        CAP->>DB: Save status, note, and history log
        CAP->>Outbox: Persist status event + email delivery row
        Outbox-->>Tester: In-app notification available
    end

    opt Email enabled and configuration complete
        Worker->>Outbox: Claim committed PENDING / retryable FAILED rows
        Worker->>Worker: Send through configured SMTP or Brevo provider
        Worker->>Outbox: Mark SENT or FAILED and schedule bounded retry if eligible
        Note over CAP,Worker: Provider outcome is asynchronous and cannot roll back the lifecycle transaction
    end
```

## PM Monitoring and Escalation Flow

```mermaid
flowchart TD
    A["PM opens dashboard/report"] --> B["System loads bug list, status,\npriority, severity, assignee,\ncreated date, updated date, due date"]
    B --> C["System derives workload per developer"]
    B --> D["Derived fields expose overdue and action-owner state"]
    B --> E["PM filters Pending Assignment and rejected follow-up items"]

    C --> F{"Workload concern?"}
    D --> G{"Overdue or stale concern?"}
    E --> H{"Assignment concern?"}

    F -->|"No"| I["PM continues monitoring"]
    G -->|"No"| I
    H -->|"No"| I

    F -->|"Yes"| J["PM comments or coordinates reassignment"]
    G -->|"Yes"| K["PM manually follows up or coordinates action"]
    H -->|"Yes"| L["PM or Tester uses a supported assignment action"]

    J --> M["History records the PM comment or workflow action"]
    K --> M
    L --> M
    M --> N["Assignment/status actions create the normal\nin-app notification and email outbox row"]
    D -. "Future only" .-> O["Scheduled overdue/stale escalation\nis not implemented in the current runtime"]
```

## Audit Rules Represented

- Create bug, edit bug, assign, reassign, status change, comment, evidence upload, request more information, reject, close, and reopen should create history logs.
- Each history log should capture actor, role, timestamp, action type, old value, new value, and reason when available.
- Notification is separate from history. A notification may fail to deliver, but the business action should still be logged.
- `Notifications` is the persisted in-app source event. `NotificationDeliveries` is the separate email outbox; disabled/incomplete email configuration produces `SKIPPED`, while provider failure produces `FAILED` with bounded retry metadata.
- The CAP worker processes only committed outbox rows. SMTP/Brevo credentials and raw provider errors are not exposed through public OData.
- Rejected notifications must make the follow-up owner clear. Rejected is not a terminal state.

Vietnamese:

- Notification khi bug bị Rejected phải làm rõ ai là người follow-up tiếp theo. Rejected không phải trạng thái kết thúc.
