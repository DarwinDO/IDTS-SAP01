'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const {
  ENTITY_ORDER,
  OMITTED_ENTITIES,
  decodeRows,
  encodeRows,
  entityKeyColumns,
  mapPostgresRowToCds,
  postgresTableName,
  prepareRowsForTarget,
  rowKey
} = require('../btp/lib/hana-migration')

let passed = 0

function test (name, fn) {
  fn()
  passed += 1
  console.log(`PASS: ${name}`)
}

test('migration inventory is explicit and excludes AuthSessions', () => {
  assert.equal(ENTITY_ORDER.includes('idts.cap.AuthSessions'), false)
  assert.deepEqual(OMITTED_ENTITIES, ['idts.cap.AuthSessions'])
  assert.equal(ENTITY_ORDER.includes('idts.cap.Bugs.attachments'), true)
})

test('Render CLI export maps CAP entities to physical PostgreSQL tables', () => {
  assert.equal(postgresTableName('idts.cap.Users'), 'idts_cap_users')
  assert.equal(postgresTableName('idts.cap.Bugs.attachments'), 'idts_cap_bugs_attachments')
})

test('PostgreSQL lowercase columns are restored to CDS names before policy transforms', () => {
  const definition = {
    elements: {
      ID: {},
      createdAt: {},
      applicationComponent: {
        isAssociation: true,
        keys: [{ ref: ['ID'] }]
      }
    }
  }
  assert.deepEqual(mapPostgresRowToCds(definition, {
    id: 'BUG-1',
    createdat: '2026-07-28T00:00:00.000Z',
    applicationcomponent_id: 'COMPONENT-1'
  }), {
    ID: 'BUG-1',
    createdAt: '2026-07-28T00:00:00.000Z',
    applicationComponent_ID: 'COMPONENT-1'
  })
})

test('XSUAA migration clears password hashes without changing user IDs', () => {
  const [user] = prepareRowsForTarget('idts.cap.Users', [{
    ID: 'USER-1',
    email: 'masked@example.invalid',
    passwordHash: 'private-hash'
  }])
  assert.equal(user.ID, 'USER-1')
  assert.equal(user.passwordHash, null)
})

test('historical unsent deliveries are not retried after cutover', () => {
  for (const status_code of ['PENDING', 'FAILED']) {
    const [delivery] = prepareRowsForTarget('idts.cap.NotificationDeliveries', [{
      ID: `DELIVERY-${status_code}`,
      status_code,
      nextAttemptAt: '2026-07-29T00:00:00.000Z',
      lockToken: 'old-lock',
      lockedUntil: '2026-07-29T00:00:00.000Z'
    }])
    assert.equal(delivery.status_code, 'SKIPPED')
    assert.equal(delivery.nextAttemptAt, null)
    assert.equal(delivery.lockToken, null)
    assert.equal(delivery.lastErrorCode, 'MIGRATION_CUTOVER_SKIP')
  }
})

test('sent deliveries stay sent', () => {
  const [delivery] = prepareRowsForTarget('idts.cap.NotificationDeliveries', [{
    ID: 'DELIVERY-SENT',
    status_code: 'SENT',
    providerMessageId: 'provider-id'
  }])
  assert.equal(delivery.status_code, 'SENT')
  assert.equal(delivery.providerMessageId, 'provider-id')
})

test('attachment binary can be encoded and decoded without byte changes', () => {
  const original = Buffer.from('idts-attachment')
  const decoded = decodeRows(encodeRows([{ ID: 'ATTACHMENT-1', content: original }]))
  assert.equal(Buffer.compare(decoded[0].content, original), 0)
})

test('composition keys use their flattened persistence columns', () => {
  assert.deepEqual(entityKeyColumns({
    keys: {
      up_: {
        isAssociation: true,
        keys: [{ ref: ['ID'] }]
      },
      ID: {}
    }
  }), ['up__ID', 'ID'])
})

test('HANA uppercase result columns verify against logical key names', () => {
  assert.equal(rowKey({ CODE: 'PM' }, ['code']), '["PM"]')
  assert.equal(
    rowKey({ UP__ID: 'BUG-1', ID: 'ATTACHMENT-1' }, ['up__ID', 'ID']),
    '["BUG-1","ATTACHMENT-1"]'
  )
})

test('import requires explicit execute and one transaction', () => {
  const source = fs.readFileSync(path.join(__dirname, '../btp/import-hana.js'), 'utf8')
  const helperSource = fs.readFileSync(path.join(__dirname, '../btp/lib/hana-migration.js'), 'utf8')
  assert.match(source, /args\.execute === true/)
  assert.match(source, /await db\.tx\(async tx =>/)
  assert.match(source, /\[\.\.\.ENTITY_ORDER\]\.reverse\(\)/)
  assert.match(source, /await tx\.run\(DELETE\.from\(entity\)\)/)
  assert.ok(source.indexOf('DELETE.from(entity)') < source.indexOf('UPSERT.into(entity)'))
  assert.match(source, /UPSERT\.into\(entity\)/)
  assert.match(source, /await tx\.run\(SELECT\.from\(entity\)/)
  assert.match(source, /entityKeyColumns\(definition\)/)
  assert.match(source, /targetRows\.length !== rows\.length/)
  assert.match(helperSource, /MIGRATION_SOURCE_KEY_MISSING/)
  assert.match(source, /MIGRATION_TARGET_KEY_MISMATCH/)
  assert.doesNotMatch(source, /cds deploy|child_process/)
})

console.log(`IDTS-113 HANA migration checks: ${passed}/${passed} PASS`)
