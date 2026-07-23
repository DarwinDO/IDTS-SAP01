'use strict'

const cds = require('@sap/cds')

const { UPSERT } = cds.ql

const ACTION_TYPE_ROWS = [
  { code: 'ASSIGN_TO_DEVELOPER', name: 'Assign to Developer', descr: 'Assigned the bug to a specific developer', sortOrder: 120, active: true, criticality: 1 },
  { code: 'MOVE_TO_PENDING_ASSIGNMENT', name: 'Move to Pending Assignment', descr: 'Moved the bug to the pending assignment queue', sortOrder: 130, active: true, criticality: 1 },
  { code: 'MARK_IN_REVIEW', name: 'Mark in Review', descr: 'Marked the assigned bug as under developer review', sortOrder: 140, active: true, criticality: 1 },
  { code: 'REQUEST_MORE_INFORMATION', name: 'Request More Information', descr: 'Requested additional information from the tester or PM', sortOrder: 150, active: true, criticality: 2 },
  { code: 'RESUBMIT_TO_DEVELOPER', name: 'Resubmit to Developer', descr: 'Returned the updated bug to its assigned developer', sortOrder: 160, active: true, criticality: 1 },
  { code: 'REJECT_BUG', name: 'Reject Bug', descr: 'Rejected the bug for classification or assignment follow-up', sortOrder: 170, active: true, criticality: 2 },
  { code: 'START_PROGRESS', name: 'Start Progress', descr: 'Started active work on the bug', sortOrder: 180, active: true, criticality: 1 },
  { code: 'RESOLVE_BUG', name: 'Resolve Bug', descr: 'Marked the bug as resolved for verification', sortOrder: 190, active: true, criticality: 3 },
  { code: 'SEND_TO_RETEST', name: 'Send to Retest', descr: 'Sent the resolved bug for regression retesting', sortOrder: 200, active: true, criticality: 1 },
  { code: 'CLOSE_BUG', name: 'Close Bug', descr: 'Closed the bug after verification', sortOrder: 210, active: true, criticality: 3 },
  { code: 'REOPEN_BUG', name: 'Reopen Bug', descr: 'Reopened the bug for additional work', sortOrder: 220, active: true, criticality: 2 }
]

async function upsertActionTypes (db) {
  await db.run(UPSERT.into('idts.cap.ActionTypes').entries(ACTION_TYPE_ROWS))
  return ACTION_TYPE_ROWS.length
}

async function main () {
  if (!process.argv.includes('--execute')) {
    console.log(`DRY RUN: ${ACTION_TYPE_ROWS.length} workflow ActionTypes are ready for idempotent UPSERT.`)
    console.log('No database was changed. Re-run with --execute in an approved, privately configured environment.')
    return
  }

  const db = await cds.connect.to('db')
  const count = await upsertActionTypes(db)
  console.log(`UPSERT complete: ${count} workflow ActionTypes processed without deleting legacy rows.`)
}

if (require.main === module) {
  main()
    .catch(error => {
      console.error(`ActionType UPSERT failed: ${error.message}`)
      process.exitCode = 1
    })
    .finally(() => cds.shutdown())
}

module.exports = {
  ACTION_TYPE_ROWS,
  upsertActionTypes
}
