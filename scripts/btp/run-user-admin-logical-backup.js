#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  LEGACY_COLUMNS,
  canonicalizeRows,
  encryptBackup
} = require('./user-admin-logical-backup-contract');

const TEMP_TABLE = '#IDTS_UA_USERS_RESTORE';
const PUBLIC_KEY_PATH = path.join(__dirname, 'user-admin-logical-backup-public.pem');

function quoteIdentifier (value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function readHdiCredentials (env = process.env) {
  let services;
  try {
    services = JSON.parse(env.VCAP_SERVICES || '{}');
  } catch {
    throw new Error('Exactly one valid SAP HANA HDI binding is required.');
  }

  const candidates = Object.values(services)
    .flatMap((entries) => Array.isArray(entries) ? entries : [])
    .filter((binding) => binding?.credentials?.user && binding?.credentials?.password);
  const requested = String(env.IDTS_UA_HDI_SERVICE || '').trim();
  const matches = requested
    ? candidates.filter((binding) => [binding.name, binding.instance_name].includes(requested))
    : candidates;
  if (matches.length !== 1) throw new Error('Exactly one valid SAP HANA HDI binding is required.');

  const credentials = matches[0].credentials;
  if (!credentials.host || !credentials.schema || !Number.isFinite(Number(credentials.port))) {
    throw new Error('Exactly one valid SAP HANA HDI binding is required.');
  }
  return {
    host: credentials.host,
    port: Number(credentials.port),
    user: credentials.user,
    password: credentials.password,
    schema: credentials.schema,
    useTLS: credentials.encrypt !== false,
    rejectUnauthorized: credentials.validate_certificate !== false,
    ...(credentials.certificate ? { ca: credentials.certificate } : {})
  };
}

function callback (register) {
  return new Promise((resolve, reject) => register((error, result) => error ? reject(error) : resolve(result)));
}

async function runHdb (client, sql, parameters = []) {
  if (parameters.length === 0) return callback((done) => client.exec(sql, done));
  const statement = await callback((done) => client.prepare(sql, done));
  try {
    return await callback((done) => statement.exec(parameters, done));
  } finally {
    await callback((done) => statement.drop(done));
  }
}

async function createHdiDatabase (env = process.env, hdbModule = require('hdb')) {
  const credentials = readHdiCredentials(env);
  const client = hdbModule.createClient(credentials);
  client.on('error', () => {});
  await callback(client.connect.bind(client));
  client.setAutoCommit(true);
  await runHdb(client, `SET SCHEMA ${quoteIdentifier(credentials.schema)}`);
  return {
    run: (sql, parameters) => runHdb(client, sql, parameters),
    async begin () {
      client.setAutoCommit(false);
    },
    async commit () {
      await callback((done) => client.commit(done));
      client.setAutoCommit(true);
    },
    async rollback () {
      await callback((done) => client.rollback(done));
      client.setAutoCommit(true);
    },
    async disconnect () {
      if (client.readyState === 'connected') await callback(client.disconnect.bind(client));
      else client.end();
    }
  };
}

async function resolveLegacyLayout (db) {
  // HDI runtime/deployer principals are not guaranteed catalog visibility.
  // Query the exact CDS-generated table/columns directly; the SELECT and the
  // canonical row contract fail closed when any artifact differs.
  return {
    table: 'IDTS_CAP_USERS',
    physical: LEGACY_COLUMNS.map((column) => column.toUpperCase())
  };
}

function selectList (physical) {
  return physical.map((column, index) => `${quoteIdentifier(column)} AS ${quoteIdentifier(LEGACY_COLUMNS[index])}`).join(', ');
}

function createTemporaryTableSql () {
  return `CREATE LOCAL TEMPORARY COLUMN TABLE ${quoteIdentifier(TEMP_TABLE)} (` +
    '"ID" NVARCHAR(36) NOT NULL, "createdAt" TIMESTAMP, "createdBy" NVARCHAR(255), ' +
    '"modifiedAt" TIMESTAMP, "modifiedBy" NVARCHAR(255), "displayName" NVARCHAR(120) NOT NULL, ' +
    '"email" NVARCHAR(255) NOT NULL, "role_code" NVARCHAR(40) NOT NULL, "passwordHash" NVARCHAR(255), ' +
    '"passwordChangedAt" TIMESTAMP, "active" BOOLEAN)';
}

async function runBackupRehearsal ({ db, publicKey, emit = console.log }) {
  let stage = 'LAYOUT';
  try {
    const { table, physical } = await resolveLegacyLayout(db);
    stage = 'SOURCE_READ';
    const sourceRows = await db.run(
      `SELECT ${selectList(physical)} FROM ${quoteIdentifier(table)} ORDER BY ${quoteIdentifier(physical[0])}`
    );
    const source = canonicalizeRows(sourceRows);

    stage = 'TEMP_CREATE';
    await db.run(createTemporaryTableSql());
    const insert = `INSERT INTO ${quoteIdentifier(TEMP_TABLE)} (${LEGACY_COLUMNS.map(quoteIdentifier).join(', ')}) VALUES (${LEGACY_COLUMNS.map(() => '?').join(', ')})`;
    stage = 'TEMP_INSERT';
    for (const row of source.rows) {
      await db.run(insert, LEGACY_COLUMNS.map((column) => row[column]));
    }
    stage = 'TEMP_READBACK';
    const restoredRows = await db.run(
      `SELECT ${LEGACY_COLUMNS.map((column) => `${quoteIdentifier(column)} AS ${quoteIdentifier(column)}`).join(', ')} FROM ${quoteIdentifier(TEMP_TABLE)} ORDER BY "ID"`
    );
    let restored;
    try {
      restored = canonicalizeRows(restoredRows);
    } catch {
      throw new Error('The session-local restore rehearsal mismatch was detected.');
    }
    if (source.rowCount !== restored.rowCount || source.sha256 !== restored.sha256) {
      throw new Error('The session-local restore rehearsal mismatch was detected.');
    }

    stage = 'ENCRYPT';
    const envelope = encryptBackup(source.rows, publicKey);
    const meta = Buffer.from(JSON.stringify({ rowCount: source.rowCount, digestPrefix: source.sha256.slice(0, 12) }), 'utf8').toString('base64');
    emit(`IDTS_UA_BACKUP_META=${meta}`);
    emit(`IDTS_UA_BACKUP_ENVELOPE=${Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64')}`);
    return { rowCount: source.rowCount, digestPrefix: source.sha256.slice(0, 12), envelope };
  } catch (error) {
    if (!error.safeStage) error.safeStage = stage;
    throw error;
  }
}

async function main () {
  let db;
  let safeStage = 'CONNECT';
  try {
    db = await createHdiDatabase();
    safeStage = 'KEY_READ';
    const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
    safeStage = 'REHEARSAL';
    await runBackupRehearsal({ db, publicKey });
  } catch (error) {
    const code = error?.safeStage || safeStage;
    console.error(`IDTS_UA_BACKUP_RESULT=FAIL;CODE=${code}`);
    process.exitCode = 1;
  } finally {
    if (db) await db.disconnect();
  }
}

if (require.main === module) main();

module.exports = {
  createHdiDatabase,
  createTemporaryTableSql,
  readHdiCredentials,
  resolveLegacyLayout,
  runBackupRehearsal
};
