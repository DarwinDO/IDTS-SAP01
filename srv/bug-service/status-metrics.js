'use strict'

const cds = require('@sap/cds')
const { SELECT } = cds.ql
const { STATUS } = require('./constants')

const PM_DASHBOARD_STATUSES = Object.freeze([
  STATUS.PENDING_ASSIGNMENT,
  STATUS.ASSIGNED,
  STATUS.IN_REVIEW,
  STATUS.NEED_MORE_INFORMATION,
  STATUS.IN_PROGRESS,
  STATUS.RESOLVED,
  STATUS.RETEST_REQUIRED,
  STATUS.REJECTED,
  STATUS.REOPENED,
  STATUS.CLOSED
])

function normalizeBugStatusMetrics (statusRows = [], countRows = []) {
  const statusByCode = new Map(statusRows.map(row => [row.code, row]))
  const countByCode = new Map(countRows.map(row => [row.status_code, Number(row.bugCount || 0)]))

  return PM_DASHBOARD_STATUSES.map((code, index) => {
    const status = statusByCode.get(code) || {}
    return {
      statusCode: code,
      statusName: status.name || code,
      statusCriticality: Number(status.criticality || 0),
      sortOrder: Number(status.sortOrder || ((index + 2) * 10)),
      bugCount: countByCode.get(code) || 0
    }
  })
}

async function readBugStatusMetrics (req) {
  const tx = cds.tx(req)
  const [statusRows, countRows] = await Promise.all([
    tx.run(
      SELECT.from('idts.cap.StatusValues')
        .columns('code', 'name', 'criticality', 'sortOrder')
        .where({ active: true, code: { in: PM_DASHBOARD_STATUSES } })
    ),
    tx.run(
      SELECT.from('idts.cap.Bugs')
        .columns('status_code', { func: 'count', args: [{ ref: ['ID'] }], as: 'bugCount' })
        .where({ status_code: { in: PM_DASHBOARD_STATUSES } })
        .groupBy('status_code')
    )
  ])

  return normalizeBugStatusMetrics(statusRows, countRows)
}

module.exports = {
  PM_DASHBOARD_STATUSES,
  normalizeBugStatusMetrics,
  readBugStatusMetrics
}
