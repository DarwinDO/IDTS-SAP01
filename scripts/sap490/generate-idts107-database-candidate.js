'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const cds = require('@sap/cds')

const PROJECT_ROOT = path.resolve(__dirname, '..', '..')
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'docs', 'pm', 'evidence', 'idts-107', 'technical-spec')

const PURPOSES = {
  UserRoles: 'Business-role code list for Tester, Developer and PM profiles.',
  StatusValues: 'Bug lifecycle status code list.',
  PriorityValues: 'Bug priority code list.',
  SeverityValues: 'Bug severity code list.',
  EnvironmentValues: 'Execution-environment code list.',
  ProcessorRoleValues: 'Current-action-owner role or queue code list.',
  AvailabilityStatuses: 'Developer availability code list.',
  ResponsibilityLevels: 'Developer responsibility strength code list.',
  ActionTypes: 'Exact workflow and audit action type catalog.',
  NotificationEventTypes: 'Notification business-event code list.',
  NotificationChannels: 'In-app and email channel code list.',
  NotificationDeliveryStatuses: 'Delivery state catalog for in-app and email processing.',
  DuplicateRelationTypes: 'Confirmed duplicate/similar/related relation catalog.',
  AiSuggestionFeatureTypes: 'AI advisory feature catalog.',
  AiSuggestionReviewStates: 'Human review-state catalog for AI suggestions.',
  Users: 'Internal IDTS business profile mapped to a platform identity on SAP BTP.',
  AuthSessions: 'Custom-auth session store used outside the XSUAA production profile.',
  DeveloperProfiles: 'Developer capacity and availability profile.',
  SAPModules: 'Optional SAP module classification master data.',
  ApplicationComponents: 'Application component classification master data.',
  SAPModuleComponents: 'Allowed SAP module-to-component mapping.',
  DefectCategories: 'Defect category master data.',
  ComponentCategories: 'Validated component and defect-category combination used for assignment.',
  DeveloperResponsibilities: 'Developer capability mapping used by assignment and workload views.',
  Bugs: 'Authoritative defect record and workflow state.',
  Comments: 'User-authored collaboration records linked to a Bug.',
  Bugs_attachments: 'Attachment metadata and object-store reference; binary content is provided by AWS S3 in BTP.',
  ScanStates: 'Attachment scan-state catalog supplied by @cap-js/attachments.',
  ScanStates_texts: 'Localized attachment scan-state texts supplied by @cap-js/attachments.',
  HistoryEvents: 'User-facing immutable audit event grouped by business action.',
  HistoryLogs: 'Append-only field-level changes belonging to a HistoryEvent.',
  Notifications: 'In-app notification event and recipient state.',
  NotificationDeliveries: 'Email outbox payload, retry, lock and provider delivery state.',
  DuplicateLinks: 'Human-confirmed relation between two Bugs.',
  AiSuggestions: 'Sanitized AI advisory audit record and human review state.'
}

function csv (value) {
  const text = value === undefined || value === null ? '' : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function normalizeIdentifier (value) {
  return String(value).replace(/^"|"$/g, '')
}

function tableKey (physicalName) {
  return physicalName
    .replace(/^idts_cap_/, '')
    .replace(/^sap_attachments_/, '')
}

function parseCreateTable (statement) {
  const match = statement.match(/^CREATE TABLE\s+([^\s(]+)\s*\(([\s\S]*)\);$/i)
  if (!match) return null
  const physicalTable = normalizeIdentifier(match[1])
  const body = match[2]
  const primaryKey = new Set()
  const pkMatch = body.match(/PRIMARY KEY\(([^)]+)\)/i)
  if (pkMatch) {
    for (const key of pkMatch[1].split(',')) primaryKey.add(normalizeIdentifier(key.trim()))
  }

  const columns = []
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/,$/, '')
    if (!line || /^PRIMARY KEY/i.test(line) || /^CONSTRAINT/i.test(line)) continue
    const columnMatch = line.match(/^("[^"]+"|[A-Za-z0-9_]+)\s+(.+)$/)
    if (!columnMatch) continue
    const name = normalizeIdentifier(columnMatch[1])
    const definition = columnMatch[2]
    const defaultMatch = definition.match(/\sDEFAULT\s+(.+?)(?:\s+NOT NULL)?$/i)
    columns.push({
      physicalTable,
      column: name,
      dataType: definition
        .replace(/\s+DEFAULT\s+.+?(?=\s+NOT NULL|$)/i, '')
        .replace(/\s+NOT NULL$/i, '')
        .trim(),
      primaryKey: primaryKey.has(name) ? 'YES' : 'NO',
      nullable: /\bNOT NULL\b/i.test(definition) ? 'NO' : 'YES',
      defaultValue: defaultMatch ? defaultMatch[1].replace(/\s+NOT NULL$/i, '').trim() : ''
    })
  }
  return { physicalTable, columns }
}

