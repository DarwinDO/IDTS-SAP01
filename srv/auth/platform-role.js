'use strict'

const cds = require('@sap/cds')

const BUSINESS_ROLES = Object.freeze(['TESTER', 'DEVELOPER', 'PM'])
const INVALID_PLATFORM_ROLE_MESSAGE = 'Your SAP BTP role assignment is not valid for IDTS.'
const ROLE_MISMATCH_MESSAGE = 'Your SAP BTP role does not match your IDTS user profile.'

function isXsuaaRuntime () {
  const auth = cds.env.requires?.auth || {}
  const customImplementation = String(auth.impl || '').replaceAll('\\', '/')
  return auth.kind === 'xsuaa' && !customImplementation.endsWith('/srv/auth/custom-auth.js')
}

function platformBusinessRoles (req) {
  if (!req?.user || typeof req.user.is !== 'function') return []
  return BUSINESS_ROLES.filter(role => req.user.is(role))
}

function enforcePlatformRoleAlignment (req, user) {
  if (!isXsuaaRuntime()) return user

  const roles = platformBusinessRoles(req)
  if (roles.length !== 1) {
    return req.reject(403, INVALID_PLATFORM_ROLE_MESSAGE)
  }

  if (!user?.role_code || user.role_code !== roles[0]) {
    return req.reject(403, ROLE_MISMATCH_MESSAGE)
  }

  return user
}

module.exports = {
  enforcePlatformRoleAlignment,
  isXsuaaRuntime,
  platformBusinessRoles
}

module.exports.__test = {
  BUSINESS_ROLES,
  INVALID_PLATFORM_ROLE_MESSAGE,
  ROLE_MISMATCH_MESSAGE
}
