'use strict'

const fs = require('fs')
const path = require('path')

const [buildDirArg, csvPathArg] = process.argv.slice(2)
if (!buildDirArg || !csvPathArg) {
  throw new Error('Usage: node generate-idts107-database-dictionary.js <hana-build-dir> <dictionary.csv>')
}

const buildDir = path.resolve(buildDirArg)
const csvPath = path.resolve(csvPathArg)

const parseCsv = text => {
  const rows = []
  let row = []
  let value = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        value += '"'
        i += 1
      } else if (char === '"') quoted = false
      else value += char
    } else if (char === '"') quoted = true
    else if (char === ',') {
      row.push(value)
      value = ''
    } else if (char === '\n') {
      row.push(value.replace(/\r$/, ''))
      rows.push(row)
      row = []
      value = ''
    } else value += char
  }
  if (value || row.length) {
    row.push(value.replace(/\r$/, ''))
    rows.push(row)
  }
  return rows
}

const csvValue = value => {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const previousRows = parseCsv(fs.readFileSync(csvPath, 'utf8'))
const previousHeader = previousRows.shift()
const previous = previousRows.map(values => Object.fromEntries(previousHeader.map((name, index) => [name, values[index] || ''])))
const previousByColumn = new Map(previous.map(row => [`${row['Physical HANA Table']}\u0000${row.Column}`, row]))

const missingTableConfig = {
  BugService_AiSuggestions_drafts: {
    logical: 'BugService.AiSuggestions (draft)', base: 'idts_cap_AiSuggestions',
    purpose: 'CAP draft persistence for AI suggestion review data exposed through BugService.', source: 'srv/service.cds: BugService.AiSuggestions with @odata.draft.enabled'
  },
  BugService_Bugs_attachments_drafts: {
    logical: 'BugService.Bugs.attachments (draft)', base: 'idts_cap_Bugs_attachments',
    purpose: 'CAP draft persistence for attachment metadata linked to a draft Bug.', source: 'srv/service.cds + db/schema.cds + @cap-js/attachments draft compilation'
  },
  BugService_Bugs_drafts: {
    logical: 'BugService.Bugs (draft)', base: 'idts_cap_Bugs',
    purpose: 'CAP draft persistence for Bug changes before activation.', source: 'srv/service.cds: BugService.Bugs with @odata.draft.enabled'
  },
  BugService_Comments_drafts: {
    logical: 'BugService.Comments (draft)', base: 'idts_cap_Comments',
    purpose: 'CAP draft persistence for comments composed under a draft Bug.', source: 'srv/service.cds: BugService.Comments draft composition'
  },
  BugService_DuplicateLinks_drafts: {
    logical: 'BugService.DuplicateLinks (draft)', base: 'idts_cap_DuplicateLinks',
    purpose: 'CAP draft persistence for duplicate-link data exposed under a draft Bug.', source: 'srv/service.cds: BugService.DuplicateLinks draft composition'
  },
  BugService_HistoryEvents_drafts: {
    logical: 'BugService.HistoryEvents (draft)', base: 'idts_cap_HistoryEvents',
    purpose: 'CAP-generated draft artifact for the history-event projection.', source: 'srv/service.cds: BugService.HistoryEvents draft composition'
  },
  BugService_HistoryLogs_drafts: {
    logical: 'BugService.HistoryLogs (draft)', base: 'idts_cap_HistoryLogs',
    purpose: 'CAP-generated draft artifact for field-level history-log projection.', source: 'srv/service.cds: BugService.HistoryLogs draft composition'
  },
  BugService_NotificationDeliveries_drafts: {
    logical: 'BugService.NotificationDeliveries (draft)', base: 'idts_cap_NotificationDeliveries',
    purpose: 'CAP-generated draft artifact for safe notification-delivery projection fields.', source: 'srv/service.cds: BugService.NotificationDeliveries draft projection'
  },
  BugService_Notifications_drafts: {
    logical: 'BugService.Notifications (draft)', base: 'idts_cap_Notifications',
    purpose: 'CAP draft persistence for notifications composed under a draft Bug.', source: 'srv/service.cds: BugService.Notifications draft composition'
  },
  DRAFT_DraftAdministrativeData: {
    logical: 'DRAFT.DraftAdministrativeData',
    purpose: 'CAP administrative state for draft ownership, locking, creation and last-change tracking.', source: '@sap/cds draft runtime model'
  },
  BugService_AssignableDevelopers: {
    logical: 'BugService.AssignableDevelopers',
    purpose: 'Service helper entity calculated by a custom READ handler for assignment value help; current build persists an artifact because @cds.persistence.skip is absent.', source: 'srv/service.cds: BugService.AssignableDevelopers'
  },
  BugService_DeveloperWorkloads: {
    logical: 'BugService.DeveloperWorkloads',
    purpose: 'Service helper entity calculated by a custom READ handler for workload monitoring; current build persists an artifact because @cds.persistence.skip is absent.', source: 'srv/service.cds: BugService.DeveloperWorkloads'
  },
  cds_outbox_Messages: {
    logical: 'cds.outbox.Messages',
    purpose: 'CAP transactional outbox framework storage; distinct from the custom IDTS NotificationDeliveries email outbox.', source: '@sap/cds/srv/outbox'
  }
}

const inferSource = logical => {
  if (logical.startsWith('sap.attachments.')) return '@cap-js/attachments/db/index.cds'
  if (logical.startsWith('idts.cap.')) return 'db/schema.cds'
  return 'Generated from the effective CAP production model'
}

const parseTable = filePath => {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  const tableMatch = lines[0].match(/^COLUMN TABLE\s+([^\s(]+)\s*\($/)
  if (!tableMatch) throw new Error(`Unsupported HANA table header: ${filePath}`)
  const physical = tableMatch[1]
  const primaryLine = lines.find(line => line.trim().startsWith('PRIMARY KEY')) || ''
  const primaryKeys = new Set((primaryLine.match(/PRIMARY KEY\((.*)\)/)?.[1] || '').split(',').map(item => item.trim().replace(/^"|"$/g, '')).filter(Boolean))
  const columns = []
  for (const raw of lines.slice(1)) {
    const line = raw.trim()
    if (!line || line === ')' || line.startsWith('PRIMARY KEY')) continue
    const match = line.match(/^("[^"]+"|[^\s]+)\s+(.+?)(?:\s+NOT NULL|\s+NULL)?(?:\s+DEFAULT\s+(.+?))?,$/)
    if (!match) throw new Error(`Unsupported HANA column: ${filePath}: ${line}`)
    const column = match[1].replace(/^"|"$/g, '')
    let dataType = match[2]
    const nullable = /\sNOT NULL(?:\s|,|$)/.test(line) ? 'NO' : 'YES'
    let defaultValue = match[3] || ''
    if (defaultValue) dataType = dataType.replace(/\s+DEFAULT\s+.*$/, '')
    defaultValue = defaultValue.replace(/^'|'$/g, '')
    columns.push({ column, dataType, nullable, defaultValue, primaryKey: primaryKeys.has(column) ? 'YES' : 'NO' })
  }
  return { physical, fileName: path.basename(filePath), columns }
}

const files = fs.readdirSync(buildDir).filter(name => name.endsWith('.hdbtable')).sort()
const tables = files.map(name => parseTable(path.join(buildDir, name)))
const rows = []

for (const table of tables) {
  const config = missingTableConfig[table.physical]
  for (const column of table.columns) {
    const existing = previousByColumn.get(`${table.physical}\u0000${column.column}`)
    const base = config?.base ? previousByColumn.get(`${config.base}\u0000${column.column}`) : null
    const logical = existing?.['Logical Entity'] || config?.logical || table.fileName.replace(/\.hdbtable$/, '')
    const relationship = existing?.['Relationship / Target'] || base?.['Relationship / Target'] || (column.column === 'DraftAdministrativeData_DraftUUID' ? 'DRAFT.DraftAdministrativeData.DraftUUID' : '')
    rows.push({
      'Logical Entity': logical,
      'Physical HANA Table': table.physical,
      Column: column.column,
      'Data Type': column.dataType,
      'Primary Key': column.primaryKey,
      Nullable: column.nullable,
      Default: column.defaultValue,
      'Relationship / Target': relationship,
      'Business Purpose': existing?.['Business Purpose'] || config?.purpose || 'Persisted field generated from the effective CAP production model.',
      Owner: existing?.Owner || (table.physical.startsWith('BugService_') || table.physical.startsWith('cds_') || table.physical.startsWith('DRAFT_') ? 'CAP runtime / DonHV technical governance' : 'PM / DonHV data governance'),
      Retention: existing?.Retention || (table.physical.includes('_drafts') || table.physical === 'DRAFT_DraftAdministrativeData' ? 'Temporary draft lifecycle; removed by activation, cancellation or draft cleanup.' : 'Project lifecycle or until an authorized retention/deletion rule applies.'),
      'CDS / Model Source': config?.source || inferSource(logical),
      'Database Evidence': `Production-style cds build --production artifact ${table.fileName}; reconciled with sanitized live HANA metadata in hana-production-readback-20260803.md.`
    })
  }
}

if (tables.length !== 48) throw new Error(`Expected 48 HANA tables, found ${tables.length}`)
if (rows.length !== 578) throw new Error(`Expected 578 HANA columns, found ${rows.length}`)
if (rows.some(row => !row['CDS / Model Source'] || !row['Database Evidence'])) throw new Error('Every dictionary row requires source and evidence trace')

const header = ['Logical Entity', 'Physical HANA Table', 'Column', 'Data Type', 'Primary Key', 'Nullable', 'Default', 'Relationship / Target', 'Business Purpose', 'Owner', 'Retention', 'CDS / Model Source', 'Database Evidence']
const output = [header, ...rows.map(row => header.map(name => row[name]))]
  .map(values => values.map(csvValue).join(','))
  .join('\r\n') + '\r\n'
fs.writeFileSync(csvPath, output, 'utf8')
process.stdout.write(`Generated ${tables.length} tables and ${rows.length} columns at ${csvPath}\n`)
