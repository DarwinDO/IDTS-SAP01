// Học nhanh (DonHV): tạo handoff summary từ Bug/history đã allowlist; không dùng summary để tự chuyển status hoặc tạo comment.
'use strict'

const cds = require('@sap/cds')
const { SELECT } = cds.ql

const { FEATURE_TYPES, createAiSuggestion } = require('./audit')
const { createAiProvider } = require('./provider')
const { redactSensitiveText } = require('./safety')
const { resolveRequestUser } = require('../bug-service/helpers')

const MAX_COMMENT_COUNT = 8
const MAX_HISTORY_COUNT = 10
const MAX_FIELD_CHANGE_COUNT = 8
const MAX_TEXT = 1200

async function summarizeBugHandoff (req, entities, dependencies = {}) {
  // Entry point Handoff Summary: đọc Bug + history grounded, gọi provider nếu bật, kiểm output,
  // fallback deterministic, ghi audit và trả review-only summary; không đổi status/assignee/history.
  const tx = cds.tx(req)
  const provider = dependencies.provider || createAiProvider()
  const sourceBugID = cleanId(req.data?.sourceBugID)

  if (!sourceBugID) {
    return req.reject(400, 'sourceBugID is required to generate a bug handoff summary.')
  }

  const context = await readGroundedBugContext(tx, sourceBugID)
  if (!context.bug) {
    return req.reject(404, 'Source bug was not found.')
  }

  const providerResult = await provider.structured({
    featureType: FEATURE_TYPES.BUG_SUMMARY,
    schemaName: 'IdtsBugHandoffSummary',
    correlationId: req.id,
    instruction: [
      'Generate a concise IDTS bug handoff summary only from the provided bug data.',
      'Include current status, current action owner, missing information, important recent events, and next expected action.',
      'If data is missing, say it is missing. Do not invent root cause, private data, attachment contents, or workflow decisions.',
      'Return business-facing text for human review.'
    ].join(' '),
    input: providerInput(context)
  })

  const result = buildBugHandoffSummary({
    context,
    providerResult,
    generatedAt: new Date()
  })

  const audit = await recordSummaryAudit({
    tx,
    req,
    entities,
    context,
    provider,
    providerResult,
    result
  })

  return {
    suggestionID: audit?.ID || null,
    ...result
  }
}

async function readGroundedBugContext (tx, sourceBugID) {
  // Đọc một snapshot Bug và association cần thiết làm nguồn sự thật cho summary.
  const bug = await tx.run(
    SELECT.one.from('idts.cap.Bugs')
      .columns(
        'ID',
        'bugNumber',
        'title',
        'description',
        'status_code',
        'priority_code',
        'severity_code',
        'environment_code',
        'environmentDetail',
        'stepsToReproduce',
        'actualResult',
        'expectedResult',
        'reporter_ID',
        'assignee_ID',
        'nextProcessorUser_ID',
        'nextProcessorRole_code',
        'rejectionReason',
        'testCaseRef',
        'testRunRef',
        'dueDate',
        'modifiedAt'
      )
      .where({ ID: sourceBugID })
  )
  if (!bug) return { bug: null }

  const [comments, historyEvents, statusNames, roleNames] = await Promise.all([
    tx.run(
      SELECT.from('idts.cap.Comments')
        .columns('ID', 'createdAt', 'author_ID', 'authorRole_code', 'content')
        .where({ bug_ID: sourceBugID })
        .orderBy('createdAt desc')
        .limit(MAX_COMMENT_COUNT)
    ),
    tx.run(
      SELECT.from('idts.cap.HistoryEvents')
        .columns('ID', 'createdAt', 'actor_ID', 'actorRole_code', 'actionType_code', 'summary', 'reason')
        .where({ bug_ID: sourceBugID })
        .orderBy('createdAt desc')
        .limit(MAX_HISTORY_COUNT)
    ),
    readCodeNames(tx, 'idts.cap.StatusValues', [bug.status_code]),
    readCodeNames(tx, 'idts.cap.ProcessorRoleValues', [bug.nextProcessorRole_code])
  ])

  const historyLogs = await readHistoryLogs(tx, historyEvents.map(event => event.ID))
  const userIDs = [
    bug.reporter_ID,
    bug.nextProcessorUser_ID,
    ...comments.map(comment => comment.author_ID),
    ...historyEvents.map(event => event.actor_ID),
    ...historyLogs.map(log => log.actor_ID)
  ].filter(Boolean)
  const developerProfileIDs = [bug.assignee_ID].filter(Boolean)

  const [users, developerUsers] = await Promise.all([
    readUsers(tx, userIDs),
    readDeveloperUsers(tx, developerProfileIDs)
  ])

  return {
    bug,
    comments: comments.reverse().map(comment => ({
      ...comment,
      authorDisplayName: users.get(comment.author_ID) || 'Unknown user'
    })),
    historyEvents: historyEvents.reverse().map(event => ({
      ...event,
      actorDisplayName: users.get(event.actor_ID) || 'Unknown user',
      logs: historyLogs
        .filter(log => log.event_ID === event.ID)
        .map(log => ({
          ...log,
          actorDisplayName: users.get(log.actor_ID) || 'Unknown user'
        }))
    })),
    display: {
      status: labelWithCode(bug.status_code, statusNames.get(bug.status_code)),
      nextProcessorRole: labelWithCode(bug.nextProcessorRole_code, roleNames.get(bug.nextProcessorRole_code)),
      nextProcessorUser: users.get(bug.nextProcessorUser_ID) || null,
      reporter: users.get(bug.reporter_ID) || null,
      assignee: developerUsers.get(bug.assignee_ID) || null
    }
  }
}

