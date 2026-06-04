# 08 - FRS Functional Workflows

This file centralizes the workflow diagrams embedded in the FRS so the diagram pack can be reviewed independently from the formal specification documents.

Vietnamese: File này tập trung các workflow diagram đang được nhúng trong FRS để có thể review bộ diagram độc lập với tài liệu đặc tả chính thức.

## Main Defect Tracking Flow

```mermaid
flowchart TD
    A["Tester detects defect"] --> B["Search similar bugs"]
    B --> C{"Similar bug exists?"}
    C -->|"Open"| D["Follow or update existing bug"]
    C -->|"Closed"| E["Reopen or update existing bug if authorized"]
    C -->|"No"| F["Create new bug report"]
    F --> G["Classify by SAP Module, Application Component, Defect Category"]
    G --> H["Filter Developer candidates"]
    H --> I{"Suitable Developer selected?"}
    I -->|"Yes"| J["Submit as Assigned"]
    I -->|"No"| K["Submit as Pending Assignment"]
    J --> L["Developer reviews"]
    K --> M["PM or Tester monitors queue"]
    L --> N{"Review result"}
    N -->|"Missing info"| O["Need More Information"]
    N -->|"Wrong classification or assignee"| P["Rejected with follow-up"]
    N -->|"Valid"| Q["In Progress then Resolved"]
    Q --> R["Retest Required when needed"]
    R --> S{"Retest result"}
    S -->|"Passed"| T["Closed"]
    S -->|"Failed"| U["Reopened"]
    P --> V["Tester or PM corrects and reassigns"]
    O --> W["Tester adds information"]
    W --> L
    V --> H
    U --> H
```

## Rejected Follow-up Flow

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant UI as Fiori Object Page
    participant CAP as CAP Service
    participant DB as Database
    actor Owner as Follow Up Owner

    Dev->>UI: Choose Reject
    UI->>Dev: Request rejection reason
    Dev->>UI: Enter reason and confirm
    UI->>CAP: Reject bug request
    CAP->>CAP: Validate assigned developer and allowed status
    CAP->>DB: Save status Rejected, reason, nextProcessor
    CAP->>DB: Write history log
    CAP->>DB: Create notification record
    CAP-->>UI: Return rejected bug
    Owner->>UI: Review rejected bug
    Owner->>UI: Correct classification, add info, or choose assignee
    UI->>CAP: Reassign or move to Pending Assignment
    CAP->>DB: Save follow-up action and history
```

## Status Lifecycle

```mermaid
stateDiagram-v2
    [*] --> New
    New --> Assigned
    New --> Pending_Assignment
    Pending_Assignment --> Assigned
    Assigned --> In_Review
    Assigned --> Rejected
    In_Review --> Need_More_Information
    Need_More_Information --> In_Review
    In_Review --> In_Progress
    In_Review --> Rejected
    In_Progress --> Resolved
    Resolved --> Retest_Required
    Resolved --> Closed
    Retest_Required --> Closed
    Retest_Required --> Reopened
    Resolved --> Reopened
    Closed --> Reopened
    Reopened --> Assigned
    Rejected --> Assigned
    Rejected --> Pending_Assignment
    Closed --> [*]
```

## Bug Creation and Assignment Activity Flow

```mermaid
flowchart TD
    A["Start bug creation"] --> B["Enter bug details"]
    B --> C["Search existing bugs"]
    C --> D{"Use existing bug?"}
    D -->|"Open existing bug"| E["Follow or comment on existing bug"]
    D -->|"Closed existing bug"| F["Reopen or update existing bug if authorized"]
    D -->|"Create new"| G["Select classification"]
    G --> H["Resolve Component Category"]
    H --> I["Filter Developer candidates"]
    I --> J{"Developer selected?"}
    J -->|"Yes"| K["Set assignee"]
    K --> L["Submit as Assigned"]
    J -->|"No"| M["Choose No suitable developer"]
    M --> N["Submit as Pending Assignment"]
    L --> O["Write create and assign history"]
    N --> P["Write create and pending history"]
    O --> Q["Create notification record"]
    P --> Q
    Q --> R["End"]
```

## Developer Review Decision Flow

```mermaid
flowchart TD
    A["Developer opens assigned bug"] --> B["Review details, evidence, comments, and history"]
    B --> C{"Can process bug?"}
    C -->|"Missing information"| D["Request More Information"]
    D --> E["Status: Need More Information"]
    E --> F["Tester adds information"]
    F --> B
    C -->|"Wrong classification or assignee"| G["Reject with reason"]
    G --> H["Status: Rejected"]
    H --> I["Follow Up Owner corrects and reassigns"]
    I --> B
    C -->|"Valid"| J["Start review"]
    J --> K["Move to In Progress"]
    K --> L["Add developer note"]
    L --> M["Mark Resolved"]
```

## Request More Information Flow

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant UI as Fiori Object Page
    participant CAP as CAP Service
    participant DB as Database
    actor Tester as Tester

    Dev->>UI: Request more information
    UI->>Dev: Ask for required reason
    Dev->>UI: Submit reason
    UI->>CAP: Change status to Need More Information
    CAP->>CAP: Validate assigned developer and reason
    CAP->>DB: Save status and nextProcessor
    CAP->>DB: Write history log
    CAP->>DB: Create notification record
    Tester->>UI: Add missing information
    UI->>CAP: Return bug to Assigned or In Review
    CAP->>DB: Save update and history
```

## Resolve, Retest, Close, and Reopen Flow

```mermaid
flowchart TD
    A["Developer marks Resolved"] --> B["System sets nextProcessor to Tester or PM"]
    B --> C{"Verification needed?"}
    C -->|"Yes"| D["Move to Retest Required"]
    D --> E{"Retest result"}
    E -->|"Passed"| F["Close bug"]
    E -->|"Failed"| G["Reopen bug"]
    C -->|"No and accepted"| F
    G --> H["Update information or assignment"]
    H --> I["Return to Assigned"]
    F --> J["Clear nextProcessor"]
    J --> K["Write history and notification records"]
```

## PM Monitoring and Escalation Flow

```mermaid
flowchart TD
    A["PM opens monitoring view"] --> B["Filter by status, priority, severity, module, component, assignee, nextProcessor, and due date"]
    B --> C["Review workload by Developer"]
    B --> D["Review Pending Assignment queue"]
    B --> E["Review Rejected Follow-up queue"]
    B --> F["Review Overdue and stale bugs"]
    C --> G{"Action needed?"}
    D --> G
    E --> G
    F --> G
    G -->|"No"| H["Continue monitoring"]
    G -->|"Yes"| I["Comment or request reassignment"]
    I --> J{"PM direct reassignment approved?"}
    J -->|"Yes"| K["PM reassigns to valid Developer"]
    J -->|"No"| L["Tester performs reassignment"]
    K --> M["Write history and notification records"]
    L --> M
```

## Notes

- These diagrams are intentionally close to FRS wording for traceability.
- Some concepts overlap with earlier BA diagrams, but the exact FRS versions are kept here for formal specification alignment.

Vietnamese:

- Các diagram này được giữ gần với wording trong FRS để dễ trace.
- Một số khái niệm có thể trùng với diagram BA trước đó, nhưng bản FRS exact được giữ ở đây để đồng bộ với tài liệu đặc tả chính thức.
