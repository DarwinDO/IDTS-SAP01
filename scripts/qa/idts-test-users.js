'use strict'

const FIXTURE_USERS = Object.freeze({
  DonHV: { ID: '10000000-0000-0000-0000-000000000001', email: 'donhv@example.local' },
  SangVN: { ID: '10000000-0000-0000-0000-000000000002', email: 'sangvn@example.local' },
  DatDT: { ID: '10000000-0000-0000-0000-000000000003', email: 'datdt@example.local' },
  NhanT: { ID: '10000000-0000-0000-0000-000000000004', email: 'nhant@example.local' }
})

function fixtureUser (cds, memberOrIdentity, roles) {
  const identity = FIXTURE_USERS[memberOrIdentity]?.email || memberOrIdentity
  return new cds.User({ id: identity, roles, attr: { email: identity } })
}

async function seedActiveDeveloperIdentityAccess (cds, db, members, noncePrefix) {
  const { INSERT, SELECT, UPDATE } = cds.ql
  for (const member of members) {
    const user = FIXTURE_USERS[member]
    if (!user) throw new Error(`Unknown fixture member: ${member}`)
    const identityHash = member.toLowerCase().slice(0, 1).repeat(64)
    await db.run(UPDATE('idts.cap.Users').set({ externalIdentityKeyHash: identityHash }).where({ ID: user.ID }))
    const existing = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({
      activeUser_ID: user.ID,
      identityKeyHash: identityHash,
      status_code: 'ACTIVE'
    }))
    if (existing) continue
    await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries({
      ID: cds.utils.uuid(),
      targetEmailNormalized: user.email,
      requestedRole_code: 'DEVELOPER',
      userAdminRequested: false,
      status_code: 'ACTIVE',
      requestedBy_ID: FIXTURE_USERS.DonHV.ID,
      expiresAt: '2099-01-01T00:00:00.000Z',
      tokenNonce: `${noncePrefix}-${member.toLowerCase()}`,
      tokenHash: identityHash,
      identityKeyHash: identityHash,
      identityEmailNormalized: user.email,
      activeUser_ID: user.ID,
      provisioningVersion: 3,
      correlationId: cds.utils.uuid()
    }))
  }
}

module.exports = { FIXTURE_USERS, fixtureUser, seedActiveDeveloperIdentityAccess }