async function readHistoryLogs (tx, eventIDs) {
  // Query batch HistoryLogs của các event đã chọn; không lấy toàn bộ lịch sử vô hạn.
  if (!eventIDs.length) return []
  return tx.run(
    SELECT.from('idts.cap.HistoryLogs')
      .columns(
        'ID',
        'event_ID',
        'actor_ID',
        'actorRole_code',
        'actionType_code',
        'fieldLabel',
        'oldValueDisplay',
        'newValueDisplay',
        'reason'
      )
      .where({ event_ID: { in: eventIDs } })
      .orderBy('createdAt desc')
      .limit(MAX_FIELD_CHANGE_COUNT * eventIDs.length)
  )
}

async function readUsers (tx, ids) {
  // Map Users.ID sang display name cho actor/owner trong summary bằng một query batch.
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return new Map()
  const rows = await tx.run(
    SELECT.from('idts.cap.Users')
      .columns('ID', 'displayName')
      .where({ ID: { in: unique } })
  )
  return new Map(rows.map(row => [row.ID, row.displayName || row.ID]))
}

async function readDeveloperUsers (tx, developerProfileIDs) {
  // Map DeveloperProfile assignee sang User/display name để phân biệt technical owner và action owner.
  const unique = [...new Set(developerProfileIDs.filter(Boolean))]
  if (!unique.length) return new Map()
  const rows = await tx.run(
    SELECT.from('idts.cap.DeveloperProfiles')
      .columns('ID', 'user_ID')
      .where({ ID: { in: unique } })
  )
  const users = await readUsers(tx, rows.map(row => row.user_ID))
  return new Map(rows.map(row => [row.ID, users.get(row.user_ID) || row.ID]))
}

async function readCodeNames (tx, entityName, codes) {
  // Map code status/catalog sang label, giữ code fallback cho dữ liệu cũ.
  const unique = [...new Set(codes.filter(Boolean))]
  if (!unique.length) return new Map()
  const rows = await tx.run(
    SELECT.from(entityName)
      .columns('code', 'name')
      .where({ code: { in: unique } })
  )
  return new Map(rows.map(row => [row.code, row.name || row.code]))
}

function buildBugHandoffSummary ({ context, providerResult, generatedAt }) {
  // Chọn provider summary chỉ khi an toàn/grounded; nếu không dùng deterministic summary từ context thật.
  const fallback = deterministicSummary(context, generatedAt, providerResult?.status || 'AI_PROVIDER_ERROR')
  const normalized = normalizeProviderSummary(providerResult, context, generatedAt)

  if (normalized && containsHighRiskDiagnostic(normalized)) {
    return {
      ...fallback,
      providerStatus: 'AI_OUTPUT_UNSAFE',
      groundingStatus: 'FALLBACK_USED'
    }
  }
  return normalized || fallback
}

