#!/usr/bin/env node
'use strict';

const { createHdiDatabase } = require('./run-user-admin-logical-backup');

function number (row, key) {
  return Number(row?.[key] ?? row?.[key.toLowerCase()] ?? -1);
}

async function countTable (db, table) {
  const rows = await db.run(`SELECT COUNT(*) AS ROWCOUNT FROM "${table}"`);
  return number(rows[0], 'ROWCOUNT');
}

async function inspectSchema (db) {
  const usersRows = await db.run(`
    SELECT COUNT(*) AS ROWCOUNT,
           SUM(CASE WHEN "EXTERNALIDENTITYORIGIN" IS NULL THEN 1 ELSE 0 END) AS ORIGINNULLS,
           SUM(CASE WHEN "EXTERNALIDENTITYISSUER" IS NULL THEN 1 ELSE 0 END) AS ISSUERNULLS,
           SUM(CASE WHEN "EXTERNALIDENTITYSUBJECT" IS NULL THEN 1 ELSE 0 END) AS SUBJECTNULLS,
           SUM(CASE WHEN "EXTERNALIDENTITYKEYHASH" IS NULL THEN 1 ELSE 0 END) AS HASHNULLS
      FROM "IDTS_CAP_USERS"
  `);
  const users = usersRows[0];
  const rowCount = number(users, 'ROWCOUNT');
  const nullCounts = ['ORIGINNULLS', 'ISSUERNULLS', 'SUBJECTNULLS', 'HASHNULLS'].map((key) => number(users, key));
  if (rowCount < 0 || nullCounts.some((value) => value !== rowCount)) {
    throw new Error('Users identity-column readback mismatch.');
  }
  return {
    users: { rowCount, externalIdentityNullRows: rowCount },
    userAccessOperations: await countTable(db, 'IDTS_CAP_USERACCESSOPERATIONS'),
    userIdentityAuditEvents: await countTable(db, 'IDTS_CAP_USERIDENTITYAUDITEVENTS'),
    userOnboardingDeliveries: await countTable(db, 'IDTS_CAP_USERONBOARDINGDELIVERIES'),
    userOnboardingRequests: await countTable(db, 'IDTS_CAP_USERONBOARDINGREQUESTS'),
    userOnboardingStatuses: await countTable(db, 'IDTS_CAP_USERONBOARDINGSTATUSES')
  };
}

async function main () {
  let db;
  try {
    db = await createHdiDatabase();
    const result = await inspectSchema(db);
    console.log(`IDTS_UA_SCHEMA_INSPECTION=${Buffer.from(JSON.stringify(result), 'utf8').toString('base64')}`);
  } catch {
    console.error('IDTS_UA_SCHEMA_INSPECTION=FAIL');
    process.exitCode = 1;
  } finally {
    if (db) await db.disconnect();
  }
}

if (require.main === module) main();

module.exports = { inspectSchema };
