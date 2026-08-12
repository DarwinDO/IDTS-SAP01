'use strict'

const cds = require('@sap/cds')

function getUserAdminConfig () {
  const raw = cds.env.idts?.userAdmin || {}
  const invitationTtlMinutes = Number(raw.invitationTtlMinutes || 60)
  const invitationSigningKey = stringOrNull(raw.invitationSigningKey)
  const invitationBaseUrl = stringOrNull(raw.invitationBaseUrl)?.replace(/\/+$/, '') || null
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

function stringOrNull (value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized || null
}

module.exports = { getUserAdminConfig }