function containsHighRiskDiagnostic (value) {
  // Phát hiện SQL/stack/secret trong output provider để chặn trả ra UI.
  const text = JSON.stringify(value || {}).toLowerCase()
  return [
    'select passwordhash',
    'from idts.cap.users',
    'xkeysib-',
    'bearer ',
    'postgres://',
    'postgresql://',
    'token=',
    'stack'
  ].some(token => text.includes(token))
}

function normalizeProviderSummary (providerResult, context, generatedAt) {
  // Parse structured output, giới hạn event/text và đối chiếu dữ liệu nền trước khi tạo result.
  if (!providerResult?.ok) return null
  const payload = providerPayload(providerResult)
  if (!payload || typeof payload !== 'object') return null

  const summary = cleanText(payload.summary || payload.handoffSummary, MAX_TEXT)
  const nextExpectedAction = cleanText(payload.nextExpectedAction || payload.nextAction, MAX_TEXT)
  if (!summary || !nextExpectedAction) return null

  const result = baseResult(context, generatedAt, providerResult.status || 'SUCCESS')
  const fallbackMissing = fallbackMissingInformation(context)
  const providerMissing = cleanText(payload.missingInformation || payload.missingInfo, MAX_TEXT)
  return {
    ...result,
    summary,
    missingInformation: groundingStatus(context) === 'PARTIAL_DATA'
      ? joinDistinctText(providerMissing, fallbackMissing)
      : (providerMissing || fallbackMissing),
    latestImportantEvents: normalizeEvents(payload.latestImportantEvents || payload.importantEvents) || fallbackLatestEvents(context),
    nextExpectedAction,
    groundingStatus: groundingStatus(context),
    confidence: normalizeConfidence(payload.confidence, 0.72)
  }
}

function joinDistinctText (...parts) {
  // Ghép text không trùng/rỗng thành đoạn ngắn; dùng cho summary fallback.
  const values = parts.map(part => cleanText(part, MAX_TEXT)).filter(Boolean)
  return [...new Set(values)].join(' ')
}

function deterministicSummary (context, generatedAt, providerStatus) {
  // Dựng toàn bộ handoff từ Bug/history bằng rule local khi AI tắt/lỗi/output xấu.
  const result = baseResult(context, generatedAt, providerStatus)
  return {
    ...result,
    summary: fallbackSummary(context),
    missingInformation: fallbackMissingInformation(context),
    latestImportantEvents: fallbackLatestEvents(context),
    nextExpectedAction: fallbackNextAction(context),
    groundingStatus: groundingStatus(context),
    confidence: providerStatus === 'SUCCESS' ? '0.6200' : '0.5000'
  }
}

function baseResult (context, generatedAt, providerStatus) {
  // Tạo metadata chung (source, generatedAt, review flag, grounding status) cho mọi nhánh result.
  const bug = context.bug
  return {
    bugID: bug.ID,
    bugNumber: bug.bugNumber,
    generatedAt,
    label: 'AI-generated handoff summary - review before use',
    currentStatus: context.display.status || 'Status is not recorded.',
    currentActionOwner: currentActionOwner(context),
    providerStatus,
    requiresReview: true
  }
}

