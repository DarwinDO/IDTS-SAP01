# 06 - Notification, Audit, and PM Monitoring

## Submit Bug and Notification Sequence

```mermaid
sequenceDiagram
    actor Tester as Tester
    participant UI as Fiori App
    participant CAP as CAP OData Service
    participant DB as Database
    participant Notify as Notification Adapter
    actor Dev as Developer
    actor PM as Project Manager

    Tester->>UI: Enter bug details and submit
    UI->>CAP: Create bug request
    CAP->>CAP: Validate required fields and assignment choice

    alt Developer selected
        CAP->>DB: Save bug with status Assigned
        CAP->>DB: Write history log: Create + Assign
        CAP->>Notify: Create Bug Assigned notification
        Notify-->>Dev: Notify assigned developer
    else No suitable developer
        CAP->>DB: Save bug with status Pending Assignment
        CAP->>DB: Write history log: Create + Pending Assignment
        CAP->>Notify: Create Pending Assignment notification
        Notify-->>PM: Notify or expose for monitoring
    end

    CAP-->>UI: Return created bug
    UI-->>Tester: Show created bug and current status
```

## Developer Review Notification Sequence

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant UI as Fiori App
    participant CAP as CAP OData Service
    participant DB as Database
    participant Notify as Notification Adapter
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
        CAP->>Notify: Create information request notification
        Notify-->>Tester: Notify tester
    else Wrong classification or assignee
        Dev->>UI: Reject bug
        UI->>CAP: Update status to Rejected
        CAP->>DB: Save rejection reason, nextProcessor, and history log
        CAP->>Notify: Create rejection notification
        Notify-->>Tester: Notify tester
        Notify-->>PM: Notify PM if escalation rule applies
    else Valid bug
        Dev->>UI: Move to In Progress or Resolved
        UI->>CAP: Update status and developer note
        CAP->>DB: Save status, note, and history log
        CAP->>Notify: Create status update notification
        Notify-->>Tester: Notify tester
    end
```

## PM Monitoring and Escalation Flow

```mermaid
flowchart TD
    A["PM opens dashboard/report"] --> B["System loads bug list, status,\npriority, severity, assignee,\ncreated date, updated date, due date"]
    B --> C["System derives workload per developer"]
    B --> D["System identifies overdue or stale bugs"]
    B --> E["System identifies long Pending Assignment bugs"]

    C --> F{"Workload concern?"}
    D --> G{"Overdue concern?"}
    E --> H{"Assignment concern?"}

    F -->|"No"| I["PM continues monitoring"]
    G -->|"No"| I
    H -->|"No"| I

    F -->|"Yes"| J["PM comments or requests reassignment"]
    G -->|"Yes"| K["System or PM triggers escalation notification"]
    H -->|"Yes"| L["PM asks Tester to assign developer"]

    J --> M["History log records PM action/comment"]
    K --> M
    L --> M
    M --> N["Tester reassigns or updates bug if needed"]
```

## Audit Rules Represented

- Create bug, edit bug, assign, reassign, status change, comment, evidence upload, request more information, reject, close, and reopen should create history logs.
- Each history log should capture actor, role, timestamp, action type, old value, new value, and reason when available.
- Notification is separate from history. A notification may fail to deliver, but the business action should still be logged.
- Rejected notifications must make the follow-up owner clear. Rejected is not a terminal state.

Vietnamese:

- Notification khi bug bị Rejected phải làm rõ ai là người follow-up tiếp theo. Rejected không phải trạng thái kết thúc.
