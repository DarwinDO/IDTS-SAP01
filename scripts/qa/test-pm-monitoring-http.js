'use strict'

const BASE_URL = (process.env.IDTS_BASE_URL || 'http://localhost:4004').replace(/\/$/, '')
const AUTHORIZATION = `Basic ${Buffer.from('DonHV:x').toString('base64')}`

const FLAGS = [
  'isOverdue',
  'isPendingAssignment',
  'isRejectedFollowUp',
  'isRetestRequired'
]

let passed = 0
let failed = 0

async function main () {
  console.log('')
  console.log('==============================================')
  console.log(' IDTS PM Monitoring OData Filter Regression')
  console.log(` ${BASE_URL}`)
  console.log('==============================================')

  const baseline = await getJson(
    `/odata/v4/bug/Bugs?$select=bugNumber,${FLAGS.join(',')}`
  )
  const rows = baseline.value || []

  for (const flag of FLAGS) {
    const expected = rows.filter(row => row[flag] === true).length
    const filtered = await getJson(
      `/odata/v4/bug/Bugs?$select=bugNumber,${flag}&$filter=${flag}%20eq%20true&$count=true`
    )
    const returnedRows = filtered.value || []
    const actual = Number(filtered['@odata.count'])

    check(
      `${flag} filter returns expected count`,
      actual === expected,
      `actual=${actual} expected=${expected}`
    )
    check(
      `${flag} filter only returns true rows`,
      returnedRows.every(row => row[flag] === true),
      `rows=${returnedRows.length}`
    )
  }

  console.log('')
  console.log('==============================================')
  console.log(` TOTAL: ${passed} PASS | ${failed} FAIL`)
  console.log('==============================================')

  if (failed > 0) process.exit(1)
}

async function getJson (path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: AUTHORIZATION }
  })
  const body = await response.text()
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${path}: ${body.slice(0, 500)}`)
  }
  return JSON.parse(body)
}

function check (label, condition, detail) {
  if (condition) {
    passed += 1
    console.log(`  PASS  ${label} | ${detail}`)
  } else {
    failed += 1
    console.log(`  FAIL  ${label} | ${detail}`)
  }
}

main().catch(error => {
  console.error(`  FAIL  ${error.message}`)
  process.exit(1)
})
