#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const { createHdiDatabase } = require('./run-user-admin-logical-backup');

const TABLE = 'IDTS_CAP_USERONBOARDINGSTATUSES';
const REQUESTS_TABLE = 'IDTS_CAP_USERONBOARDINGREQUESTS';
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
const LEGACY_STATUSES = Object.freeze(STATUSES.filter((row) => row.code !== 'SUSPENDED'));

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

function exactRows (rows, expected) {
  return rows.length === expected.length && canonical(rows) === canonical(expected);
}

async function suspendedReferenceCount (db) {
  const rows = await db.run(
    `SELECT COUNT(*) AS "COUNT" FROM "${REQUESTS_TABLE}" WHERE "STATUS_CODE" = ?`,
    ['SUSPENDED']
  );
  const count = Number(rows?.[0]?.COUNT ?? rows?.[0]?.count);
  if (!Number.isInteger(count) || count < 0) throw new Error('The suspended-reference readback was invalid.');
  return count;
}

async function inspectSuspendedRollback (db) {
  const rows = await selectRows(db);
  if (exactRows(rows, LEGACY_STATUSES)) {
    return { rowCount: rows.length, exact: true, suspendedReferences: 0, eligible: false };
  }
  if (!exactRows(rows, STATUSES)) {
    return { rowCount: rows.length, exact: false, suspendedReferences: null, eligible: false };
  }
  const references = await suspendedReferenceCount(db);
  return { rowCount: rows.length, exact: true, suspendedReferences: references, eligible: references === 0 };
}

async function rollbackSuspendedStatus (db) {
  let stage = 'READ_BEFORE';
  try {
    const before = await selectRows(db);
    if (exactRows(before, LEGACY_STATUSES)) {
      return { result: 'NOOP', rowCount: before.length, digestPrefix: digestPrefix(before) };
    }
    stage = 'VALIDATE_BEFORE';
    if (!exactRows(before, STATUSES)) throw new Error('The onboarding status catalog is not eligible for rollback.');
    stage = 'REFERENCE_READ';
    if (await suspendedReferenceCount(db) !== 0) throw new Error('The suspended status is referenced and cannot be rolled back.');

    stage = 'BEGIN';
    await db.begin();
    try {
      stage = 'DELETE';
      await db.run(`DELETE FROM "${TABLE}" WHERE "CODE" = ?`, ['SUSPENDED']);
      stage = 'READ_AFTER';
      const after = await selectRows(db);
      stage = 'VALIDATE_AFTER';
      if (!exactRows(after, LEGACY_STATUSES)) {
        throw new Error('The onboarding status rollback readback did not match the exact legacy allowlist.');
      }
      stage = 'COMMIT';
      await db.commit();
      return { result: 'ROLLED_BACK', rowCount: after.length, digestPrefix: digestPrefix(after) };
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

async function main () {
  let db;
  try {
    db = await createHdiDatabase();
    const rollback = process.argv.includes('--rollback-suspended');
    const execute = process.argv.includes('--execute');
    if (execute && !rollback) throw new Error('Execute is only available for the suspended-status rollback.');
    const result = rollback
      ? (execute ? await rollbackSuspendedStatus(db) : await inspectSuspendedRollback(db))
      : (process.argv.includes('--inspect-only') ? await inspectStatusCatalog(db) : await initializeStatuses(db));
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

module.exports = {
  LEGACY_STATUSES,
  STATUSES,
  canonical,
  initializeStatuses,
  inspectStatusCatalog,
  inspectSuspendedRollback,
  rollbackSuspendedStatus,
  verifyExistingRows
};
