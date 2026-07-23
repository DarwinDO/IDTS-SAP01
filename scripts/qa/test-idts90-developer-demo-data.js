'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const Module = require('module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const cds = require('@sap/cds')
const { SELECT, UPDATE } = cds.ql
const { NEW_USER_IDS, loadRows, upsertDeveloperDemoData, buildPostgresSql } = require('../db/upsert-developer-demo-data')

let passed = 0
let failed = 0

function check (label, condition, detail = '') {
  if (condition) passed += 1
  else failed += 1
  console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? ` | ${detail}` : ''}`)
}

async function counts (db) {
  const [users, developers, profiles, responsibilities] = await Promise.all([
    db.run(SELECT.one.from('idts.cap.Users').columns('count(*) as count')),
    db.run(SELECT.one.from('idts.cap.Users').columns('count(*) as count').where({ role_code: 'DEVELOPER' })),
    db.run(SELECT.one.from('idts.cap.DeveloperProfiles').columns('count(*) as count')),
    db.run(SELECT.one.from('idts.cap.DeveloperResponsibilities').columns('count(*) as count'))
  ])
  return [users.count, developers.count, profiles.count, responsibilities.count]
}

async function main () {
  console.log('\nIDTS-90 developer demo-data verification')
  const rows = loadRows()
  check('fixture contains 10 synthetic users', rows.users.length === 10)
  check('fixture contains varied availability', new Set(rows.profiles.map(row => row.availabilityStatus_code)).size === 3)
  check('fixture contains varied workload limits', new Set(rows.profiles.map(row => row.workloadLimit)).size >= 4)
  check('fixture contains PRIMARY/BACKUP/EXPERT levels', new Set(rows.responsibilities.map(row => row.responsibilityLevel_code)).size === 3)
  check('generated PostgreSQL script is transactional and idempotent', /^BEGIN;/.test(buildPostgresSql()) && /ON CONFLICT \("ID"\) DO UPDATE/.test(buildPostgresSql()) && /COMMIT;\s*$/.test(buildPostgresSql()))

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)

  check('seed creates 14 users / 12 developers / 12 profiles / 30 responsibilities',
    JSON.stringify(await counts(db)) === JSON.stringify([14, 12, 12, 30]),
    `counts=${JSON.stringify(await counts(db))}`)

  const protectedUserID = [...NEW_USER_IDS][0]
  await db.run(UPDATE('idts.cap.Users').set({ passwordHash: 'must-stay-private-hash' }).where({ ID: protectedUserID }))
  await upsertDeveloperDemoData(db)
  await upsertDeveloperDemoData(db)

  check('repeated UPSERT does not create duplicates',
    JSON.stringify(await counts(db)) === JSON.stringify([14, 12, 12, 30]),
    `counts=${JSON.stringify(await counts(db))}`)

  const protectedUser = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: protectedUserID }))
  check('narrow UPSERT preserves passwordHash', protectedUser.passwordHash === 'must-stay-private-hash')

  const invalidResponsibility = await db.run(
    SELECT.one.from('idts.cap.DeveloperResponsibilities')
      .where({ developerProfile_ID: { 'not in': rows.profiles.map(row => row.ID) }, ID: { in: rows.responsibilities.map(row => row.ID) } })
  )
  check('all new responsibility foreign keys resolve to new profiles', !invalidResponsibility)

  const srv = await cds.serve('BugService').from(csn)
  const pm = srv.tx({ user: new cds.User({ id: 'donhv@example.local', roles: ['PM', 'authenticated-user'] }) })
  const assignable = await pm.run(SELECT.from('BugService.AssignableDevelopers'))
  const workloads = await pm.run(SELECT.from('BugService.DeveloperWorkloads'))
  check('AssignableDevelopers exposes the expanded developer pool', assignable.length >= 11, `rows=${assignable.length}`)
  check('DeveloperWorkloads exposes all active developer profiles', workloads.length === 12, `rows=${workloads.length}`)
  const unavailableCandidate = assignable.find(row => row.developerName === 'Backup Developer')
  check(
    'unavailable developer remains visible with a clear availability warning',
    unavailableCandidate?.availabilityStatusName === 'Unavailable',
    `availability=${unavailableCandidate?.availabilityStatusName || 'missing'}`
  )

  console.log(`\nRESULT: ${passed} PASS / ${failed} FAIL`)
  if (failed) process.exitCode = 1
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => cds.shutdown())
