'use strict';

const {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  publicEncrypt,
  privateDecrypt,
  constants
} = require('node:crypto');

const LEGACY_COLUMNS = Object.freeze([
  'ID',
  'createdAt',
  'createdBy',
  'modifiedAt',
  'modifiedBy',
  'displayName',
  'email',
  'role_code',
  'passwordHash',
  'passwordChangedAt',
  'active'
]);

const ENVELOPE_KEYS = Object.freeze(['alg', 'ciphertext', 'encryptedKey', 'iv', 'tag', 'version']);

function normalizeValue (value) {
  if (value instanceof Date) return value.toISOString();
  return value;
}

function normalizeRow (row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    throw new Error('Row does not satisfy the exact legacy column contract.');
  }

  const keys = Object.keys(row).sort();
  const expected = [...LEGACY_COLUMNS].sort();
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
    throw new Error('Row does not satisfy the exact legacy column contract.');
  }

  const normalized = {};
  for (const column of LEGACY_COLUMNS) {
    if (typeof row[column] === 'undefined') {
      throw new Error('Row does not satisfy the exact legacy column contract.');
    }
    normalized[column] = normalizeValue(row[column]);
  }
  return normalized;
}

function canonicalizeRows (rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Backup requires a non-empty row set.');
  }

  const normalized = rows.map(normalizeRow).sort((left, right) => left.ID.localeCompare(right.ID));
  const ids = normalized.map((row) => row.ID);
  if (new Set(ids).size !== ids.length) throw new Error('Backup contains duplicate user IDs.');

  const json = JSON.stringify(normalized);
  return {
    json,
    rowCount: normalized.length,
    rows: normalized,
    sha256: createHash('sha256').update(json, 'utf8').digest('hex')
  };
}

function assertEnvelope (envelope) {
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    throw new Error('Invalid backup envelope.');
  }
  const keys = Object.keys(envelope).sort();
  if (keys.length !== ENVELOPE_KEYS.length || keys.some((key, index) => key !== ENVELOPE_KEYS[index])) {
    throw new Error('Invalid backup envelope.');
  }
  if (envelope.version !== 1 || envelope.alg !== 'RSA-OAEP-SHA256+A256GCM') {
    throw new Error('Unsupported backup envelope.');
  }
  for (const key of ['ciphertext', 'encryptedKey', 'iv', 'tag']) {
    if (typeof envelope[key] !== 'string' || envelope[key].length === 0) {
      throw new Error('Invalid backup envelope.');
    }
  }
}

function encryptBackup (rows, publicKey) {
  const canonical = canonicalizeRows(rows);
  return encryptCanonicalDocument(canonical.json, publicKey);
}

function encryptCanonicalDocument (canonicalJson, publicKey) {
  if (typeof canonicalJson !== 'string' || canonicalJson.length === 0) {
    throw new Error('Canonical backup document is required.');
  }
  const aesKey = randomBytes(32);
  try {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', aesKey, iv);
    const ciphertext = Buffer.concat([cipher.update(canonicalJson, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    const encryptedKey = publicEncrypt({ key: publicKey, oaepHash: 'sha256', padding: constants.RSA_PKCS1_OAEP_PADDING }, aesKey);
    return {
      version: 1,
      alg: 'RSA-OAEP-SHA256+A256GCM',
      encryptedKey: encryptedKey.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      ciphertext: ciphertext.toString('base64')
    };
  } finally {
    aesKey.fill(0);
  }
}

function decryptBackup (envelope, privateKey) {
  return canonicalizeRows(decryptCanonicalDocument(envelope, privateKey));
}

function decryptCanonicalDocument (envelope, privateKey) {
  assertEnvelope(envelope);
  const aesKey = privateDecrypt({
    key: privateKey,
    oaepHash: 'sha256',
    padding: constants.RSA_PKCS1_OAEP_PADDING
  }, Buffer.from(envelope.encryptedKey, 'base64'));

  try {
    const decipher = createDecipheriv('aes-256-gcm', aesKey, Buffer.from(envelope.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
      decipher.final()
    ]).toString('utf8');
    return JSON.parse(plaintext);
  } finally {
    aesKey.fill(0);
  }
}

module.exports = {
  LEGACY_COLUMNS,
  canonicalizeRows,
  decryptCanonicalDocument,
  decryptBackup,
  encryptCanonicalDocument,
  encryptBackup
};
