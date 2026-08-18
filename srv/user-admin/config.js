'use strict'

const cds = require('@sap/cds')

const INVITATION_CONFIG_SERVICE = 'idts-user-admin-invitation-config'
const INVITATION_CREDENTIAL_KEYS = ['invitationBaseUrl', 'invitationSigningKey']

function getUserAdminConfig ({ cdsEnv = cds.env, env = process.env } = {}) {
  const raw = cdsEnv.idts?.userAdmin || {}
  const invitationTtlMinutes = Number(raw.invitationTtlMinutes || 60)
  const credentials = isProduction(env) ? invitationBindingCredentials(env) : raw
  const invitationSigningKey = stringOrNull(credentials?.invitationSigningKey)
  const invitationBaseUrl = stringOrNull(credentials?.invitationBaseUrl)?.replace(/\/+$/, '') || null
  const ready = Number.isInteger(invitationTtlMinutes) &&
    invitationTtlMinutes >= 10 &&
    invitationTtlMinutes <= 10080 &&
    invitationSigningKey !== null &&
    Buffer.byteLength(invitationSigningKey) >= 32 &&
    /^https:\/\//i.test(invitationBaseUrl || '')

  return Object.freeze({
    invitationTtlMinutes,
    invitationSigningKey,
    invitationBaseUrl,
    ready
  })
}

function invitationBindingCredentials (env) {
  let services
  try {
    services = JSON.parse(env.VCAP_SERVICES || '{}')
  } catch {
    return null
  }
  const matches = Object.values(services)
    .flatMap(entries => Array.isArray(entries) ? entries : [])
    .filter(binding => [binding?.name, binding?.instance_name].includes(INVITATION_CONFIG_SERVICE))
  if (matches.length !== 1) return null

  const credentials = matches[0]?.credentials
  if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) return null
  const keys = Object.keys(credentials).sort()
  if (keys.length !== INVITATION_CREDENTIAL_KEYS.length ||
    keys.some((key, index) => key !== INVITATION_CREDENTIAL_KEYS[index])) return null
  return credentials
}

function isProduction (env) {
  return env.NODE_ENV === 'production' || String(env.CDS_ENV || '').split(',').includes('production')
}

function stringOrNull (value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized || null
}

module.exports = { INVITATION_CONFIG_SERVICE, getUserAdminConfig }
