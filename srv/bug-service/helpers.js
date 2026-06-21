const cds = require('@sap/cds')

const { SELECT } = cds.ql

async function readBug (req, entities, bugID) {
  if (!bugID) return null
  return cds.tx(req).run(SELECT.one.from(entities.Bugs).where({ ID: bugID }))
}

async function resolveRequestUser (req, entities) {
  for (const candidate of requestUserCandidates(req)) {
    const user = await activeUserFromCandidate(req, entities, candidate)
    if (user) return user
  }

  return null
}

async function activeUserFromCandidate (req, entities, candidate) {
  const tx = cds.tx(req)

  const byID = await tx.run(SELECT.one.from(entities.Users).where({ ID: candidate, active: true }))
  if (byID) return byID

  const byEmail = await tx.run(SELECT.one.from(entities.Users).where({ email: candidate, active: true }))
  if (byEmail) return byEmail

  const byDisplayName = await tx.run(SELECT.one.from(entities.Users).where({ displayName: candidate, active: true }))
  if (byDisplayName) return byDisplayName

  const normalizedCandidate = typeof candidate === 'string' ? candidate.trim().toLowerCase() : null
  if (!normalizedCandidate) return null

  const activeUsers = await tx.run(
    SELECT.from(entities.Users)
      .columns('ID', 'displayName', 'email', 'role_code', 'active')
      .where({ active: true })
  )

  return activeUsers.find(user =>
    [user.ID, user.email, user.displayName]
      .filter(Boolean)
      .some(value => String(value).trim().toLowerCase() === normalizedCandidate)
  ) || null
}

function requestUserCandidates (req) {
  const attributes = req.user?.attr || {}
  const values = [
    req.user?.id,
    attributes.email,
    attributes.user_name,
    attributes.login_name,
    attributes.name,
    attributes.given_name
  ]

  return values
    .flatMap(value => Array.isArray(value) ? value : [value])
    .map(value => typeof value === 'string' ? value.trim() : value)
    .filter(value => value && value !== 'anonymous')
}

async function displayStatus (req, entities, code) {
  return displayCodeListName(req, entities.StatusValues, code)
}

async function displayProcessorRole (req, entities, code) {
  return displayCodeListName(req, entities.ProcessorRoleValues, code)
}

async function displayCodeListName (req, entity, code) {
  if (!code || !entity) return null
  const row = await cds.tx(req).run(
    SELECT.one.from(entity)
      .columns('name')
      .where({ code })
  )
  return row?.name || String(code)
}

async function displayUserName (req, entities, userID) {
  if (!userID) return null
  const row = await cds.tx(req).run(
    SELECT.one.from(entities.Users)
      .columns('displayName')
      .where({ ID: userID })
  )
  return row?.displayName || String(userID)
}

async function displayDeveloperName (req, entities, developerProfileID) {
  if (!developerProfileID) return null
  const userID = await userIDForDeveloper(req, entities, developerProfileID)
  if (!userID) return String(developerProfileID)
  return displayUserName(req, entities, userID)
}

async function displayEntityNameByID (req, entity, id) {
  if (!id || !entity) return null
  const row = await cds.tx(req).run(
    SELECT.one.from(entity)
      .columns('name')
      .where({ ID: id })
  )
  return row?.name || String(id)
}

async function displayComponentCategory (req, entities, componentCategoryID) {
  if (!componentCategoryID) return null

  const row = await cds.tx(req).run(
    SELECT.one.from(entities.ComponentCategories)
      .columns('component_ID', 'defectCategory_ID')
      .where({ ID: componentCategoryID })
  )

  if (!row) return String(componentCategoryID)

  const componentName = await displayEntityNameByID(req, entities.ApplicationComponents, row.component_ID)
  const defectCategoryName = await displayEntityNameByID(req, entities.DefectCategories, row.defectCategory_ID)
  const combined = [componentName, defectCategoryName].filter(Boolean).join(' / ')
  return combined || String(componentCategoryID)
}

async function nextBugNumber (req, entities) {
  const result = await cds.tx(req).run(SELECT.one.from(entities.Bugs).columns('count(*) as count'))
  const next = Number(result?.count || 0) + 1
  return `BUG-${String(next).padStart(4, '0')}`
}

async function firstUserByRole (req, entities, roleCode) {
  return cds.tx(req).run(SELECT.one.from(entities.Users).where({ role_code: roleCode, active: true }))
}

async function userIDForDeveloper (req, entities, developerProfileID) {
  if (!developerProfileID) return null
  const profile = await cds.tx(req).run(SELECT.one.from(entities.DeveloperProfiles).where({ ID: developerProfileID }))
  return profile?.user_ID || null
}

function bugIDFrom (req) {
  return req.params?.[0]?.ID || req.data?.ID
}

function trimToNull (value) {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed || null
}

function reasonTarget () {
  return 'reason'
}

function toHistoryValue (value) {
  if (value === null || value === undefined) return null
  return String(value).slice(0, 1000)
}

module.exports = {
  readBug,
  resolveRequestUser,
  displayStatus,
  displayProcessorRole,
  displayCodeListName,
  displayUserName,
  displayDeveloperName,
  displayEntityNameByID,
  displayComponentCategory,
  nextBugNumber,
  firstUserByRole,
  userIDForDeveloper,
  bugIDFrom,
  trimToNull,
  reasonTarget,
  toHistoryValue
}
