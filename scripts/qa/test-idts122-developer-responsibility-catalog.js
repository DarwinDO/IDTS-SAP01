const { createHash } = require('node:crypto')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')

const root = resolve(__dirname, '..', '..')
const readCsv = file => {
  const [header, ...lines] = readFileSync(resolve(root, file), 'utf8').trim().split(/\r?\n/)
  const columns = header.split(',')
  return lines.map(line => Object.fromEntries(columns.map((column, index) => [column, line.split(',')[index] ?? ''])))
}
const failures = []
const check = (description, condition) => {
  if (condition) return
  failures.push(description)
}

const AI_PAIRS = {
  CAP_BACKEND: '60000000-0000-0000-0000-000000000028',
  INTEGRATION: '60000000-0000-0000-0000-000000000029',
  PERFORMANCE: '60000000-0000-0000-0000-000000000030',
  DATA_QUALITY: '60000000-0000-0000-0000-000000000031'
}
const EXPECTED_AI_ROWS = [
  ['70000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000005', AI_PAIRS.CAP_BACKEND, '', 'PRIMARY', 'true'],
  ['70000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000006', AI_PAIRS.CAP_BACKEND, '', 'BACKUP', 'true'],
  ['70000000-0000-0000-0000-000000000033', '20000000-0000-0000-0000-000000000009', AI_PAIRS.INTEGRATION, '', 'PRIMARY', 'true'],
  ['70000000-0000-0000-0000-000000000034', '20000000-0000-0000-0000-000000000011', AI_PAIRS.INTEGRATION, '', 'BACKUP', 'true'],
  ['70000000-0000-0000-0000-000000000035', '20000000-0000-0000-0000-000000000011', AI_PAIRS.PERFORMANCE, '', 'PRIMARY', 'true'],
  ['70000000-0000-0000-0000-000000000036', '20000000-0000-0000-0000-000000000005', AI_PAIRS.PERFORMANCE, '', 'BACKUP', 'true'],
  ['70000000-0000-0000-0000-000000000037', '20000000-0000-0000-0000-000000000007', AI_PAIRS.DATA_QUALITY, '', 'PRIMARY', 'true'],
  ['70000000-0000-0000-0000-000000000038', '20000000-0000-0000-0000-000000000011', AI_PAIRS.DATA_QUALITY, '', 'BACKUP', 'true']
]
const responsibilitiesPath = 'db/data/idts.cap-DeveloperResponsibilities.csv'
const rawResponsibilities = readFileSync(resolve(root, responsibilitiesPath), 'utf8').replace(/\r\n/g, '\n').trimEnd() + '\n'
const responsibilityLines = rawResponsibilities.trimEnd().split('\n')
const baselineHash = createHash('sha256').update(`${responsibilityLines.slice(0, 31).join('\n')}\n`).digest('hex')
const responsibilities = readCsv(responsibilitiesPath)
const profiles = readCsv('db/data/idts.cap-DeveloperProfiles.csv')
const pairs = readCsv('db/data/idts.cap-ComponentCategories.csv')
const modules = readCsv('db/data/idts.cap-SAPModules.csv')
const levels = readCsv('db/data/idts.cap-ResponsibilityLevels.csv')
const profileIds = new Set(profiles.map(row => row.ID))
const pairIds = new Set(pairs.map(row => row.ID))
const moduleIds = new Set(modules.map(row => row.ID))
const levelCodes = new Set(levels.map(row => row.code))
const pairById = Object.fromEntries(pairs.map(row => [row.ID, row]))
const applications = Object.fromEntries(readCsv('db/data/idts.cap-ApplicationComponents.csv').map(row => [row.ID, row.code]))
const categories = Object.fromEntries(readCsv('db/data/idts.cap-DefectCategories.csv').map(row => [row.ID, row.code]))

check('DeveloperResponsibilities has exactly 38 rows', responsibilities.length === 38)
check('the original 30 rows are byte-stable after normalized line endings', baselineHash === '3e5002059a57bf019e8ba991be18c66061b6ba255c38e24367f5742d53888a3c')
check('ComponentCategories has the integrated 31-pair matrix', pairs.length === 31)
for (const [categoryCode, pairId] of Object.entries(AI_PAIRS)) {
  const pair = pairById[pairId]
  check(`${categoryCode} maps to an AI component pair`, pair?.component_ID === '40000000-0000-0000-0000-000000000008')
  check(`${categoryCode} maps to its matching defect category`, pair && categories[pair.defectCategory_ID] === categoryCode)
}
for (const [index, expected] of EXPECTED_AI_ROWS.entries()) {
  const actual = responsibilities[30 + index]
  check(`AI responsibility ${index + 31} matches its approved tuple`, actual && [actual.ID, actual.developerProfile_ID, actual.componentCategory_ID, actual.sapModule_ID, actual.responsibilityLevel_code, actual.active].every((value, column) => value === expected[column]))
}
for (const row of responsibilities) {
  check(`responsibility ${row.ID} has a valid developer profile`, profileIds.has(row.developerProfile_ID))
  check(`responsibility ${row.ID} has a valid component category`, pairIds.has(row.componentCategory_ID))
  check(`responsibility ${row.ID} has a valid optional SAP module`, !row.sapModule_ID || moduleIds.has(row.sapModule_ID))
  check(`responsibility ${row.ID} has a valid responsibility level`, levelCodes.has(row.responsibilityLevel_code))
  check(`responsibility ${row.ID} has a boolean active value`, ['true', 'false'].includes(row.active))
}
const tuples = new Set()
for (const row of responsibilities) {
  const tuple = [row.developerProfile_ID, row.componentCategory_ID, row.sapModule_ID || 'ANY', row.responsibilityLevel_code].join('|')
  check(`responsibility tuple is unique: ${tuple}`, !tuples.has(tuple))
  tuples.add(tuple)
}
for (const [name, pairId] of Object.entries(AI_PAIRS)) {
  const candidates = responsibilities.filter(row => row.componentCategory_ID === pairId && row.active === 'true')
  check(`${name} has at least two active candidate rows`, candidates.length >= 2)
}
console.log('Developer responsibility candidate coverage')
for (const pair of pairs) {
  const candidates = responsibilities.filter(row => row.componentCategory_ID === pair.ID && row.active === 'true').length
  console.log(`${pair.ID} ${applications[pair.component_ID] ?? '<missing-component>'}/${categories[pair.defectCategory_ID] ?? '<missing-category>'}: ${candidates}`)
}
if (failures.length) {
  console.error(`FAIL (${failures.length})`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log('IDTS-122 developer responsibility catalog: PASS')
}
