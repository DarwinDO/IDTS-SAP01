using BugService as service from '../../../srv/service';

/**
 * IDTS-22 — PM Monitoring FE Views / Filter Variants
 *
 * Provides six SelectionVariant presets so PM can switch between
 * key monitoring slices from the existing Fiori Elements List Report
 * without any custom UI5 module.
 *
 * Prerequisites (already implemented in backend / dev branch):
 *   - isOverdue            : Boolean (computed on Bugs)
 *   - isPendingAssignment  : Boolean (computed on Bugs)
 *   - isRejectedFollowUp   : Boolean (computed on Bugs)
 *   - isRetestRequired     : Boolean (computed on Bugs)
 *   - nextProcessorUser_ID : filterable via value help
 */

annotate service.Bugs with @(

  /* ── 1. All Bugs ────────────────────────────────────────────────────── */
  UI.SelectionVariant #AllBugs : {
    ID          : 'AllBugs',
    Text        : 'All Bugs',
    SelectOptions : []
  },

  /* ── 2. Pending Assignment ───────────────────────────────────────────── */
  UI.SelectionVariant #PendingAssignment : {
    ID   : 'PendingAssignment',
    Text : 'Pending Assignment',
    SelectOptions : [
      {
        PropertyName : isPendingAssignment,
        Ranges : [
          {
            Sign   : #I,
            Option : #EQ,
            Low    : true
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
        PropertyName : isRejectedFollowUp,
        Ranges : [
          {
            Sign   : #I,
            Option : #EQ,
            Low    : true
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
        PropertyName : isRetestRequired,
        Ranges : [
          {
            Sign   : #I,
            Option : #EQ,
            Low    : true
          }
        ]
      }
    ]
  },

  /* ── 5. Overdue ──────────────────────────────────────────────────────── */
  UI.SelectionVariant #Overdue : {
    ID   : 'Overdue',
    Text : 'Overdue',
    SelectOptions : [
      {
        PropertyName : isOverdue,
        Ranges : [
          {
            Sign   : #I,
            Option : #EQ,
            Low    : true
          }
        ]
      }
    ]
  },

  /* ── 6. My Action Items ──────────────────────────────────────────────── */
  /*
   * "My Action Items" pre-selects bugs where nextProcessorUser is the
   * logged-in user. PM saves this as a personal page-level variant.
   *
   * A fully automatic "me" filter requires a UI5 ControllerExtension
   * which is deferred per the IDTS lightweight FE strategy.
   */
  UI.SelectionVariant #MyActionItems : {
    ID   : 'MyActionItems',
    Text : 'My Action Items',
    SelectOptions : []   // PM saves personal variant from the Next Processor User filter
  }

);
