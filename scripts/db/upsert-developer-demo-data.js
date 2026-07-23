'use strict'

const fs = require('fs')
const path = require('path')
const cds = require('@sap/cds')

const { UPSERT } = cds.ql
const NEW_USER_IDS = new Set(
  Array.from({ length: 10 }, (_, index) =>
    `10000000-0000-0000-0000-${String(index + 5).padStart(12, '0')}`)
)

function readCsv (fileName) {
  const filePath = path.join(__dirname, '..', '..', 'db', 'data', fileName)
  const [headerLine, ...lines] = fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/)
  const headers = headerLine.split(',')
  return lines.map(line => Object.fromEntries(
    line.split(',').map((value, index) => [headers[index], value === '' ? null : value])
  ))
}

function loadRows () {
  const users = readCsv('idts.cap-Users.csv')
    .filter(row => NEW_USER_IDS.has(row.ID))
    .map(row => ({ ...row, active: row.active === 'true' }))
  const userIDs = new Set(users.map(row => row.ID))

  const profiles = readCsv('idts.cap-DeveloperProfiles.csv')
    .filter(row => userIDs.has(row.user_ID))
    .map(row => ({ ...row, workloadLimit: Number(row.workloadLimit), active: row.active === 'true' }))
  const profileIDs = new Set(profiles.map(row => row.ID))

  const responsibilities = readCsv('idts.cap-DeveloperResponsibilities.csv')
    .filter(row => profileIDs.has(row.developerProfile_ID))
    .map(row => ({ ...row, active: row.active === 'true' }))

  validateRows({ users, profiles, responsibilities })
  return { users, profiles, responsibilities }
}

function validateRows ({ users, profiles, responsibilities }) {
  if (users.length !== 10 || profiles.length !== 10 || responsibilities.length !== 22) {
    throw new Error(`Expected 10 users, 10 profiles and 22 responsibilities; got ${users.length}/${profiles.length}/${responsibilities.length}.`)
  }
  if (users.some(row => row.role_code !== 'DEVELOPER' || !row.email.endsWith('@example.local'))) {
    throw new Error('Every IDTS-90 user must be a synthetic DEVELOPER account under example.local.')
  }
  const responsibilitiesPerProfile = responsibilities.reduce((counts, row) => {
    counts[row.developerProfile_ID] = (counts[row.developerProfile_ID] || 0) + 1
    return counts
  }, {})
  if (profiles.some(row => (responsibilitiesPerProfile[row.ID] || 0) < 2)) {
    throw new Error('Every IDTS-90 developer profile must have at least two responsibility rows.')
  }
}

async function upsertDeveloperDemoData (db) {
  const rows = loadRows()
  await db.tx(async tx => {
    await tx.run(UPSERT.into('idts.cap.Users').entries(rows.users))
    await tx.run(UPSERT.into('idts.cap.DeveloperProfiles').entries(rows.profiles))
    await tx.run(UPSERT.into('idts.cap.DeveloperResponsibilities').entries(rows.responsibilities))
  })
  return rows
}

function sqlLiteral (value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'number') return String(value)
  return `'${String(value).replace(/'/g, "''")}'`
}

function insertSql (table, columns, rows) {
  const values = rows
    .map(row => `(${columns.map(column => sqlLiteral(row[column])).join(', ')})`)
    .join(',\n')
  const updates = columns
    .filter(column => column !== 'ID')
    .map(column => `"${column}" = EXCLUDED."${column}"`)
    .join(', ')
  return `INSERT INTO "${table}" (${columns.map(column => `"${column}"`).join(', ')}) VALUES\n${values}\nON CONFLICT ("ID") DO UPDATE SET ${updates};`
}

function buildPostgresSql () {
  const rows = loadRows()
  return [
    'BEGIN;',
    insertSql('idts_cap_Users', ['ID', 'displayName', 'email', 'role_code', 'active'], rows.users),
    insertSql('idts_cap_DeveloperProfiles', ['ID', 'user_ID', 'availabilityStatus_code', 'workloadLimit', 'active'], rows.profiles),
    insertSql('idts_cap_DeveloperResponsibilities', ['ID', 'developerProfile_ID', 'componentCategory_ID', 'sapModule_ID', 'responsibilityLevel_code', 'active'], rows.responsibilities),
    'COMMIT;'
  ].join('\n\n')
}

async function main () {
  if (process.argv.includes('--postgres-sql')) {
    process.stdout.write(`${buildPostgresSql()}\n`)
    return
  }
  if (!process.argv.includes('--execute')) {
    const rows = loadRows()
    console.log(`DRY RUN: ${rows.users.length} users, ${rows.profiles.length} profiles and ${rows.responsibilities.length} responsibilities are ready.`)
    console.log('No database was changed. Use --execute only with an approved private database binding.')
    return
  }

  const db = await cds.connect.to('db')
  const rows = await upsertDeveloperDemoData(db)
  console.log(`UPSERT complete: ${rows.users.length} users, ${rows.profiles.length} profiles and ${rows.responsibilities.length} responsibilities processed.`)
}

if (require.main === module) {
  main()
    .catch(error => {
      console.error(`Developer demo-data UPSERT failed: ${error.message}`)
      process.exitCode = 1
    })
    .finally(() => cds.shutdown())
}

module.exports = {
  NEW_USER_IDS,
  loadRows,
  upsertDeveloperDemoData,
  buildPostgresSql
}
