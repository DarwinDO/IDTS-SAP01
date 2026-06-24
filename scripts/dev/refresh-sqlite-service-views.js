'use strict'

const path = require('path')

const cds = require('@sap/cds')
const Database = require('better-sqlite3')

async function main () {
  const databaseFile = path.resolve(process.argv[2] || 'db.sqlite')
  const csn = await cds.load(['db', 'srv'])
  const viewStatements = cds.compile.to.sql(csn)
    .map(statement => statement.trim())
    .filter(statement => /^CREATE VIEW\b/i.test(statement))

  if (!viewStatements.length) {
    throw new Error('CAP compile did not produce any SQLite views.')
  }

  const views = viewStatements.map(statement => ({
    name: viewName(statement),
    statement
  }))

  const database = new Database(databaseFile)
  try {
    const existingObject = database.prepare(
      'select type from sqlite_master where name = ?'
    )

    for (const view of views) {
      const object = existingObject.get(view.name)
      if (object && object.type !== 'view') {
        throw new Error(
          `Cannot refresh ${view.name}: expected a view but found ${object.type}.`
        )
      }
    }

    database.transaction(() => {
      for (const view of views) {
        database.exec(`DROP VIEW IF EXISTS ${quoteIdentifier(view.name)}`)
      }
      for (const view of views) {
        database.exec(view.statement)
      }
    })()
  } finally {
    database.close()
  }

  console.log(`Refreshed ${views.length} CAP service views in ${databaseFile}.`)
}

function viewName (statement) {
  const match = statement.match(/^CREATE VIEW\s+(?:"([^"]+)"|([A-Za-z0-9_]+))/i)
  const name = match?.[1] || match?.[2]
  if (!name) throw new Error(`Cannot parse view name from: ${statement.slice(0, 120)}`)
  return name
}

function quoteIdentifier (identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