function logicalEntityForTable (definitions, physicalTable) {
  return Object.entries(definitions).find(([name, definition]) => {
    if (definition.kind !== 'entity') return false
    return name.replace(/[.:]/g, '_') === physicalTable
  })
}

function relationshipMap (definition, definitions) {
  const relationships = new Map()
  for (const [elementName, element] of Object.entries(definition?.elements || {})) {
    if (!element.target) continue
    const target = definitions[element.target]
    const targetKeys = Object.entries(target?.elements || {}).filter(([, candidate]) => candidate.key)
    for (const [targetKey] of targetKeys) {
      relationships.set(`${elementName}_${targetKey}`, `${element.target}.${targetKey}`)
    }
  }
  return relationships
}

function retentionFor (key) {
  if (key === 'AuthSessions') return 'Until expiry/revocation; excluded from PostgreSQL-to-HANA migration.'
  if (key === 'HistoryEvents' || key === 'HistoryLogs') return 'Append-only audit retained for the project lifecycle.'
  if (key === 'NotificationDeliveries') return 'Operational delivery audit retained with sanitized provider details.'
  if (key === 'Bugs_attachments') return 'Retained with the Bug until authorized deletion; S3 binary follows the same lifecycle.'
  if (key === 'AiSuggestions') return 'Retained as sanitized advisory audit; expiry is represented by expiresAt when used.'
  return 'Project lifecycle or until an authorized business deletion applies.'
}

function ownerFor (key) {
  if (/^(UserRoles|StatusValues|PriorityValues|SeverityValues|EnvironmentValues|ProcessorRoleValues|AvailabilityStatuses|ResponsibilityLevels|ActionTypes|NotificationEventTypes|NotificationChannels|NotificationDeliveryStatuses|DuplicateRelationTypes|AiSuggestionFeatureTypes|AiSuggestionReviewStates|SAPModules|ApplicationComponents|DefectCategories|ComponentCategories|ScanStates)/.test(key)) return 'PM / DonHV master-data governance'
  if (/^(Users|AuthSessions|DeveloperProfiles|DeveloperResponsibilities|SAPModuleComponents)$/.test(key)) return 'DonHV identity and assignment data'
  if (/^(HistoryEvents|HistoryLogs)$/.test(key)) return 'System audit; DonHV governance'
  if (/^(Notifications|NotificationDeliveries)$/.test(key)) return 'System notification pipeline; DonHV operations'
  if (key === 'Bugs_attachments') return 'Bug collaboration; DonHV persistence boundary'
  if (key === 'AiSuggestions') return 'AI advisory audit; DonHV / PM review'
  return 'IDTS business workflow'
}

