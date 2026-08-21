'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { STATUSES, initializeStatuses, inspectStatusCatalog, verifyExistingRows } = require('../btp/initialize-user-onboarding-statuses');

function fakeDb (initial = []) {
  const rows = initial.map((row) => ({ ...row }));
  const calls = [];
  return {
    calls,
    rows,
    async run (sql, parameters = []) {
      calls.push({ sql, parameters });
      if (/^SELECT/.test(sql.trim())) return rows.map((row) => ({ ...row }));
      if (/^INSERT/.test(sql.trim())) {
        rows.push(Object.fromEntries(['code', 'name', 'descr', 'sortOrder', 'active', 'criticality'].map((key, index) => [key, parameters[index]])));
        return 1;
      }
      throw new Error('Unexpected SQL');
    },
    async begin () { calls.push({ sql: 'BEGIN' }); },
    async commit () { calls.push({ sql: 'COMMIT' }); },
    async rollback () { calls.push({ sql: 'ROLLBACK' }); }
  };
}

(async () => {
  assert.equal(STATUSES.length, 15);
  const csv = fs.readFileSync(path.join(__dirname, '../../db/data/idts.cap-UserOnboardingStatuses.csv'), 'utf8').trim().split(/\r?\n/);
  assert.deepEqual(csv.slice(1).map((line) => line.split(',')[0]), STATUSES.map((row) => row.code));
  const procfile = fs.readFileSync(path.join(__dirname, '../btp/user-onboarding-status-init.Procfile'), 'utf8').trim().split(/\r?\n/);
  assert.deepEqual(procfile, [
    'status-inspect: node initialize-user-onboarding-statuses.js --inspect-only',
    'status-init: node initialize-user-onboarding-statuses.js'
  ]);

  const empty = fakeDb();
  const initialized = await initializeStatuses(empty);
  assert.equal(initialized.result, 'INITIALIZED');
  assert.equal(initialized.rowCount, 15);
  assert.equal(empty.calls.filter((call) => /^INSERT/.test(call.sql)).length, 15);
  assert.equal(empty.calls.some((call) => call.sql === 'COMMIT'), true);
  assert.equal(empty.calls.some((call) => call.sql === 'ROLLBACK'), false);
  assert.equal(empty.calls.some((call) => /UPDATE|DELETE|MERGE|UPSERT|DROP|ALTER|CREATE/i.test(call.sql)), false);

  const existing = fakeDb(STATUSES);
  const noop = await initializeStatuses(existing);
  assert.equal(noop.result, 'NOOP');
  assert.equal(existing.calls.filter((call) => /^INSERT/.test(call.sql)).length, 0);
  assert.equal(existing.calls.some((call) => call.sql === 'BEGIN'), false);
  assert.deepEqual(await inspectStatusCatalog(existing), { rowCount: 15, exact: true });
  assert.deepEqual(await inspectStatusCatalog(fakeDb()), { rowCount: 0, exact: false });

  const legacyCatalog = fakeDb(STATUSES.filter((row) => row.code !== 'SUSPENDED'));
  const upgraded = await initializeStatuses(legacyCatalog);
  assert.equal(upgraded.result, 'INITIALIZED');
  assert.equal(upgraded.rowCount, 15);
  assert.equal(legacyCatalog.calls.filter((call) => /^INSERT/.test(call.sql)).length, 1);
  assert.equal(legacyCatalog.rows.find((row) => row.code === 'SUSPENDED').sortOrder, 105);

  const partial = fakeDb(STATUSES.slice(0, 3));
  const completed = await initializeStatuses(partial);
  assert.equal(completed.result, 'INITIALIZED');
  assert.equal(partial.calls.filter((call) => /^INSERT/.test(call.sql)).length, 12);

  assert.throws(() => verifyExistingRows([{ ...STATUSES[0], name: 'Wrong' }]), /unexpected or conflicting/);
  assert.throws(() => verifyExistingRows([...STATUSES, { ...STATUSES[0] }]), /unexpected or conflicting/);
  assert.throws(() => verifyExistingRows([{ ...STATUSES[0], code: 'UNKNOWN' }]), /unexpected or conflicting/);

  const mismatch = fakeDb();
  const originalRun = mismatch.run;
  mismatch.run = async function (sql, params) {
    const value = await originalRun.call(this, sql, params);
    if (/^SELECT/.test(sql.trim()) && this.rows.length === 15) return this.rows.slice(0, 14);
    return value;
  };
  await assert.rejects(() => initializeStatuses(mismatch), /readback did not match/);
  assert.equal(mismatch.calls.some((call) => call.sql === 'ROLLBACK'), true);

  console.log('User onboarding status initializer: PASS');
})().catch((error) => {
  console.error(`User onboarding status initializer: FAIL (${error.message})`);
  process.exitCode = 1;
});
