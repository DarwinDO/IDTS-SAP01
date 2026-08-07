#!/usr/bin/env node
'use strict'

// Read-only production inventory for the IDTS-122 classification rollout.
// It prints counts and target-ID presence only; no business row or credential.
const cds = require('@sap/cds')
const { SELECT } = cds.ql

const targets = Object.freeze({
  components: ['40000000-0000-0000-0000-000000000008'],
  bridges: ids('60000000-0000-0000-0000-', 14, 31),
  responsibilities: ids('70000000-0000-0000-0000-', 31, 38)
})

const entities = Object.freeze({
  components: 'idts.cap.ApplicationComponents',
  categories: 'idts.cap.DefectCategories',
  bridges: 'idts.cap.ComponentCategories',
  responsibilities: 'idts.cap.DeveloperResponsibilities',
  bugs: 'idts.cap.Bugs',
  users: 'idts.cap.Users',
  profiles: 'idts.cap.DeveloperProfiles'
})

function ids (prefix, from, to) {
  return Array.from({ length: to - from + 1 }, (_, index) => `${prefix}${String(from + index).padStart(12, '0')}`)
}

async function count (db, entity) {
  const rows = await db.run(SELECT.from(entity).columns('ID'))
  return rows.length
}

async function present (db, entity, expected) {
  const rows = await db.run(SELECT.from(entity).columns('ID').where({ ID: { in: expected } }))
  const found = new Set(rows.map(row => row.ID || row.id))
  return expected.filter(id => found.has(id)).length
}

async function main () {
  const db = await cds.connect.to('db')
  const counts = {}
  for (const [name, entity] of Object.entries(entities)) counts[name] = await count(db, entity)
  const targetPresence = {
    components: await present(db, entities.components, targets.components),
    bridges: await present(db, entities.bridges, targets.bridges),
    responsibilities: await present(db, entities.responsibilities, targets.responsibilities)
  }
  console.log(JSON.stringify({
    marker: 'IDTS122_CLASSIFICATION_CATALOG_READ_ONLY_COMPLETE',
    counts,
    targetPresence,
    plannedInserts: {
      components: targets.components.length - targetPresence.components,
      bridges: targets.bridges.length - targetPresence.bridges,
      responsibilities: targets.responsibilities.length - targetPresence.responsibilities
    },
    mutation: false
  }))
}

main().catch(error => {
  console.error(JSON.stringify({ marker: 'IDTS122_CLASSIFICATION_CATALOG_READ_ONLY_FAILED', code: error.code || 'UNEXPECTED' }))
  process.exitCode = 1
}).finally(() => cds.shutdown())
