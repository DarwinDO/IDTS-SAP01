'use strict'

const ALLOWED_LEVELS = new Set(['PRIMARY', 'BACKUP', 'EXPERT'])

function normalizeDeveloperProfileInput (value) {
  if (value === undefined || value === null) return null
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw profileError('INVALID_DEVELOPER_PROFILE', 'Developer profile is invalid.')
  }

  const workloadLimit = Number(value.workloadLimit)
  if (!Number.isInteger(workloadLimit) || workloadLimit < 1) {
    throw profileError('INVALID_DEVELOPER_WORKLOAD_LIMIT', 'Developer workload limit must be a positive integer.')
  }

  const responsibilities = Array.isArray(value.responsibilities)
    ? value.responsibilities.map(normalizeResponsibility)
    : []
  const tuples = new Set()
  for (const responsibility of responsibilities) {
    const tuple = `${responsibility.componentCategoryID}|${responsibility.sapModuleID || 'ANY'}`
    if (tuples.has(tuple)) {
      throw profileError('DUPLICATE_DEVELOPER_RESPONSIBILITY', 'Developer responsibility scope is duplicated.')
    }
    tuples.add(tuple)
  }

  return {
    availabilityStatusCode: normalizedCode(value.availabilityStatusCode) || 'AVAILABLE',
    workloadLimit,
    responsibilities
  }
}

function assertDeveloperProfileForRole (role, profile) {
  if (role === 'DEVELOPER') {
    if (!profile || !Array.isArray(profile.responsibilities) || profile.responsibilities.length === 0) {
      throw profileError('DEVELOPER_PROFILE_REQUIRED', 'Developer access requires at least one responsibility.')
    }
    return
  }
  if (profile !== null && profile !== undefined) {
    throw profileError('DEVELOPER_PROFILE_NOT_ALLOWED', 'Developer profile is allowed only for Developer access.')
  }
}

function normalizeResponsibility (value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw profileError('INVALID_DEVELOPER_RESPONSIBILITY', 'Developer responsibility is invalid.')
  }
  const componentCategoryID = normalizedUuid(value.componentCategoryID)
  const sapModuleID = value.sapModuleID ? normalizedUuid(value.sapModuleID) : null
  const responsibilityLevelCode = normalizedCode(value.responsibilityLevelCode) || 'PRIMARY'
  if (!componentCategoryID || !ALLOWED_LEVELS.has(responsibilityLevelCode)) {
    throw profileError('INVALID_DEVELOPER_RESPONSIBILITY', 'Developer responsibility is invalid.')
  }
  return { componentCategoryID, sapModuleID, responsibilityLevelCode }
}

function normalizedCode (value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

function normalizedUuid (value) {
  const uuid = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(uuid) ? uuid : ''
}

function profileError (code, message) {
  return Object.assign(new Error(message), { status: 400, statusCode: 400, code })
}

module.exports = {
  normalizeDeveloperProfileInput,
  assertDeveloperProfileForRole
}
