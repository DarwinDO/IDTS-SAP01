'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { encryptBackup } = require('../btp/user-admin-logical-backup-contract');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'idts-ua-custody-test-'));
const publicPath = path.join(root, 'public.pem');
const privateDirectory = path.join(root, 'private');
const envelopePath = path.join(root, 'backup-envelope.json');
const keyScript = path.resolve(__dirname, '..', 'btp', 'user-admin-logical-backup-key.ps1');
const verifyScript = path.resolve(__dirname, '..', 'btp', 'verify-user-admin-logical-backup.ps1');

try {
  const created = spawnSync('pwsh', [
    '-NoProfile', '-File', keyScript,
    '-PublicOutputPath', publicPath,
    '-PrivateDirectory', privateDirectory
  ], { encoding: 'utf8' });
  assert.equal(created.status, 0, created.stderr);
  assert.equal(created.stdout.trim(), 'IDTS_UA_KEY_RESULT=PASS');
  assert.match(fs.readFileSync(publicPath, 'utf8'), /BEGIN PUBLIC KEY/);
  const privateBlob = path.join(privateDirectory, 'user-admin-logical-backup-private.dpapi');
  assert.equal(fs.existsSync(privateBlob), true);
  assert.equal(fs.readFileSync(privateBlob, 'utf8').includes('BEGIN PRIVATE KEY'), false);

  const row = {
    ID: '00000000-0000-0000-0000-000000000001',
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'system',
    modifiedAt: '2026-01-02T00:00:00.000Z',
    modifiedBy: 'system',
    displayName: 'Controlled User',
    email: 'controlled@example.invalid',
    role_code: 'PM',
    passwordHash: null,
    passwordChangedAt: null,
    active: true
  };
  fs.writeFileSync(envelopePath, JSON.stringify(encryptBackup([row], fs.readFileSync(publicPath, 'utf8'))), { flag: 'wx' });

  const verified = spawnSync('pwsh', [
    '-NoProfile', '-File', verifyScript,
    '-EnvelopePath', envelopePath,
    '-PrivateDirectory', privateDirectory
  ], { encoding: 'utf8' });
  assert.equal(verified.status, 0, verified.stderr);
  assert.match(verified.stdout.trim(), /^IDTS_UA_VERIFY_RESULT=PASS;ROWS=1;DIGEST_PREFIX=[a-f0-9]{12}$/);
  assert.equal(verified.stdout.includes(row.email), false);

  const duplicate = spawnSync('pwsh', [
    '-NoProfile', '-File', keyScript,
    '-PublicOutputPath', publicPath,
    '-PrivateDirectory', privateDirectory
  ], { encoding: 'utf8' });
  assert.notEqual(duplicate.status, 0);
  assert.equal(duplicate.stdout.trim(), 'IDTS_UA_KEY_RESULT=FAIL');

  console.log('User Administration logical backup custody: PASS');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
