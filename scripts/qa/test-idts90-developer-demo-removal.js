'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('assert')
const cds = require('@sap/cds')
const { DELETE, INSERT, SELECT } = cds.ql
const {
  TARGET_PROFILE_IDS,
  TARGET_EMAILS,
  TARGET_USER_IDS,
  inspectDeveloperDemoData,
  removeDeveloperDemoData
} = require('../db/remove-developer-demo-data')

async function seedSyntheticDevelopers (db) {
  await db.run(DELETE.from('idts.cap.DeveloperResponsibilities').where({ developerProfile_ID: { in: TARGET_PROFILE_IDS } }))
  await db.run(DELETE.from('idts.cap.DeveloperProfiles').where({ ID: { in: TARGET_PROFILE_IDS } }))
  await db.run(DELETE.from('idts.cap.Users').where({ ID: { in: TARGET_USER_IDS } }))
  const componentCategory = await db.run(SELECT.one.from('idts.cap.ComponentCategories').columns('ID'))
  assert(componentCategory?.ID, 'seeded Component Category is required')

  await db.run(INSERT.into('idts.cap.Users').entries(TARGET_USER_IDS.map((ID, index) => ({
    ID,
    displayName: `Synthetic Developer ${index + 1}`,
    email: TARGET_EMAILS[index],
    role_code: 'DEVELOPER',
    active: true
  }))))
  await db.run(INSERT.into('idts.cap.DeveloperProfiles').entries(TARGET_PROFILE_IDS.map((ID, index) => ({
    ID,
    user_ID: TARGET_USER_IDS[index],
    availabilityStatus_code: 'AVAILABLE',
    workloadLimit: 2,
    active: true
  }))))
  await db.run(INSERT.into('idts.cap.DeveloperResponsibilities').entries(TARGET_PROFILE_IDS.map((profileID, index) => ({
    ID: `79000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
    developerProfile_ID: profileID,
    componentCategory_ID: componentCategory.ID,
    responsibilityLevel_code: 'PRIMARY',
    active: true
  }))))
}

async function main () {
  assert.equal(TARGET_USER_IDS.length, 10)
  assert.equal(TARGET_PROFILE_IDS.length, 10)
  assert(!TARGET_USER_IDS.includes('10000000-0000-0000-0000-000000000001'), 'core DonHV fixture must never be targeted')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)

  await seedSyntheticDevelopers(db)
  const before = await inspectDeveloperDemoData(db)
  assert.equal(before.users, 10)
  assert.equal(before.profiles, 10)
  assert.equal(before.responsibilities >= 10, true)
  assert.deepEqual(before.blockers, {})

  await db.run(INSERT.into('idts.cap.AuthSessions').entries({
    ID: '79000000-0000-0000-0000-000000000099',
    user_ID: TARGET_USER_IDS[0],
    tokenHash: 'a'.repeat(64),
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString()
  }))
  const blocked = await inspectDeveloperDemoData(db)
  assert.equal(blocked.blockers['AuthSessions.user_ID'], 1)
  await assert.rejects(removeDeveloperDemoData(db), /business references remain/i)

  await db.run(DELETE.from('idts.cap.AuthSessions').where({ ID: '79000000-0000-0000-0000-000000000099' }))
  const removed = await removeDeveloperDemoData(db)
  assert.equal(removed.users, 10)
  assert.equal(removed.profiles, 10)
  assert.equal(removed.responsibilities >= 10, true)

  const after = await inspectDeveloperDemoData(db)
  assert.deepEqual(after, { users: 0, profiles: 0, responsibilities: 0, profileAdministrationStates: 0, blockers: {} })

  const coreUsers = await db.run(SELECT.from('idts.cap.Users').where({ ID: { in: [
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000004'
  ] } }))
  assert.equal(coreUsers.length, 4)

  console.log('IDTS-90 synthetic developer removal: PASS')
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => cds.shutdown())
