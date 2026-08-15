'use strict';

const assert = require('node:assert/strict');
const { generateKeyPairSync } = require('node:crypto');

const {
  LEGACY_COLUMNS,
  canonicalizeRows,
  encryptBackup,
  decryptBackup
} = require('../btp/user-admin-logical-backup-contract');
const {
  readHdiCredentials,
  runBackupRehearsal
} = require('../btp/run-user-admin-logical-backup');

const baseRow = Object.freeze({
  ID: '00000000-0000-0000-0000-000000000001',
  createdAt: '2026-01-01T00:00:00.000Z',
  createdBy: 'system',
  modifiedAt: '2026-01-02T00:00:00.000Z',
  modifiedBy: 'system',
  displayName: 'Controlled User',
  email: 'controlled@example.invalid',
  role_code: 'PM',
  passwordHash: 'not-a-real-password-hash',
  passwordChangedAt: null,
  active: true
});

assert.equal(LEGACY_COLUMNS.length, 11);

const rowTwo = { ...baseRow, ID: '00000000-0000-0000-0000-000000000002', role_code: 'TESTER' };
const canonicalOne = canonicalizeRows([rowTwo, baseRow]);
const canonicalTwo = canonicalizeRows([baseRow, rowTwo]);
assert.equal(canonicalOne.json, canonicalTwo.json);
assert.equal(canonicalOne.rowCount, 2);
assert.match(canonicalOne.sha256, /^[a-f0-9]{64}$/);

assert.throws(() => canonicalizeRows([{ ...baseRow, email: undefined }]), /exact legacy column contract/i);
assert.throws(() => canonicalizeRows([{ ...baseRow, unexpected: 'blocked' }]), /exact legacy column contract/i);
assert.throws(() => canonicalizeRows([]), /non-empty/i);

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 3072,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const encrypted = encryptBackup([baseRow, rowTwo], publicKey);
assert.deepEqual(Object.keys(encrypted).sort(), ['alg', 'ciphertext', 'encryptedKey', 'iv', 'tag', 'version']);
assert.equal(JSON.stringify(encrypted).includes(baseRow.email), false);
assert.equal(JSON.stringify(encrypted).includes(baseRow.passwordHash), false);

const decrypted = decryptBackup(encrypted, privateKey);
assert.equal(decrypted.rowCount, 2);
assert.equal(decrypted.sha256, canonicalOne.sha256);
assert.deepEqual(decrypted.rows.map((row) => row.ID), [baseRow.ID, rowTwo.ID]);

const tampered = { ...encrypted, tag: Buffer.from('tampered-auth-tag').toString('base64') };
assert.throws(() => decryptBackup(tampered, privateKey));
assert.throws(() => encryptBackup([baseRow], 'not-a-public-key'));

assert.throws(
  () => readHdiCredentials({ VCAP_SERVICES: JSON.stringify({ hana: [] }) }),
  /exactly one/i
);
assert.throws(
  () => readHdiCredentials({
    VCAP_SERVICES: JSON.stringify({
      hana: [
        { name: 'one', credentials: { host: 'one.invalid', port: 443, schema: 'ONE', user: 'runtime-one', password: 'p', hdi_user: 'owner-one', hdi_password: 'owner-p' } },
        { name: 'two', credentials: { host: 'two.invalid', port: 443, schema: 'TWO', user: 'runtime-two', password: 'p', hdi_user: 'owner-two', hdi_password: 'owner-p' } }
      ]
    })
  }),
  /exactly one/i
);
const runtimeCredential = readHdiCredentials({
  VCAP_SERVICES: JSON.stringify({
    hana: [{ credentials: { host: 'runtime.invalid', port: 443, schema: 'RUNTIME', user: 'least-privileged', password: 'runtime-password', hdi_user: 'owner', hdi_password: 'owner-password' } }]
  })
});
assert.equal(runtimeCredential.user, 'least-privileged');
assert.equal(runtimeCredential.password, 'runtime-password');

function fakeDb (sourceRows, restoredRows = sourceRows) {
  const calls = [];
  return {
    calls,
    async run (sql, params = []) {
      calls.push({ sql, params });
      if (/SYS\.TABLES/.test(sql)) return [{ TABLE_NAME: 'idts_cap_Users' }];
      if (/SYS\.TABLE_COLUMNS/.test(sql)) return LEGACY_COLUMNS.map((name) => ({ COLUMN_NAME: name }));
      if (/^SELECT/i.test(sql.trim()) && /idts_cap_Users/i.test(sql)) return sourceRows;
      if (/^SELECT/i.test(sql.trim()) && /#IDTS_UA_USERS_RESTORE/.test(sql)) return restoredRows;
      return [];
    },
    async disconnect () { calls.push({ sql: 'DISCONNECT', params: [] }); }
  };
}

(async () => {
  const emitted = [];
  const db = fakeDb([rowTwo, baseRow]);
  const result = await runBackupRehearsal({
    db,
    publicKey,
    emit: (line) => emitted.push(line)
  });
  assert.equal(result.rowCount, 2);
  assert.match(result.digestPrefix, /^[a-f0-9]{12}$/);
  assert.equal(emitted.length, 2);
  assert.match(emitted[0], /^IDTS_UA_BACKUP_META=/);
  assert.match(emitted[1], /^IDTS_UA_BACKUP_ENVELOPE=/);
  assert.equal(emitted.join('\n').includes(baseRow.email), false);
  assert.equal(emitted.join('\n').includes(baseRow.passwordHash), false);
  assert.equal(db.calls.some(({ sql }) => /CREATE LOCAL TEMPORARY COLUMN TABLE/.test(sql)), true);
  assert.equal(db.calls.some(({ sql }) => /CREATE LOCAL TEMPORARY COLUMN TABLE[\s\S]*PRIMARY KEY/i.test(sql)), false);
  assert.equal(db.calls.filter(({ sql }) => /^INSERT INTO/.test(sql.trim())).length, 2);

  await assert.rejects(
    () => runBackupRehearsal({ db: fakeDb([]), publicKey, emit: () => {} }),
    /non-empty/i
  );
  await assert.rejects(
    () => runBackupRehearsal({ db: fakeDb([baseRow], [{ ...baseRow, active: false }]), publicKey, emit: () => {} }),
    /restore rehearsal mismatch/i
  );
  await assert.rejects(
    () => runBackupRehearsal({ db: fakeDb([baseRow], []), publicKey, emit: () => {} }),
    /restore rehearsal mismatch/i
  );

  console.log('User Administration logical backup contract: PASS');
})().catch((error) => {
  console.error(`User Administration logical backup contract: FAIL (${error.message})`);
  process.exitCode = 1;
});
