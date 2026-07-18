// Các preset monitoring chỉ trình bày/lọc Bugs và DeveloperWorkloads do backend trả; chúng không tự tính hay ghi status.
// Khi số liệu sai, xem Network response và `srv/bug-service/monitoring.js` trước khi đổi annotation.
using BugService as service from '../../../srv/service';

/**
 * IDTS-22 — PM Monitoring FE Views / Filter Variants
 *
 * Provides six SelectionVariant presets so PM users can switch between
 * key monitoring slices from the existing Fiori Elements List Report
 * without any custom UI5 module.
 *
 * Backend contract note:
 *   isOverdue, isPendingAssignment, isRejectedFollowUp, and isRetestRequired
 *   are computed fields exposed by BugService.Bugs. They are intentionally
 *   used here because they express the same business meaning as the tab names.
 *
 * Local SQLite note:
 *   If a local db.sqlite was created before these service-view fields existed,
 *   run `npm run dev:sqlite:refresh-views` before browser UAT. Otherwise SQLite
 *   may still hold an old BugService_Bugs view and fail with "no such column".
 *
 * PM Action Queue:
 *   A fully automatic "my user" filter needs a UI5 ControllerExtension because
 *   SelectionVariant annotations cannot inject the runtime user dynamically.
 *   For the annotation-only MVP, this tab shows records where the current action
 *   owner is the PM queue.
 */

annotate service.Bugs with @(

  /* 1. All Bugs */
  UI.SelectionVariant #AllBugs : {
    ID          : 'AllBugs',
    Text        : 'All Bugs',
    SelectOptions : []
  },

  /* 2. Pending Assignment */
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

  /* 3. Rejected Follow-up */
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

  /* 4. Retest Required */
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

  /* 5. Overdue */
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

  /* 6. PM Action Queue */
  UI.SelectionVariant #MyActionItems : {
    ID   : 'PMActionQueue',
    Text : 'PM Action Queue',
    SelectOptions : [
      {
        PropertyName : nextProcessorRole_code,
        Ranges : [
          {
            Sign   : #I,
            Option : #EQ,
            Low    : 'PM'
          }
        ]
      }
    ]
  }

);
