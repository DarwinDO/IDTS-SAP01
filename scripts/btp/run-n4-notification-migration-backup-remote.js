'use strict'

const { createCipheriv, createHash, publicEncrypt, randomBytes, constants } = require('node:crypto')
const hdb = require('hdb')

const publicKey = Buffer.from('__PUBLIC_KEY_B64__', 'base64').toString('utf8')
const datasets = [
  {
    key: 'notifications', table: 'IDTS_CAP_NOTIFICATIONS', temp: '#IDTS_N4_NOTIFICATIONS_RESTORE', order: 'ID',
    columns: [['ID', 'ID'], ['createdAt', 'CREATEDAT'], ['createdBy', 'CREATEDBY'], ['modifiedAt', 'MODIFIEDAT'], ['modifiedBy', 'MODIFIEDBY'], ['bug_ID', 'BUG_ID'], ['recipient_ID', 'RECIPIENT_ID'], ['eventType_code', 'EVENTTYPE_CODE'], ['channel_code', 'CHANNEL_CODE'], ['deliveryStatus_code', 'DELIVERYSTATUS_CODE'], ['message', 'MESSAGE'], ['sentAt', 'SENTAT']],
    ddl: '"ID" NVARCHAR(36) NOT NULL, "createdAt" TIMESTAMP, "createdBy" NVARCHAR(255), "modifiedAt" TIMESTAMP, "modifiedBy" NVARCHAR(255), "bug_ID" NVARCHAR(36) NOT NULL, "recipient_ID" NVARCHAR(36) NOT NULL, "eventType_code" NVARCHAR(40) NOT NULL, "channel_code" NVARCHAR(40), "deliveryStatus_code" NVARCHAR(40) NOT NULL, "message" NVARCHAR(500), "sentAt" TIMESTAMP'
  },
  {
    key: 'eventTypes', table: 'IDTS_CAP_NOTIFICATIONEVENTTYPES', temp: '#IDTS_N4_EVENTTYPES_RESTORE', order: 'code',
    columns: [['code', 'CODE'], ['name', 'NAME'], ['descr', 'DESCR'], ['sortOrder', 'SORTORDER'], ['active', 'ACTIVE'], ['criticality', 'CRITICALITY']],
    ddl: '"code" NVARCHAR(40) NOT NULL, "name" NVARCHAR(120) NOT NULL, "descr" NVARCHAR(255), "sortOrder" INTEGER, "active" BOOLEAN, "criticality" INTEGER'
  }
]
const quote = value => `"${String(value).replaceAll('"', '""')}"`

function callback (register) {
  return new Promise((resolve, reject) => register((error, result) => error ? reject(error) : resolve(result)))
}

async function createDatabase () {
  const candidates = Object.values(JSON.parse(process.env.VCAP_SERVICES || '{}'))
    .flatMap(entries => Array.isArray(entries) ? entries : [])
    .filter(binding => binding?.credentials?.user && binding?.credentials?.password && binding?.credentials?.host && binding?.credentials?.schema)
  if (candidates.length !== 1) throw new Error('BINDING')
  const credentials = candidates[0].credentials
  const client = hdb.createClient({
    host: credentials.host,
    port: Number(credentials.port),
    user: credentials.user,
    password: credentials.password,
    useTLS: credentials.encrypt !== false,
    rejectUnauthorized: credentials.validate_certificate !== false,
    ...(credentials.certificate ? { ca: credentials.certificate } : {})
  })
  client.on('error', () => {})
  await callback(client.connect.bind(client))
  async function run (sql, parameters = []) {
    if (parameters.length === 0) return callback(done => client.exec(sql, done))
    const statement = await callback(done => client.prepare(sql, done))
    try { return await callback(done => statement.exec(parameters, done)) } finally { await callback(done => statement.drop(done)) }
  }
  await run(`SET SCHEMA ${quote(credentials.schema)}`)
  return {
    run,
    async disconnect () {
      if (client.readyState === 'connected') await callback(client.disconnect.bind(client))
      else client.end()
    }
  }
}

function encryptCanonicalDocument (canonical) {
  const key = randomBytes(32)
  const iv = randomBytes(12)
  try {
    const cipher = createCipheriv('aes-256-gcm', key, iv)
    const ciphertext = Buffer.concat([cipher.update(canonical, 'utf8'), cipher.final()])
    return {
      version: 1,
      alg: 'RSA-OAEP-SHA256+A256GCM',
      encryptedKey: publicEncrypt({ key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, key).toString('base64'),
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      ciphertext: ciphertext.toString('base64')
    }
  } finally {
    key.fill(0)
  }
}

async function read (db, temporary) {
  const result = {}
  for (const dataset of datasets) {
    const columns = dataset.columns.map(([logical, physical]) => `${quote(temporary ? logical : physical)} AS ${quote(logical)}`).join(', ')
    const physicalOrder = dataset.columns.find(([logical]) => logical === dataset.order)[1]
    result[dataset.key] = await db.run(`SELECT ${columns} FROM ${quote(temporary ? dataset.temp : dataset.table)} ORDER BY ${quote(temporary ? dataset.order : physicalOrder)}`)
  }
  return result
}

async function main () {
  let db
  let stage = 'CONNECT'
  try {
    db = await createDatabase()
    stage = 'SOURCE_READ'
    const source = await read(db, false)
    if (datasets.some(dataset => !Array.isArray(source[dataset.key]) || source[dataset.key].length === 0)) throw new Error('EMPTY')
    const document = { version: 1, datasets: datasets.map(dataset => ({ key: dataset.key, rows: source[dataset.key] })) }
    const canonical = JSON.stringify(document)
    for (const dataset of datasets) {
      stage = `TEMP_CREATE_${dataset.key}`
      await db.run(`CREATE LOCAL TEMPORARY COLUMN TABLE ${quote(dataset.temp)} (${dataset.ddl})`)
      const logical = dataset.columns.map(([name]) => name)
      const insert = `INSERT INTO ${quote(dataset.temp)} (${logical.map(quote).join(', ')}) VALUES (${logical.map(() => '?').join(', ')})`
      stage = `TEMP_INSERT_${dataset.key}`
      for (const row of source[dataset.key]) await db.run(insert, logical.map(column => row[column]))
    }
    stage = 'TEMP_READBACK'
    const restored = await read(db, true)
    const restoredCanonical = JSON.stringify({ version: 1, datasets: datasets.map(dataset => ({ key: dataset.key, rows: restored[dataset.key] })) })
    if (canonical !== restoredCanonical) throw new Error('MISMATCH')
    stage = 'ENCRYPT'
    const envelope = encryptCanonicalDocument(canonical)
    const counts = Object.fromEntries(datasets.map(dataset => [dataset.key, source[dataset.key].length]))
    const meta = { totalRowCount: Object.values(counts).reduce((sum, count) => sum + count, 0), counts, digestPrefix: createHash('sha256').update(canonical).digest('hex').slice(0, 12) }
    console.log(`IDTS_N4_BACKUP_META=${Buffer.from(JSON.stringify(meta)).toString('base64')}`)
    console.log(`IDTS_N4_BACKUP_ENVELOPE=${Buffer.from(JSON.stringify(envelope)).toString('base64')}`)
  } catch {
    console.error(`IDTS_N4_BACKUP_RESULT=FAIL;CODE=${stage}`)
    process.exitCode = 1
  } finally {
    if (db) await db.disconnect()
  }
}

main()
