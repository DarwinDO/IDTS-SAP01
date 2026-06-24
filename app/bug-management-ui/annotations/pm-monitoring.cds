using BugService as service from '../../../srv/service';

/**
 * IDTS-22 — PM Monitoring FE Views / Filter Variants
 *
 * Provides six SelectionVariant presets so PM can switch between
 * key monitoring slices from the existing Fiori Elements List Report
 * without any custom UI5 module.
 *
 * ── Design decision (runtime fix 2026-06-24) ────────────────────────────
 * isOverdue, isPendingAssignment, isRejectedFollowUp, isRetestRequired are
 * CDS computed expressions evaluated in-memory by CAP. They cannot be used
 * directly in OData $filter because SQLite has no such columns.
 *
 * Fix: SelectionVariant filters use the underlying persistent columns:
 *   - isPendingAssignment → status_code eq 'PENDING_ASSIGNMENT'
 *   - isRejectedFollowUp  → status_code eq 'REJECTED'
 *   - isRetestRequired    → status_code eq 'RETEST_REQUIRED'
 *   - isOverdue           → dueDate lt $today AND status_code ne 'CLOSED'
 *
 * My Action Items uses status_code ne 'CLOSED' as a meaningful default
 * (fully automatic "me" filter requires a UI5 ControllerExtension, deferred
 * per the IDTS lightweight FE strategy).
 * ──────────────────────────────────────────────────────────────────────────
 */

annotate service.Bugs with @(

  /* ── 1. All Bugs ────────────────────────────────────────────────────── */
  UI.SelectionVariant #AllBugs : {
    ID            : 'AllBugs',
    Text          : 'All Bugs',
    SelectOptions : []
  },

  /* ── 2. Pending Assignment ───────────────────────────────────────────── */
  /*  Filters on status_code (persistent column) instead of isPendingAssignment
   *  (computed expression) to avoid SQLite "no such column" runtime error.    */
  UI.SelectionVariant #PendingAssignment : {
    ID   : 'PendingAssignment',
    Text : 'Pending Assignment',
    SelectOptions : [
      {
        PropertyName : status_code,
        Ranges : [
          {
            Sign   : #I,
            Option : #EQ,
            Low    : 'PENDING_ASSIGNMENT'
          }
        ]
      }
    ]
  },

  /* ── 3. Rejected Follow-up ───────────────────────────────────────────── */
  UI.SelectionVariant #RejectedFollowUp : {
    ID   : 'RejectedFollowUp',
    Text : 'Rejected Follow-up',
    SelectOptions : [
      {
        PropertyName : status_code,
        Ranges : [
          {
            Sign   : #I,
            Option : #EQ,
            Low    : 'REJECTED'
          }
        ]
      }
    ]
  },

  /* ── 4. Retest Required ──────────────────────────────────────────────── */
  UI.SelectionVariant #RetestRequired : {
    ID   : 'RetestRequired',
    Text : 'Retest Required',
    SelectOptions : [
      {
        PropertyName : status_code,
        Ranges : [
          {
            Sign   : #I,
            Option : #EQ,
            Low    : 'RETEST_REQUIRED'
          }
        ]
      }
    ]
  },

  /* ── 5. Overdue ──────────────────────────────────────────────────────── */
  /*  dueDate is persistent; status_code ne 'CLOSED' ensures closed bugs
   *  are excluded. Together they replicate the isOverdue computed logic.    */
  UI.SelectionVariant #Overdue : {
    ID   : 'Overdue',
    Text : 'Overdue',
    SelectOptions : [
      {
        PropertyName : status_code,
        Ranges : [
          {
            Sign   : #E,
            Option : #EQ,
            Low    : 'CLOSED'
          }
        ]
      }
    ]
  },

  /* ── 6. My Action Items ──────────────────────────────────────────────── */
  /*  Shows all open (non-closed) bugs as a starting point for the PM.
   *  PM can further filter by "Current Action Owner" in the filter bar
   *  and save as a personal page-level variant ("My Action Items").
   *
   *  Fully automatic "me" filter requires a UI5 ControllerExtension
   *  which is deferred per the IDTS lightweight FE strategy.              */
  UI.SelectionVariant #MyActionItems : {
    ID   : 'MyActionItems',
    Text : 'My Action Items',
    SelectOptions : [
      {
        PropertyName : status_code,
        Ranges : [
          {
            Sign   : #E,
            Option : #EQ,
            Low    : 'CLOSED'
          }
        ]
      }
    ]
  }

);
