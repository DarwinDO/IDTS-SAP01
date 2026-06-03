# Definition of Done

Last updated: 2026-05-28

## Global Definition of Done

A change is done when:

- It satisfies a documented requirement or explicit user request.
- It stays within IDTS MVP scope.
- Relevant canonical docs, BA docs, PM docs, diagrams, or knowledge notes are updated when business meaning changes.
- Verification commands have been run and results are recorded.
- No credentials, private endpoints, service keys, or local environment files are added.

## CAP Data Model Done

- Entities, associations, compositions, enums, and aspects match the BA data dictionary.
- Lifecycle-owned bug data uses compositions where appropriate.
- Reusable master data uses associations.
- Names are clear and consistent with project terminology.
- `cds compile srv --to edmx` passes.

## CAP Service Done

- Service projections expose only the intended entities.
- Value helps support SAP Module, Application Component, Defect Category, assignee, and nextProcessor selection where needed.
- Actions/functions are scoped to real user actions, not generic workflow expansion.
- OData V4 metadata is compile-ready.

## CAP Handler Done

- Business-critical validations run in backend logic.
- Status transitions follow the status transition matrix.
- Assignment logic uses Developer Responsibility.
- nextProcessor is updated automatically on key actions.
- Rejected transitions require rejection reason, nextProcessor, notification/history impact, and a valid follow-up path.
- Important changes create history logs.
- Errors are understandable and suitable for Fiori message handling.

Vietnamese:

- Các transition sang `Rejected` phải bắt buộc có lý do reject, nextProcessor, ảnh hưởng notification/history và đường follow-up hợp lệ.

## Fiori/UI5 Done

- Fiori Elements is preferred before custom UI5.
- List Report/Object Page support the core user flow.
- Required fields, value helps, and dependent selection work as expected.
- Status semantic colors match the documented meaning.
- Validation issues use inline value states, message popover, or suitable Fiori messages.
- User-facing text is i18n-ready where applicable.

## PM and Documentation Done

- `docs/pm/current-status.md` is updated for handover.
- The relevant member-owned `docs/pm/status/*.md` file is updated.
- The relevant `docs/pm/tasks/*.md` file is updated.
- `risk-decision-log.md` is updated for durable decisions or risks.
- Canonical business files are updated only when business meaning changes.

Vietnamese:

- `docs/pm/current-status.md` được cập nhật khi cần handover.
- File status theo thành viên trong `docs/pm/status/*.md` được cập nhật.
- File task tương ứng trong `docs/pm/tasks/*.md` được cập nhật.
- `risk-decision-log.md` được cập nhật cho decision hoặc risk bền vững.
- Canonical business files chỉ được cập nhật khi ý nghĩa nghiệp vụ thay đổi.
