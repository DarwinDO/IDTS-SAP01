'use strict'

const BUSY_THRESHOLD = 2
const WORKLOAD_LIMIT = 3

const AVAILABILITY = Object.freeze({
  AVAILABLE: { code: 'AVAILABLE', name: 'Available', criticality: 3 },
  BUSY: { code: 'BUSY', name: 'Busy', criticality: 2 },
  UNAVAILABLE: { code: 'UNAVAILABLE', name: 'Unavailable', criticality: 1 }
})

function effectiveCapacity (manualAvailabilityCode, openOwnedBugCount = 0) {
  const count = Number(openOwnedBugCount) || 0
  let status = AVAILABILITY.AVAILABLE

  if (manualAvailabilityCode === AVAILABILITY.UNAVAILABLE.code || count >= WORKLOAD_LIMIT) {
    status = AVAILABILITY.UNAVAILABLE
  } else if (manualAvailabilityCode === AVAILABILITY.BUSY.code || count >= BUSY_THRESHOLD) {
    status = AVAILABILITY.BUSY
  }

  return {
    availabilityStatusCode: status.code,
    availabilityStatusName: status.name,
    availabilityCriticality: status.criticality,
    workloadLimit: WORKLOAD_LIMIT,
    isOverloaded: count >= WORKLOAD_LIMIT,
    canReceiveNewBug: status.code !== AVAILABILITY.UNAVAILABLE.code
  }
}

async function readOpenOwnedBugCounts (tx, entities, developerProfileIDs) {
  const ids = [...new Set((developerProfileIDs || []).filter(Boolean))]
  const counts = new Map(ids.map(id => [id, 0]))
  if (!ids.length) return counts

  const bugs = await tx.run(
    tx.read(entities.Bugs)
      .columns('assignee_ID', 'status_code')
      .where({ assignee_ID: { in: ids } })
  )

  for (const bug of bugs) {
    if (bug.assignee_ID && bug.status_code !== 'CLOSED') {
      counts.set(bug.assignee_ID, (counts.get(bug.assignee_ID) || 0) + 1)
    }
  }

  return counts
}

module.exports = {
  BUSY_THRESHOLD,
  WORKLOAD_LIMIT,
  effectiveCapacity,
  readOpenOwnedBugCounts
}