async function main () {
  const model = await cds.load('db')
  const sql = cds.compile.to.sql(model, { dialect: 'hana' })
  const tables = sql.map(parseCreateTable).filter(Boolean)
  const baseline = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim()

  const dictionaryRows = []
  for (const table of tables) {
    const logical = logicalEntityForTable(model.definitions, table.physicalTable)
    const logicalName = logical?.[0] || 'Framework-generated artifact'
    const entity = logical?.[1]
    const key = tableKey(table.physicalTable)
    const relationships = relationshipMap(entity, model.definitions)
    for (const column of table.columns) {
      dictionaryRows.push({
        logicalEntity: logicalName,
        physicalTable: table.physicalTable,
        column: column.column,
        dataType: column.dataType,
        primaryKey: column.primaryKey,
        nullable: column.nullable,
        defaultValue: column.defaultValue,
        relationship: relationships.get(column.column) || '',
        businessPurpose: PURPOSES[key] || 'Framework or supporting persistence artifact.',
        owner: ownerFor(key),
        retention: retentionFor(key)
      })
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const headers = ['Logical Entity', 'Physical HANA Table', 'Column', 'Data Type', 'Primary Key', 'Nullable', 'Default', 'Relationship / Target', 'Business Purpose', 'Owner', 'Retention']
  const csvLines = [headers.map(csv).join(',')]
  for (const row of dictionaryRows) csvLines.push(Object.values(row).map(csv).join(','))
  fs.writeFileSync(path.join(OUTPUT_DIR, 'database-dictionary.csv'), `${csvLines.join('\n')}\n`, 'utf8')

  const tableInventory = tables.map(table => {
    const logical = logicalEntityForTable(model.definitions, table.physicalTable)
    const key = tableKey(table.physicalTable)
    return `| \`${logical?.[0] || 'Framework-generated artifact'}\` | \`${table.physicalTable}\` | ${table.columns.length} | ${PURPOSES[key] || 'Framework or supporting persistence artifact.'} |`
  }).join('\n')

  const markdown = `# IDTS-107 — Technical Design, database and persistence candidate

> Gate status: **GATE 1 CANDIDATE — DONHV APPROVAL AND IDTS-112 INTEGRATION PENDING**
>
> This package is generated from the CDS model at baseline \`${baseline}\`. It is not the
> official Technical Specification workbook and must not be synchronized to Google Drive
> before the required human approval and template integration gates.

## 1. Source-of-truth baseline

| Item | Candidate value |
| --- | --- |
| Repository baseline | \`${baseline}\` |
| Logical data model | \`db/schema.cds\` |
| HANA deployment | \`idts-sap01-db\` HDI container through \`mta.yaml\` |
| Runtime service | \`idts-sap01-srv\` on SAP BTP Cloud Foundry |
| Local persistence | SQLite |
| Rollback baseline | Render/PostgreSQL; not a hot replica of HANA |
| Attachment binary | AWS S3 retained outside BTP; HANA stores metadata/reference |
| Email delivery | HANA outbox + SAP Job Scheduling Service + Brevo |
| AI acceptance | Disabled-provider/fallback only; live OpenAI is not accepted |

## 2. Persistence architecture

\`\`\`mermaid
flowchart LR
  Browser["Browser / Fiori UI"] --> Router["Standalone AppRouter"]
  Router --> XSUAA["SAP XSUAA"]
  Router --> CAP["CAP service: idts-sap01-srv"]
  CAP --> HDI["HDI container: idts-sap01-db"]
  HDI --> HANA["SAP HANA Cloud"]
  CAP --> S3["AWS S3 attachment binary"]
  Scheduler["SAP Job Scheduling Service"] --> CAP
  CAP --> Brevo["Brevo email provider"]
\`\`\`

The CAP service owns validation, authorization and transaction boundaries. UI visibility is
not an authorization control. HANA is authoritative for the active BTP runtime; the retained
PostgreSQL environment is a rollback baseline and does not receive HANA changes automatically.

## 3. Physical HANA table inventory

The CDS compiler produces ${tables.length} physical tables and ${dictionaryRows.length} physical
columns for the current HANA dialect. HANA Database Explorer may display unquoted artifact names
in uppercase; the compiler names below are the reproducible source mapping.

| Logical entity | Physical HANA artifact | Columns | Purpose |
| --- | --- | ---: | --- |
${tableInventory}

The complete column-level dictionary is stored in
\`docs/pm/evidence/idts-107/technical-spec/database-dictionary.csv\`. It includes datatype,
primary key, nullability, default, relationship target, purpose, owner and retention.

## 4. Transaction and rollback boundaries

| Flow | Entry and source | Transaction behavior | Persistent side effects | Failure behavior |
| --- | --- | --- | --- | --- |
| Authentication | \`AuthService.login\` → \`srv/auth.js::login\` | \`cds.tx(req)\` reads Users and inserts AuthSessions for custom-auth profiles. XSUAA production resolves the active Users profile without creating a custom session. | Users read; AuthSessions insert only outside XSUAA production. | Invalid credentials return a safe denial. Unexpected errors are sanitized. |
| Draft create/save | Fiori draft \`NEW/PATCH/SAVE\` → \`srv/bug-service/drafts.js\` | Draft validation and activation run in the CAP request transaction. | Active Bugs row plus required history/notification side effects. | Validation failure prevents activation; transaction rollback prevents partial business state. |
| Active create/update | \`srv/service.js\` → \`prepareBugWrite\` | Backend derives status/classification and enforces permissions before persistence. | Bugs and associations are written only after validation. | Direct OData calls cannot bypass backend role, code-list or transition rules. |
| Lifecycle action | \`srv/bug-service/actions.js::transitionBug\` | Bug update, history, comment where applicable, and notification use the request transaction. | Bugs, HistoryEvents, HistoryLogs, Notifications and outbox rows. | Any required database side-effect failure rolls back the action. |
| Comment | \`addComment\` / \`prepareCommentCreate\` | Comment insert and audit side effects share the request transaction. | Comments plus history/notification records. | Invalid actor/content is rejected before a durable audit record is created. |
| Attachment | \`prepareAttachmentWrite\` plus @cap-js/attachments | CAP authorizes metadata operations; provider processing uses the configured attachment adapter. | HANA metadata/reference and AWS S3 binary. | Provider error is sanitized; no credential is exposed. Browser pre-save files remain client-memory only until Bug activation. |
| History | \`writeHistoryEvent\` in \`srv/bug-service/history.js\` | Event and field-level logs are inserted through \`cds.tx(req)\`. | Immutable HistoryEvents and HistoryLogs. | A required audit failure rolls back the related business action. |
| Notification/outbox | \`writeNotificationRecord\` in \`srv/email/outbox.js\` | In-app Notification and email delivery row are created with the business transaction; provider send is asynchronous. | Notifications and NotificationDeliveries. | Provider failure changes delivery state but does not roll back an already committed Bug workflow. |
| Email processing | Job Scheduler → \`processEmailOutbox\` → \`processEmailDeliveries\` | Eligible rows are claimed with lockToken/lockedUntil and updated per attempt. | attemptCount, retry time, SENT/FAILED/SKIPPED state and sanitized provider summary. | Locking prevents duplicate workers from claiming the same delivery; retries stop at the configured maximum. |
| HANA migration | \`scripts/btp/import-hana.js\` | All allowlisted entity replacement/import operations execute inside one \`db.tx\`. | UUID-preserving import into HDI-managed tables. | Count/key/checksum mismatch throws and rolls back the complete import. AuthSessions are explicitly omitted. |

## 5. Migration, security and retention controls

| Control | Candidate explanation |
| --- | --- |
| Allow-list | Migration uses a fixed entity order rather than exporting every database object. |
| Identity continuity | UUID keys and association values are preserved. Approved FPT member profiles and intentional demo Developers remain separate records. |
| Session safety | AuthSessions are not migrated. Historical password hashes are not used by XSUAA production login. |
| Email safety | Historical retryable email rows were normalized so cutover cannot resend old mail. |
| Secret safety | BTP bindings provide HANA, S3 and Brevo values. Workbooks/evidence contain no service key, token, DB URL or recipient list. |
| Attachment boundary | HANA stores metadata and reference fields; AWS S3 stores binary objects. |
| Audit retention | HistoryEvents/HistoryLogs are append-only evidence for the project lifecycle. |
| Rollback | Render/PostgreSQL can restore the previous platform baseline, but HANA-only deltas require explicit reconciliation because replication is not continuous. |

## 6. Accepted evidence references

- \`docs/pm/evidence/idts-113/btp-hana-migration-integrations-local-verification-20260728.md\`
- \`docs/pm/evidence/idts-113/btp-auth-jobscheduler-smoke-20260728.md\`
- \`docs/pm/evidence/idts-113/btp-render-rollback-drill-20260728.md\`
- \`docs/pm/evidence/idts-113/hana-final-container-user-classification-20260728.md\`
- \`docs/pm/evidence/idts-113/technical-spec-btp-delta-candidate.md\`

## 7. Missing evidence and approval register

| Item | Status | Required owner action |
| --- | --- | --- |
| DonHV briefing acknowledgment | PENDING | DonHV reads the committed IDTS-105 briefing and records the Jira/repo acknowledgment personally. |
| DonHV candidate approval | PENDING | Review the generated table/column dictionary, transaction descriptions and evidence links. |
| HANA Database Explorer image for dictionary section | MISSING EVIDENCE — owner action required | Capture a sanitized screenshot of the final HDI container/table view without credentials or private values. |
| Native Fiori attachment picker | MISSING EVIDENCE — owner action required | Enable approved Chrome upload permission and capture upload/download/reload/delete evidence. |
| Developer and Tester role matrix | MISSING EVIDENCE — member action required | Provisioned members sign in with their own SAP identities; DonHV records authorized and denied cases. |
| IDTS-112 workbook integration | BLOCKED | Integrate only after IDTS-107/108/109 packages receive their respective human approvals. |

## 8. Gate decision

This package completes the agent-prepared candidate portion only. It deliberately does not mark
IDTS-107 Done, approve on behalf of DonHV, update the official Technical Specification workbook,
or synchronize Google Drive.
`

  fs.writeFileSync(path.join(OUTPUT_DIR, 'database-persistence-candidate.md'), markdown, 'utf8')

  console.log(JSON.stringify({
    baseline,
    outputDir: path.relative(PROJECT_ROOT, OUTPUT_DIR),
    tableCount: tables.length,
    columnCount: dictionaryRows.length
  }, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
