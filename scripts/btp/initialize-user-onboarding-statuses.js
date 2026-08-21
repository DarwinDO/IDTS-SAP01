#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const { createHdiDatabase } = require('./run-user-admin-logical-backup');

const TABLE = 'IDTS_CAP_USERONBOARDINGSTATUSES';
const COLUMNS = ['code', 'name', 'descr', 'sortOrder', 'active', 'criticality'];
const STATUSES = Object.freeze([
  ['INVITED', 'Invited', 'Invitation created and awaiting SAP identity verification', 10, true, 1],
  ['IDENTITY_VERIFIED', 'Identity Verified', 'SAP identity was verified for the invitation', 20, true, 2],
  ['PENDING_APPROVAL', 'Pending Approval', 'SAP identity is verified and awaits PM approval', 30, true, 2],
  ['PROVISION_QUEUED', 'Provision Queued', 'Approved access is queued for provisioning', 40, true, 2],
  ['PROVISIONING', 'Provisioning', 'External access provisioning is in progress', 50, true, 2],
  ['ROLE_CHANGE_QUEUED', 'Role Change Queued', 'Approved role change is queued', 60, true, 2],
  ['ROLE_CHANGING', 'Role Changing', 'External role change is in progress', 70, true, 2],
  ['REVOKE_QUEUED', 'Revoke Queued', 'Access revocation is queued and local access is suspended', 80, true, 2],
  ['REVOKING', 'Revoking', 'External access revocation is in progress', 90, true, 2],
  ['ACTIVE', 'Active', 'User access is active and reconciled', 100, true, 3],
  ['SUSPENDED', 'Suspended', 'IDTS-local access is suspended pending an explicit reactivation.', 105, true, 1],
  ['RETRYABLE_FAILURE', 'Retryable Failure', 'Provisioning failed temporarily and may be retried', 110, true, 1],
  ['BLOCKED_MANUAL_REVIEW', 'Manual Review Required', 'Provisioning requires human review', 120, true, 1],
  ['FAILED', 'Failed', 'Invitation or onboarding failed before provisioning', 130, true, 1],
  ['REVOKED', 'Revoked', 'Provisioned access was revoked', 140, true, 0]
].map((values) => Object.freeze(Object.fromEntries(COLUMNS.map((column, index) => [column, values[index]])))));

function normalizeRow (row) {
  return {
    code: String(row.CODE ?? row.code),
    name: String(row.NAME ?? row.name),
    descr: String(row.DESCR ?? row.descr),
    sortOrder: Number(row.SORTORDER ?? row.sortOrder),
    active: Boolean(row.ACTIVE ?? row.active),
    criticality: Number(row.CRITICALITY ?? row.criticality)
  };
}

function canonical (rows) {
  return JSON.stringify(rows.map(normalizeRow).sort((left, right) => left.code.localeCompare(right.code)));
}

function digestPrefix (rows) {
  return crypto.createHash('sha256').update(canonical(rows)).digest('hex').slice(0, 12);
}

function verifyExistingRows (rows) {
  const desired = new Map(STATUSES.map((row) => [row.code, canonical([row])]));
  const seen = new Set();
  for (const raw of rows) {
    const row = normalizeRow(raw);
    if (seen.has(row.code) || !desired.has(row.code) || canonical([row]) !== desired.get(row.code)) {
      throw new Error('The onboarding status catalog contains an unexpected or conflicting row.');
    }
    seen.add(row.code);
  }
  return STATUSES.filter((row) => !seen.has(row.code));
}

async function selectRows (db) {
  return db.run(
    `SELECT "CODE", "NAME", "DESCR", "SORTORDER", "ACTIVE", "CRITICALITY" FROM "${TABLE}" ORDER BY "CODE"`
  );
}

async function initializeStatuses (db) {
  let stage = 'READ_BEFORE';
  try {
  const before = await selectRows(db);
  stage = 'VALIDATE_BEFORE';
  const missing = verifyExistingRows(before);
  if (missing.length === 0) {
    return { result: 'NOOP', rowCount: before.length, digestPrefix: digestPrefix(before) };
  }

  stage = 'BEGIN';
  await db.begin();
  try {
    const sql = `INSERT INTO "${TABLE}" ("CODE", "NAME", "DESCR", "SORTORDER", "ACTIVE", "CRITICALITY") VALUES (?, ?, ?, ?, ?, ?)`;
    stage = 'INSERT';
    for (const row of missing) await db.run(sql, COLUMNS.map((column) => row[column]));
    stage = 'READ_AFTER';
    const after = await selectRows(db);
    stage = 'VALIDATE_AFTER';
    if (after.length !== STATUSES.length || canonical(after) !== canonical(STATUSES)) {
      throw new Error('The onboarding status catalog readback did not match the exact allowlist.');
    }
    stage = 'COMMIT';
    await db.commit();
    return { result: 'INITIALIZED', rowCount: after.length, digestPrefix: digestPrefix(after) };
  } catch (error) {
    const failedStage = stage;
    stage = 'ROLLBACK';
    await db.rollback();
    error.safeStage = failedStage;
    throw error;
  }
  } catch (error) {
    if (!error.safeStage) error.safeStage = stage;
    throw error;
  }
}

async function inspectStatusCatalog (db) {
  const rows = await selectRows(db);
  return { rowCount: rows.length, exact: rows.length === STATUSES.length && canonical(rows) === canonical(STATUSES) };
}

async function main () {
  let db;
  try {
    db = await createHdiDatabase();
    const result = process.argv.includes('--inspect-only')
      ? await inspectStatusCatalog(db)
      : await initializeStatuses(db);
    const safe = Buffer.from(JSON.stringify(result), 'utf8').toString('base64');
    console.log(`IDTS_UA_STATUS_INIT=${safe}`);
  } catch (error) {
    console.error(`IDTS_UA_STATUS_INIT=FAIL;CODE=${error?.safeStage || 'CONNECT'}`);
    process.exitCode = 1;
  } finally {
    if (db) await db.disconnect();
  }
}

if (require.main === module) main();

module.exports = { STATUSES, canonical, initializeStatuses, inspectStatusCatalog, verifyExistingRows };
