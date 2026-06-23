# pm-monitoring.cds — Knowledge Mirror

**Source file**: `app/bug-management-ui/annotations/pm-monitoring.cds`
**Last mirrored**: 2026-06-23
**Related task**: IDTS-22

## Purpose

Provides six `@UI.SelectionVariant` presets so PM users can switch between key monitoring slices from the existing Fiori Elements List Report without any custom UI5 module.

## SelectionVariants defined

| Qualifier | Text | Filter | Manifest tab key |
|---|---|---|---|
| `#AllBugs` | All Bugs | (none) | `_tab_AllBugs` |
| `#PendingAssignment` | Pending Assignment | `isPendingAssignment = true` | `_tab_PendingAssignment` |
| `#RejectedFollowUp` | Rejected Follow-up | `isRejectedFollowUp = true` | `_tab_RejectedFollowUp` |
| `#RetestRequired` | Retest Required | `isRetestRequired = true` | `_tab_RetestRequired` |
| `#Overdue` | Overdue | `isOverdue = true` | `_tab_Overdue` |
| `#MyActionItems` | My Action Items | (empty — PM saves personal variant) | `_tab_MyActionItems` |

## Design decisions

- Uses `@UI.SelectionVariant` (not `@UI.SelectionPresentationVariant`) because no custom sort or column configuration per tab is needed.
- `My Action Items` has empty `SelectOptions` — a fully automatic "me" filter requires a UI5 ControllerExtension, deferred per the IDTS lightweight FE strategy. PM sets the filter via the `Next Processor User` filter bar field and saves as a personal Page variant.
- Boolean `@UI.HiddenFilter : false` flags are set in `labels.cds` (not here) to avoid duplicate annotation blocks.

## How tabs are rendered

The tabs are registered in `manifest.json` under `BugsList.settings.views.paths`:

```json
"views": {
  "showCounts": true,
  "paths": [
    { "key": "_tab_AllBugs",           "annotationPath": "...SelectionVariant#AllBugs" },
    { "key": "_tab_PendingAssignment", "annotationPath": "...SelectionVariant#PendingAssignment" },
    ...
  ]
}
```

With 6+ paths, FE V4 automatically renders a **Select control** (drop-down) rather than a segmented button.

## Cross-references

- `app/bug-management-ui/annotations/labels.cds` — `@UI.HiddenFilter : false` for `isOverdue`, `isPendingAssignment`, `isRejectedFollowUp`, `isRetestRequired`
- `app/bug-management-ui/webapp/manifest.json` — `views.paths` + `initialLoad: "Enabled"`
- `app/bug-management-ui/annotations.cds` — hub import `using from './annotations/pm-monitoring'`
- `srv/service.cds` — computed boolean fields on `BugService.Bugs`

## Known limitation

`My Action Items` does not auto-populate the current user's ID. A future UI5 ControllerExtension could inject `nextProcessorUser_ID = $currentUser` at page load.
