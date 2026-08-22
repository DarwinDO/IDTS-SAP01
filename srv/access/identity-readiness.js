'use strict'

const cds = require('@sap/cds')
const { SELECT } = cds.ql

const USERS = 'idts.cap.Users'
const REQUESTS = 'idts.cap.UserOnboardingRequests'

function hasActiveIdentityAccess (user, requests) {
  if (!user || user.active !== true || typeof user.externalIdentityKeyHash !== 'string' || !user.externalIdentityKeyHash) {
    return false
  }

  const matches = (Array.isArray(requests) ? requests : []).filter(request =>
    request?.activeUser_ID === user.ID &&
    request.status_code === 'ACTIVE' &&
    request.identityKeyHash === user.externalIdentityKeyHash
  )
  return matches.length === 1
}

async function readActiveIdentityAccessByUser (tx, userIDs) {
  const ids = [...new Set((Array.isArray(userIDs) ? userIDs : []).filter(Boolean))]
  if (ids.length === 0) return new Map()

  const [users, requests] = await Promise.all([
    tx.run(SELECT.from(USERS).columns('ID', 'active', 'externalIdentityKeyHash').where({ ID: { in: ids } })),
    tx.run(SELECT.from(REQUESTS).columns(
      'ID',
      'activeUser_ID',
      'status_code',
      'identityKeyHash',
      'targetEmailNormalized',
      'requestedRole_code',
      'userAdminRequested'
    ).where({ activeUser_ID: { in: ids }, status_code: 'ACTIVE' }))
  ])

  const requestsByUser = new Map()
  for (const request of requests) {
    const rows = requestsByUser.get(request.activeUser_ID) || []
    rows.push(request)
    requestsByUser.set(request.activeUser_ID, rows)
  }

  return new Map(users.map(user => {
    const userRequests = requestsByUser.get(user.ID) || []
    return [user.ID, {
      user,
      requests: userRequests,
      ready: hasActiveIdentityAccess(user, userRequests)
    }]
  }))
}

module.exports = { hasActiveIdentityAccess, readActiveIdentityAccessByUser }
