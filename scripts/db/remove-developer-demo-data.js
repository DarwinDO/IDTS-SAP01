'use strict'

const cds = require('@sap/cds')

const { DELETE, SELECT } = cds.ql

const TARGET_USER_IDS = Array.from({ length: 10 }, (_, index) =>
  `10000000-0000-0000-0000-${String(index + 5).padStart(12, '0')}`
)
const TARGET_PROFILE_IDS = Array.from({ length: 10 }, (_, index) =>
  `20000000-0000-0000-0000-${String(index + 3).padStart(12, '0')}`
)
const TARGET_EMAILS = [
  'dev.fiori01@example.local',
  'dev.fiori02@example.local',
  'dev.cap01@example.local',
  'dev.cap02@example.local',
  'dev.database01@example.local',
  'dev.database02@example.local',
  'dev.integration01@example.local',
  'dev.assignment01@example.local',
  'dev.expert01@example.local',
  'dev.backup01@example.local'
]

const USER_REFERENCES = [
  ['AuthSessions', 'user_ID'],
  ['Bugs', 'reporter_ID'],
  ['Bugs', 'retestOwner_ID'],
  ['Bugs', 'nextProcessorUser_ID'],
  ['Comments', 'author_ID'],
  ['HistoryEvents', 'actor_ID'],
  ['HistoryLogs', 'actor_ID'],
  ['Notifications', 'recipient_ID'],
  ['CatalogAdministrationAuditEvents', 'actor_ID'],
  ['UserOnboardingRequests', 'linkTargetUser_ID'],
  ['UserOnboardingRequests', 'requestedBy_ID'],
  ['UserOnboardingRequests', 'approvedBy_ID'],
  ['UserOnboardingRequests', 'activeUser_ID'],
  ['UserOnboardingRequests', 'revokedBy_ID'],
  ['UserAccessOperations', 'requestedBy_ID'],
  ['UserIdentityAuditEvents', 'actor_ID'],
  ['UserIdentityAuditEvents', 'targetUser_ID'],
  ['UserNotificationInboxEntries', 'recipient_ID'],
  ['UserAccessNotificationDeliveries', 'targetUser_ID'],
  ['NotificationDigestDeliveries', 'recipient_ID'],
  ['AiSuggestions', 'requestedBy_ID'],
  ['AiSuggestions', 'reviewedBy_ID']
]

async function count (db, entity, where) {
  const rows = await db.run(SELECT.from(`idts.cap.${entity}`).columns('ID').where(where))
  return rows.length
}

function valueOf (row, field) {
  return row?.[field] ?? row?.[field.toUpperCase()]
}

async function inspectDeveloperDemoData (db) {
  const users = await db.run(SELECT.from('idts.cap.Users').columns('ID', 'email').where({ ID: { in: TARGET_USER_IDS } }))
  for (const row of users) {
    const ID = valueOf(row, 'ID')
    const index = TARGET_USER_IDS.indexOf(ID)
    if (index < 0 || valueOf(row, 'email') !== TARGET_EMAILS[index]) {
      throw new Error(`Cleanup target ${ID} no longer matches the approved synthetic identity.`)
    }
  }

  const blockers = {}
  for (const [entity, field] of USER_REFERENCES) {
    const value = await count(db, entity, { [field]: { in: TARGET_USER_IDS } })
    if (value) blockers[`${entity}.${field}`] = value
  }
  const assignedBugs = await count(db, 'Bugs', { assignee_ID: { in: TARGET_PROFILE_IDS } })
  if (assignedBugs) blockers['Bugs.assignee_ID'] = assignedBugs

  return {
    users: users.length,
    profiles: await count(db, 'DeveloperProfiles', { ID: { in: TARGET_PROFILE_IDS } }),
    responsibilities: await count(db, 'DeveloperResponsibilities', { developerProfile_ID: { in: TARGET_PROFILE_IDS } }),
    profileAdministrationStates: await count(db, 'DeveloperProfileAdministrationStates', { developerProfile_ID: { in: TARGET_PROFILE_IDS } }),
    blockers
  }
}

async function removeDeveloperDemoData (db) {
  return db.tx(async tx => {
    const before = await inspectDeveloperDemoData(tx)
    if (Object.keys(before.blockers).length) {
      throw new Error(`Synthetic developer cleanup refused because business references remain: ${JSON.stringify(before.blockers)}`)
    }
    await tx.run(DELETE.from('idts.cap.DeveloperResponsibilities').where({ developerProfile_ID: { in: TARGET_PROFILE_IDS } }))
    await tx.run(DELETE.from('idts.cap.DeveloperProfileAdministrationStates').where({ developerProfile_ID: { in: TARGET_PROFILE_IDS } }))
    await tx.run(DELETE.from('idts.cap.DeveloperProfiles').where({ ID: { in: TARGET_PROFILE_IDS } }))
    await tx.run(DELETE.from('idts.cap.Users').where({ ID: { in: TARGET_USER_IDS } }))
    const after = await inspectDeveloperDemoData(tx)
    if (after.users || after.profiles || after.responsibilities || after.profileAdministrationStates) {
      throw new Error('Synthetic developer cleanup readback did not reach zero rows.')
    }
    return before
  })
}

async function main () {
  if (!process.env.VCAP_SERVICES) {
    throw new Error('SAP HANA binding is required. Set VCAP_SERVICES from the target CF app before running this cleanup.')
  }
  const db = await cds.connect.to('db')
  const before = await inspectDeveloperDemoData(db)
  if (!process.argv.includes('--execute')) {
    console.log(JSON.stringify({ mode: 'DRY_RUN', ...before }, null, 2))
    return
  }
  const removed = await removeDeveloperDemoData(db)
  console.log(JSON.stringify({ mode: 'EXECUTED', removed }, null, 2))
}

if (require.main === module) {
  main()
    .catch(error => {
      console.error(`Synthetic developer cleanup failed: ${error.message}`)
      process.exitCode = 1
    })
    .finally(() => cds.shutdown())
}

module.exports = {
  TARGET_EMAILS,
  TARGET_PROFILE_IDS,
  TARGET_USER_IDS,
  USER_REFERENCES,
  inspectDeveloperDemoData,
  removeDeveloperDemoData
}
