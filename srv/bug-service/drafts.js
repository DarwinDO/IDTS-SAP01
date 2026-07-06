const cds = require('@sap/cds')

const { SELECT } = cds.ql

const {
  bugIDFrom,
  readBug,
  resolveRequestUser
} = require('./helpers')

const {
  importantChanges,
  recordBugChangeSideEffects,
  recordDraftAttachmentSaveSideEffects
} = require('./history')
const {
  validateActiveCodeLists,
  validateRequiredBugFields
} = require('./bug-write')

async function prepareDraftPatch (req, entities) {
  const bugID = bugIDFrom(req)
  if (!bugID) return

  const currentDraft = await cds.tx(req).run(SELECT.one.from(entities.Bugs.drafts).where({ ID: bugID }))
  if (!currentDraft) return

  const merged = { ...currentDraft, ...req.data }
  await validateActiveCodeLists(req, entities, merged)
  if (merged.applicationComponent_ID && merged.defectCategory_ID) {
    const componentCategory = await cds.tx(req).run(SELECT.one.from(entities.ComponentCategories).where({
      component_ID: merged.applicationComponent_ID,
      defectCategory_ID: merged.defectCategory_ID,
      active: true
    }))
    if (componentCategory) {
      req.data.componentCategory_ID = componentCategory.ID
    } else {
      req.data.componentCategory_ID = null
    }
  } else {
    req.data.componentCategory_ID = null
  }
}

async function prepareDraftNew (req, actor) {
  if (!actor) {
    return req.reject(
      403,
      'An active IDTS user is required to create a bug report.',
      'reporter_ID'
    )
  }

  // Reporter is system-managed. Never trust a client-supplied reporter for a
  // new draft; bind it to the authenticated IDTS user instead.
  req.data.reporter_ID = actor.ID
}

async function ensureDraftReporterForSave (req, entities, draft, actor) {
  if (draft.reporter_ID) return draft.reporter_ID

  if (!actor && entities) actor = await resolveRequestUser(req, entities)

  if (!actor) {
    return req.reject(
      403,
      'An active IDTS user is required to activate a bug draft.',
      'reporter_ID'
    )
  }

  // This fallback supports drafts created before IDTS-49. The active CREATE
  // handler still applies the authoritative system-managed fields afterward.
  draft.reporter_ID = actor.ID
  return actor.ID
}

async function handleDraftSave (req, entities, next) {
  await validateDraftForSave(req, entities)
  await captureDraftSaveState(req, entities)
  const result = await next()
  await recordDraftBugSaveSideEffects(req, result, entities)
  await recordDraftAttachmentSaveSideEffects(req, result, entities)
  return result
}

async function validateDraftForSave (req, entities) {
  const bugID = bugIDFrom(req)
  if (!bugID) return

  const draft = await cds.tx(req).run(SELECT.one.from(entities.Bugs.drafts).where({ ID: bugID }))
  if (!draft) return

  await ensureDraftReporterForSave(req, entities, draft)
  validateRequiredBugFields(req, draft, { rejectFirst: true })
  await validateActiveCodeLists(req, entities, draft)
}

async function captureDraftSaveState (req, entities) {
  const bugID = bugIDFrom(req)
  if (!bugID) return

  req._preSaveActiveBug = await readBug(req, entities, bugID)
  req._preSaveActiveAttachments = await cds.tx(req).run(
    SELECT.from(entities['Bugs.attachments'])
      .columns('ID', 'up__ID', 'filename', 'mimeType', 'fileSize')
      .where({ up__ID: bugID })
  )
}

async function recordDraftBugSaveSideEffects (req, data, entities) {
  const oldBug = req._preSaveActiveBug
  const bugID = data?.ID || bugIDFrom(req)
  if (!oldBug || !bugID) return

  const activeBug = await readBug(req, entities, bugID)
  if (!activeBug) return

  const changes = importantChanges(oldBug, activeBug)
  await recordBugChangeSideEffects(req, entities, changes, activeBug)
}

module.exports = {
  ensureDraftReporterForSave,
  prepareDraftPatch,
  prepareDraftNew,
  handleDraftSave,
  validateDraftForSave
}
