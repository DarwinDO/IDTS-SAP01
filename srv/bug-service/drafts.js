const cds = require('@sap/cds')

const { SELECT } = cds.ql

const {
  bugIDFrom,
  readBug
} = require('./helpers')

const {
  importantChanges,
  recordBugChangeSideEffects,
  recordDraftAttachmentSaveSideEffects
} = require('./history')

async function prepareDraftPatch (req, entities) {
  const bugID = bugIDFrom(req)
  if (!bugID) return

  const currentDraft = await cds.tx(req).run(SELECT.one.from(entities.Bugs.drafts).where({ ID: bugID }))
  if (!currentDraft) return

  const merged = { ...currentDraft, ...req.data }
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

async function handleDraftSave (req, entities, next) {
  await captureDraftSaveState(req, entities)
  const result = await next()
  await recordDraftBugSaveSideEffects(req, result, entities)
  await recordDraftAttachmentSaveSideEffects(req, result, entities)
  return result
}

async function captureDraftSaveState (req, entities) {
  const bugID = bugIDFrom(req)
  if (!bugID) return

  req._preSaveActiveBug = await readBug(req, entities, bugID)
  req._preSaveActiveAttachments = await cds.tx(req).run(
    SELECT.from(entities.Attachments)
      .columns('ID', 'bug_ID', 'fileName', 'mediaType', 'fileSize')
      .where({ bug_ID: bugID })
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
  prepareDraftPatch,
  handleDraftSave
}
