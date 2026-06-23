# Knowledge: `app/bug-management-ui/webapp/test/integration/BugsListJourney.js`

## English

### What this file is for

OPA5 journey test that exercises the main List Report flows for Bugs: starting the app, navigating to the list, and basic teardown.

### IDTS flow covered

Simulates a user opening the bug list report. This is the entry point for Tester and PM.

Tests that the app loads the OData service and renders the List Report configured in manifest + list-report annotations.

### Important concepts

- Uses JourneyRunner and the BugsList page object.
- Verifies basic navigation and app startup.
- Part of the regression suite for the core happy flow.

### Cross-folder links

- manifest.json (routing)
- List Report annotations
- OPA page object BugsList.js
- Backend service (data must be loadable)

## Vietnamese

### File này dùng để làm gì

Test OPA5 mô phỏng flow chính trên List Report của Bugs.

### Flow IDTS

Kiểm tra app khởi động và hiển thị danh sách bug.

### Liên kết

manifest, annotation list-report, page object, backend.

## Metadata

- Source file: `app/bug-management-ui/webapp/test/integration/BugsListJourney.js`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/test/integration/BugsListJourney.js.md`
- Source layer: `app`
- Last reviewed: 2026-06-22