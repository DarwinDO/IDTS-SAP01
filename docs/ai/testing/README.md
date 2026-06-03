---
phase: testing
title: Testing Strategy
description: Define testing approach, test cases, and quality assurance
---

# Testing Strategy

Use this phase to define the smallest reliable verification set for each change.

## Test Coverage Goals

- Match test depth to risk and blast radius.
- Cover backend status transitions and validation in CAP, not only UI behavior.
- Cover Fiori-visible flows manually when automation is not present.
- Record known gaps honestly.

## Unit Tests

- CAP handler validation.
- Formatter or controller extension logic, if custom UI5 code is added.
- Utility logic introduced by the change.

## Integration Tests

- OData action/function behavior.
- Entity create/update/read behavior used by Fiori.
- Comments, history logs, notifications, and assignment side effects.

## End-to-End or Manual Flows

- Create bug report.
- Detect or flag possible duplicate.
- Assign or leave Pending Assignment.
- Developer review and request more information.
- Reject wrong classification or unsuitable assignment.
- Resolve, close, or reopen.
- PM workload and overdue monitoring.

## Test Data

- Minimal local SQLite data.
- No credentials or real private SAP customer data.
- Seed data only when useful and explicitly scoped.

## Verification Commands

- `cds compile srv --to edmx`
- `cds env requires.db`
- `npm audit --omit=dev`
- `npm run watch-bug-management-ui`, when checking Fiori app preview.
- UI5 MCP linter or local UI5 lint command, when custom UI5 changes are made.
- `npx ai-devkit@latest lint --json`, when AI DevKit artifacts change.

## Reporting

- Commands run.
- Pass/fail result.
- Exact error if any.
- Likely cause and concrete next step.