function providerInput (context) {
  // Chọn field cần thiết gửi provider; không gửi attachment binary, credential hay full private profile.
  const bug = context.bug
  return {
    bug: {
      bugNumber: bug.bugNumber,
      title: cleanText(bug.title, 255),
      description: cleanText(bug.description, MAX_TEXT),
      status: context.display.status,
      priorityCode: bug.priority_code || null,
      severityCode: bug.severity_code || null,
      environmentCode: bug.environment_code || null,
      environmentDetail: cleanText(bug.environmentDetail, 255),
      stepsToReproduce: cleanText(bug.stepsToReproduce, MAX_TEXT),
      actualResult: cleanText(bug.actualResult, MAX_TEXT),
      expectedResult: cleanText(bug.expectedResult, MAX_TEXT),
      currentActionOwner: currentActionOwner(context),
      assignee: context.display.assignee,
      reporter: context.display.reporter,
      rejectionReason: cleanText(bug.rejectionReason, MAX_TEXT),
      dueDate: bug.dueDate || null,
      testCaseRef: cleanText(bug.testCaseRef, 80),
      testRunRef: cleanText(bug.testRunRef, 80)
    },
    comments: context.comments.map(comment => ({
      author: comment.authorDisplayName,
      authorRoleCode: comment.authorRole_code || null,
      content: cleanText(comment.content, 600),
      createdAt: comment.createdAt || null
    })),
    historyEvents: context.historyEvents.map(event => ({
      actionTypeCode: event.actionType_code,
      actor: event.actorDisplayName,
      actorRoleCode: event.actorRole_code || null,
      summary: cleanText(event.summary, 500),
      reason: cleanText(event.reason, 600),
      createdAt: event.createdAt || null,
      changes: event.logs.slice(0, MAX_FIELD_CHANGE_COUNT).map(log => ({
        fieldLabel: log.fieldLabel || null,
        oldValueDisplay: cleanText(log.oldValueDisplay, 300),
        newValueDisplay: cleanText(log.newValueDisplay, 300),
        reason: cleanText(log.reason, 300)
      }))
    }))
  }
}

function fallbackSummary (context) {
  // Tạo câu tóm tắt trạng thái/owner/classification hiện tại từ dữ liệu DB.
  const bug = context.bug
  const fragments = [
    `${bug.bugNumber || 'This bug'}: ${cleanText(bug.title, 180) || 'Untitled bug'}.`,
    `Current status is ${context.display.status || bug.status_code || 'not recorded'}.`,
    `Current action owner is ${currentActionOwner(context)}.`
  ]
  if (context.comments.length) {
    fragments.push(`There are ${context.comments.length} recent comment(s) included in this handoff.`)
  } else {
    fragments.push('No comments are recorded for this bug yet.')
  }
  if (!context.historyEvents.length) {
    fragments.push('No history events are recorded for this bug yet.')
  }
  return fragments.join(' ')
}

function fallbackMissingInformation (context) {
  // Liệt kê field nghiệp vụ còn thiếu dựa trên null/empty thật, không để model tự đoán.
  const missing = []
  const bug = context.bug
  if (!cleanText(bug.description)) missing.push('description')
  if (!cleanText(bug.stepsToReproduce)) missing.push('steps to reproduce')
  if (!cleanText(bug.actualResult)) missing.push('actual result')
  if (!cleanText(bug.expectedResult)) missing.push('expected result')
  if (!context.comments.length) missing.push('comments')
  if (!context.historyEvents.length) missing.push('history events')
  if (!missing.length) return 'No obvious missing core handoff data was detected from the stored bug fields.'
  return `Missing or empty handoff data: ${missing.join(', ')}.`
}

function fallbackLatestEvents (context) {
  // Chọn vài event mới nhất đã sanitize làm handoff context.
  if (!context.historyEvents.length) return 'No history events are recorded for this bug yet.'
  return context.historyEvents
    .slice(-5)
    .map(event => {
      const changes = event.logs
        .slice(0, 3)
        .map(log => [log.fieldLabel, log.oldValueDisplay, log.newValueDisplay].filter(Boolean).join(': '))
        .filter(Boolean)
      return [
        event.summary,
        event.actorDisplayName ? `by ${event.actorDisplayName}` : null,
        changes.length ? `changes: ${changes.join('; ')}` : null
      ].filter(Boolean).join(' ')
    })
    .join('\n')
}

