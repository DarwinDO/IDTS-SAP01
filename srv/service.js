const cds = require('@sap/cds')

const {
  ACTION,
  STATUS
} = require('./bug-service/constants')

const {
  recordCommentCreateSideEffects,
  recordCreateSideEffects,
  recordUpdateSideEffects
} = require('./bug-service/history')

const {
  enrichBugCapabilities,
  enrichBugDisplayFields,
  ensureCapabilitySelectDependencies,
  readAssignableDevelopers
} = require('./bug-service/read-models')
const {
  ensureHistoryEventSelectDependencies,
  enrichHistoryEventPayload
} = require('./bug-service/history-read-models')

const { readDeveloperWorkloads } = require('./bug-service/monitoring')
const { registerReadOnlyEntityGuards } = require('./bug-service/guards')
const { prepareBugWrite } = require('./bug-service/bug-write')
const { enforceBugCreatePermission } = require('./bug-service/permissions')
const {
  assignToDeveloper,
  resubmitToDeveloper,
  addComment,
  transitionBug
} = require('./bug-service/actions')
const {
  prepareCommentCreate,
  prepareAttachmentWrite
} = require('./bug-service/content')
const {
  prepareDraftNew,
  prepareDraftPatch,
  handleDraftSave
} = require('./bug-service/drafts')
const { startEmailWorker } = require('./email/worker')
const { suggestSimilarBugs, suggestClassification, summarizeBugHandoff, explainSmartAssignment } = require('./ai')

module.exports = class BugService extends cds.ApplicationService {
  async init () {
    const entities = this.entities
    const { Bugs, Comments, HistoryEvents } = entities
    const Attachments = entities['Bugs.attachments']

    const commentTargets = [Comments, Comments?.drafts].filter(Boolean)
    const attachmentTargets = [Attachments, Attachments?.drafts].filter(Boolean)
    const historyEventTargets = [HistoryEvents, HistoryEvents?.drafts].filter(Boolean)

    registerReadOnlyEntityGuards(this, entities)
    this.before('READ', Bugs, req => ensureCapabilitySelectDependencies(req))
    this.before('READ', Bugs.drafts, req => ensureCapabilitySelectDependencies(req))
    for (const target of historyEventTargets) {
      this.before('READ', target, req => ensureHistoryEventSelectDependencies(req))
    }
    this.before('CREATE', Bugs, req => prepareBugWrite(req, entities, { isCreate: true }))
    this.before('NEW', Bugs.drafts, async req => {
      const actor = await enforceBugCreatePermission(req, entities)
      await prepareDraftNew(req, actor)
    })
    this.before('UPDATE', Bugs, req => prepareBugWrite(req, entities, { isCreate: false }))
    this.before('PATCH', Bugs.drafts, req => prepareDraftPatch(req, entities))

    for (const target of commentTargets) {
      this.before('CREATE', target, req => prepareCommentCreate(req, entities))
    }

    for (const target of attachmentTargets) {
      this.before(['CREATE', 'PUT', 'UPDATE', 'PATCH', 'DELETE'], target, req => prepareAttachmentWrite(req, entities))
    }

    this.after('CREATE', Bugs, (data, req) => recordCreateSideEffects(req, data, entities))
    this.after('UPDATE', Bugs, (data, req) => recordUpdateSideEffects(req, entities))

    for (const target of commentTargets) {
      this.after('CREATE', target, (data, req) => recordCommentCreateSideEffects(req, data, entities))
    }

    this.after('READ', Bugs, async (bugs, req) => {
      await enrichBugDisplayFields(bugs, req, entities)
      await enrichBugCapabilities(bugs, req, entities)
    })
    this.after('READ', Bugs.drafts, async (bugs, req) => {
      await enrichBugDisplayFields(bugs, req, entities)
      await enrichBugCapabilities(bugs, req, entities)
    })
    for (const target of historyEventTargets) {
      this.after('READ', target, async (events, req) => enrichHistoryEventPayload(events, req, entities))
    }

    this.on('READ', entities.AssignableDevelopers, req => readAssignableDevelopers(req, entities))
    this.on('READ', entities.DeveloperWorkloads, req => readDeveloperWorkloads(req, entities))
    this.on('suggestSimilarBugs', req => suggestSimilarBugs(req, entities))
    this.on('suggestClassification', req => suggestClassification(req, entities))
    this.on('summarizeBugHandoff', req => summarizeBugHandoff(req, entities))
    this.on('explainSmartAssignment', req => explainSmartAssignment(req, entities))
    this.on('SAVE', Bugs.drafts, (req, next) => handleDraftSave(req, entities, next))

    this.on('assignToDeveloper', req => assignToDeveloper(req, entities))
    this.on('addComment', req => addComment(req, entities))
    this.on('moveToPendingAssignment', req => transitionBug(req, entities, {
      status: STATUS.PENDING_ASSIGNMENT,
      actionType: ACTION.REASSIGN,
      reason: req.data.reason,
      clearAssignee: true,
      requireReason: false
    }))
    this.on('markInReview', req => transitionBug(req, entities, {
      status: STATUS.IN_REVIEW,
      actionType: ACTION.STATUS_CHANGE,
      reason: req.data.note,
      requireAssignee: true
    }))
    this.on('requestMoreInformation', req => transitionBug(req, entities, {
      status: STATUS.NEED_MORE_INFORMATION,
      actionType: ACTION.REQUEST_INFO,
      reason: req.data.reason,
      requireAssignee: true,
      requireReason: true
    }))
    this.on('resubmitToDeveloper', req => resubmitToDeveloper(req, entities))
    this.on('rejectBug', req => transitionBug(req, entities, {
      status: STATUS.REJECTED,
      actionType: ACTION.REJECT,
      reason: req.data.reason,
      requireAssignee: true,
      requireReason: true
    }))
    this.on('startProgress', req => transitionBug(req, entities, {
      status: STATUS.IN_PROGRESS,
      actionType: ACTION.STATUS_CHANGE,
      reason: req.data.note,
      requireAssignee: true
    }))
    this.on('resolveBug', req => transitionBug(req, entities, {
      status: STATUS.RESOLVED,
      actionType: ACTION.RESOLVE,
      reason: req.data.note,
      requireAssignee: true,
      requireReason: true
    }))
    this.on('sendToRetest', req => transitionBug(req, entities, {
      status: STATUS.RETEST_REQUIRED,
      actionType: ACTION.RETEST,
      reason: req.data.note
    }))
    this.on('closeBug', req => transitionBug(req, entities, {
      status: STATUS.CLOSED,
      actionType: ACTION.CLOSE,
      reason: req.data.note
    }))
    this.on('reopenBug', req => transitionBug(req, entities, {
      status: STATUS.REOPENED,
      actionType: ACTION.REOPEN,
      reason: req.data.reason,
      requireReason: true
    }))

    await super.init()
    startEmailWorker()
  }
}
