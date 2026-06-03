# 01 - System Context and SAP Architecture

## System Context

This context diagram shows who uses IDTS and which external channels may be connected later.

```mermaid
flowchart LR
    Tester["Tester"]
    Developer["Developer"]
    PM["Project Manager"]

    IDTS["Issue and Defect Tracking System in SAP"]

    NotificationChannels["Notification Channels\nEmail / Teams / Slack / Telegram / SAP BTP service"]
    FutureDB["Future Deployment Database\nSAP HANA Cloud or PostgreSQL"]

    Tester -->|"Create, update, assign, retest, comment, track"| IDTS
    Developer -->|"Review assigned bugs, request info, reject, update status, comment"| IDTS
    PM -->|"Monitor workload, overdue bugs, history, reports, escalation"| IDTS

    IDTS -->|"Send important events"| NotificationChannels
    IDTS -->|"Persist business data when deployed"| FutureDB
```

## SAP CAP/Fiori Architecture

This architecture diagram maps the current SAP technical direction without adding unsupported scope.

```mermaid
flowchart TB
    subgraph Browser["User Browser"]
        FioriApp["Fiori Elements / SAPUI5 App\napp/bug-management-ui"]
    end

    subgraph CAP["SAP CAP Node.js Backend"]
        OData["OData V4 Service\nsrv/service.cds"]
        Handlers["CAP Handlers and Validations\nsrv/*.js when added"]
        Model["CDS Domain Model\ndb/schema.cds"]
    end

    subgraph Data["Data Persistence"]
        SQLite["SQLite\nLocal development"]
        DeployDB["HANA Cloud or PostgreSQL\nFuture deployment"]
    end

    subgraph OptionalAdapters["Optional Integration Adapters"]
        Notify["Notification Adapter\nSAP BTP or third-party"]
        Auth["Authentication / Authorization\nXSUAA later if required"]
    end

    FioriApp -->|"OData V4 calls"| OData
    OData --> Handlers
    OData --> Model
    Handlers --> Model
    Model --> SQLite
    Model -. "portable CAP model" .-> DeployDB
    Handlers -. "important events" .-> Notify
    FioriApp -. "role-aware access later" .-> Auth
    OData -. "role checks later" .-> Auth
```

## Architecture Notes

- Current implementation is intentionally small: `Bugs` is exposed through `BugService`.
- Future entities should be added only when they support documented IDTS scope.
- Backend validation should live in CAP, not only in the UI.
- Fiori Elements should be preferred before custom SAPUI5 code.