function fallbackNextAction (context) {
  // Suy ra bước tiếp theo từ status/next processor hiện tại, chỉ là lời giải thích không chạy action.
  const status = context.bug.status_code
  if (status === 'NEED_MORE_INFORMATION') {
    return 'Tester or PM should provide the requested information, then resubmit the bug to the assigned developer.'
  }
  if (status === 'PENDING_ASSIGNMENT') {
    return 'Tester or PM should choose a suitable developer or keep the bug in the assignment queue with a clear reason.'
  }
  if (status === 'REJECTED') {
    return 'Tester or PM should review the rejection reason, correct classification or assignment, and reassign if appropriate.'
  }
  if (['ASSIGNED', 'IN_REVIEW', 'IN_PROGRESS', 'REOPENED'].includes(status)) {
    return 'Assigned developer should continue review or resolution and update the bug status when progress changes.'
  }
  if (['RESOLVED', 'RETEST_REQUIRED'].includes(status)) {
    return 'Tester or PM should verify the resolution and close or reopen the bug based on retest result.'
  }
  if (status === 'CLOSED') {
    return 'No workflow action is expected unless the issue needs to be reopened.'
  }
  return 'Review the bug status and current action owner before taking the next workflow action.'
}

function currentActionOwner (context) {
  // Ưu tiên nextProcessor user; fallback queue label, không nhầm với assignee kỹ thuật.
  if (context.display.nextProcessorUser) return context.display.nextProcessorUser
  if (context.display.nextProcessorRole) return context.display.nextProcessorRole
  return 'No current action owner is recorded.'
}

function groundingStatus (context) {
  // Đánh dấu đủ/thiếu dữ liệu nguồn để UI hiểu độ tin cậy của summary.
  if (!context.comments.length || !context.historyEvents.length) return 'PARTIAL_DATA'
  return 'GROUNDED'
}

function providerPayload (providerResult) {
  // Lấy structured data khi provider success; failure trả object rỗng.
  const data = providerResult?.data
  if (data?.json && typeof data.json === 'object') return data.json
  return data && typeof data === 'object' ? data : {}
}

function normalizeEvents (value) {
  // Chuẩn hóa event array provider, giới hạn count/text và bỏ item không hợp lệ.
  if (Array.isArray(value)) {
    const text = value.map(item => cleanText(item?.summary || item?.text || item, 400)).filter(Boolean).join('\n')
    return text || null
  }
  return cleanText(value, MAX_TEXT)
}

function normalizeConfidence (value, fallback) {
  // Ép confidence 0..1 hoặc fallback deterministic.
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback.toFixed(4)
  return Math.max(0, Math.min(1, number)).toFixed(4)
}

async function recordSummaryAudit ({ tx, req, entities, context, provider, providerResult, result }) {
  // Lưu metadata/summary an toàn vào AISuggestions; không ghi summary vào HistoryEvents thật.
  const requester = await resolveRequestUser(req, entities)
  if (!requester) return null

  return createAiSuggestion(tx, {
    bugID: context.bug.ID,
    requestedByID: requester.ID,
    featureType: FEATURE_TYPES.BUG_SUMMARY,
    providerAlias: providerResult?.providerAlias || provider?.config?.provider || null,
    modelAlias: providerResult?.modelAlias || provider?.config?.modelAlias || null,
    operationStatus: result.providerStatus || providerResult?.status || 'AI_PROVIDER_ERROR',
    latencyMs: providerResult?.durationMs,
    confidence: result.confidence,
    correlationId: providerResult?.correlationId || req.id,
    summary: cleanText(result.summary, 500),
    suggestionPayload: {
      providerStatus: result.providerStatus,
      groundingStatus: result.groundingStatus,
      bugID: result.bugID,
      bugNumber: result.bugNumber,
      currentStatus: result.currentStatus,
      currentActionOwner: result.currentActionOwner,
      missingInformation: result.missingInformation,
      latestImportantEvents: result.latestImportantEvents,
      nextExpectedAction: result.nextExpectedAction,
      generatedAt: result.generatedAt
    }
  })
}

function labelWithCode (code, name) {
  // Dựng label name (code) khi có, fallback code/name để dữ liệu cũ vẫn đọc được.
  return [code, name].filter(Boolean).join(' - ') || null
}

function cleanText (value, maxLength = MAX_TEXT) {
  // Redact/cắt text từ DB/provider trước response/audit.
  if (value === undefined || value === null) return null
  return redactSensitiveText(String(value), maxLength).trim() || null
}

function cleanId (value) {
  // Chuẩn hóa source UUID/string và giới hạn độ dài trước query.
  return cleanText(value, 36)
}

module.exports = {
  summarizeBugHandoff,
  buildBugHandoffSummary,
  readGroundedBugContext
}
