'use strict'

const {
  randomBytes,
  scrypt,
  timingSafeEqual,
  createHash
} = require('crypto')
const { promisify } = require('util')

const scryptAsync = promisify(scrypt)

const SCRYPT_KEY_LENGTH = 64
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1
}

async function hashPassword (password) {
  const normalized = normalizePassword(password)
  const salt = randomBytes(16).toString('base64url')
  const derived = await scryptAsync(normalized, salt, SCRYPT_KEY_LENGTH, SCRYPT_OPTIONS)
  return [
    'scrypt',
    SCRYPT_OPTIONS.N,
    SCRYPT_OPTIONS.r,
    SCRYPT_OPTIONS.p,
    salt,
    derived.toString('base64url')
  ].join('$')
}

async function verifyPassword (password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false

  const parts = storedHash.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const [, rawN, rawR, rawP, salt, expectedText] = parts
  const expected = Buffer.from(expectedText, 'base64url')
  if (expected.length !== SCRYPT_KEY_LENGTH) return false

  const derived = await scryptAsync(normalizePassword(password), salt, SCRYPT_KEY_LENGTH, {
    N: Number(rawN),
    r: Number(rawR),
    p: Number(rawP)
  })

  return timingSafeEqual(derived, expected)
}

function normalizePassword (password) {
  if (typeof password !== 'string' || !password) {
    throw new Error('Password must be a non-empty string.')
  }
  return password
}

function createSessionToken () {
  return randomBytes(32).toString('base64url')
}

function hashToken (token) {
  return createHash('sha256').update(String(token)).digest('hex')
}

function addMinutes (date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSessionToken,
  hashToken,
  addMinutes
}
