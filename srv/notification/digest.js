'use strict'

// Học nhanh (DonHV): snapshot digest đọc Bug hiện tại; email worker hiện có mới claim và gửi payload đã lưu.

const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql

const { DEVELOPER_STATUSES, STATUS, TESTER_STATUSES } = require('../bug-service/constants')
const { getEmailConfig, isSafeEmailAddress } = require('../email/config')
const { buildBugLink, escapeHtml } = require('../email/template')
const {
  formatFrom,
  retryDelayMs,
  sanitizeTransportError
} = require('../email/outbox')

const BUGS = 'idts.cap.Bugs'
const USERS = 'idts.cap.Users'
const PROFILES = 'idts.cap.DeveloperProfiles'
const HISTORY_LOGS = 'idts.cap.HistoryLogs'
const DIGESTS = 'idts.cap.NotificationDigestDeliveries'
const BANGKOK = 'Asia/Bangkok'
const DIGEST_TYPE = 'DAILY'
const DEFAULT_LIMIT = 20
const DIGEST_PAGE_SIZE = 500
const DIGEST_RECIPIENT_PAGE_SIZE = 100
// Batch worker bounded an toàn HANA: giữ predicate IN recipient dưới giới hạn driver/cardinality.
const DIGEST_DELIVERY_BATCH_SIZE = 100
const DIGEST_ROLES = new Set(['PM', 'DEVELOPER', 'TESTER'])
const PRIORITY_RANK = Object.freeze({ LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 })
const SEVERITY_RANK = Object.freeze({ MINOR: 1, MAJOR: 2, CRITICAL: 3, BLOCKER: 4 })
const COMPLETED_STATUSES = new Set([STATUS.CLOSED])
const APP_PATH = '/idtsbugmanagementui/index.html'

async function buildDigestSnapshot ({
  tx,
  recipient,
  businessDate,
  snapshotAt,
  limit = DEFAULT_LIMIT,
  _bugs,
  _pendingAssignmentAnchors,
  _profileIDs,
  _profileRows,
  _items,
  _itemsRole,
  _itemCount
} = {}) {
  if (!tx || typeof tx.run !== 'function') throw digestError(500, 'DIGEST_TRANSACTION_REQUIRED', 'A CAP transaction is required.')

  const instant = normalizeInstant(snapshotAt)
  const date = normalizeBusinessDate(businessDate || bangkokDate(instant))
  const actor = await readRecipient(tx, recipient)
  if (!actor?.ID || !actor.active || !DIGEST_ROLES.has(String(actor.role_code || '').toUpperCase())) return null

  const role = String(actor.role_code).toUpperCase()
  const profileRows = Array.isArray(_items)
    ? await readDigestUserProfiles(tx, actor.ID)
    : (_profileRows || await readDigestUserProfiles(tx, actor.ID))
  const activeProfileIDs = new Set(profileRows.filter(row => row.active).map(row => row.ID))
  if (Array.isArray(_items) && role === 'DEVELOPER' && _profileIDs instanceof Set && !sameSet(activeProfileIDs, _profileIDs)) return null
  const profileIDs = role === 'DEVELOPER'
    ? activeProfileIDs
    : new Set()
  let items
  let itemCount
  if (Array.isArray(_items)) {
    // Index dùng chung phải bind role; mismatch thì fail-closed, không persist body persona cũ.
    if (_itemsRole !== role) return null
    items = _items.slice().sort(compareDigestItems)
    itemCount = normalizeItemCount(_itemCount, items.length)
  } else if (Array.isArray(_bugs)) {
    const pendingAssignmentAnchors = _pendingAssignmentAnchors || await readPendingAssignmentAnchors(tx, _bugs)
    const accumulator = createDigestAccumulator()
    addDigestItemsForBugs(accumulator, _bugs, {
      role,
      recipientID: actor.ID,
      profileIDs,
      businessDate: date,
      snapshotAt: instant,
      pendingAssignmentAnchors
    })
    items = accumulator.items
    itemCount = accumulator.count
  } else {
    const accumulator = createDigestAccumulator()
    await streamDigestBugPages(tx, instant, (bugs, pendingAssignmentAnchors) => {
      addDigestItemsForBugs(accumulator, bugs, {
        role,
        recipientID: actor.ID,
        profileIDs,
        businessDate: date,
        snapshotAt: instant,
        pendingAssignmentAnchors
      })
    })
    items = accumulator.items
    itemCount = accumulator.count
  }

  if (!items.length) return null

  const safeLimit = normalizeLimit(limit)
  const renderedItems = items.slice(0, safeLimit)
  const remainder = Math.max(itemCount - renderedItems.length, 0)
  const config = getEmailConfig()
  const appBase = allowlistedAppBase(config?.baseUrl)
  const subject = `[IDTS] Daily notification digest - ${date}`
  const textLines = [
    `IDTS daily notification digest for ${date}`,
    `Items: ${itemCount}`,
    ...renderedItems.map((item, index) => `${index + 1}. ${safeText(item.bugNumber, 'Bug')} - ${safeText(item.title, 'Untitled bug')} [${item.priority}] (${item.reason}) ${buildBugLink(appBase, item.ID)}`)
  ]
  if (remainder) textLines.push(`and ${remainder} more - Open filtered queue: ${buildQueueLink(appBase, role, actor.ID)}`)

  const htmlItems = renderedItems.map(item => {
    const link = buildBugLink(appBase, item.ID)
    return `<li style="margin:0 0 10px;"><a href="${escapeHtml(link)}" style="color:#0a6ed1;">${escapeHtml(safeText(item.bugNumber, 'Bug'))}</a> - ${escapeHtml(safeText(item.title, 'Untitled bug'))} <span style="color:#556b82;">[${escapeHtml(item.priority)}] ${escapeHtml(item.reason)}</span></li>`
  }).join('')
  const moreHtml = remainder
    ? `<p style="margin:16px 0 0;color:#556b82;">and ${remainder} more - <a href="${escapeHtml(buildQueueLink(appBase, role, actor.ID))}" style="color:#0a6ed1;">Open filtered queue</a></p>`
    : ''
  const htmlBody = [
    '<div style="margin:0;padding:24px;background:#f5f6f7;font-family:Arial,Helvetica,sans-serif;color:#223548;">',
    '  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #d9e2ec;border-radius:8px;overflow:hidden;">',
    `    <div style="padding:18px 24px;background:#0a6ed1;color:#ffffff;"><h1 style="margin:0;font-size:20px;line-height:28px;">${escapeHtml(subject)}</h1></div>`,
    `    <div style="padding:22px 24px;"><p style="margin:0 0 16px;font-size:15px;line-height:22px;">${itemCount} actionable item${itemCount === 1 ? '' : 's'}.</p><ol style="margin:0;padding-left:24px;">${htmlItems}</ol>${moreHtml}</div>`,
    '    <div style="padding:14px 24px;background:#f7f9fb;color:#6a7d90;font-size:12px;line-height:18px;">This is an automated IDTS digest. Open IDTS for full Bug details.</div>',
    '  </div>',
    '</div>'
  ].join('')

  return {
    recipientID: actor.ID,
    businessDate: date,
    digestType: digestTypeForRole(role),
    windowStart: bangkokMidnight(date),
    windowEnd: instant.toISOString(),
    snapshotAt: instant.toISOString(),
    itemCount,
    items: renderedItems,
    subject,
    textBody: textLines.join('\n'),
    htmlBody
  }
}

async function scheduleNotificationDigests ({ tx, now = new Date() } = {}) {
  if (!tx || typeof tx.run !== 'function') throw digestError(500, 'DIGEST_TRANSACTION_REQUIRED', 'A CAP transaction is required.')
  const instant = normalizeInstant(now)
  if (!isDigestScheduleDue(instant)) return { created: 0, reused: 0, skipped: 0 }

  const businessDate = bangkokDate(instant)
  const result = { created: 0, reused: 0, skipped: 0 }
  const runRoot = createDigestTransactionRunner(tx)
  const runPage = runRoot || (fn => fn(tx))
  let lastID
  for (;;) {
    const page = await runPage(async pageTx => {
      const recipients = await readDigestRecipientPage(pageTx, lastID)
      if (!recipients.length) return { pageResult: null, recipients: [], snapshots: [] }

      const profileRowsByUser = await readDigestProfileRows(pageTx, recipients)
      const accumulators = new Map(recipients.map(recipient => [recipient.ID, createDigestAccumulator()]))
      await streamDigestBugPages(pageTx, instant, (bugs, pendingAssignmentAnchors) => {
        accumulateDigestPage({
          recipients,
          profileRowsByUser,
          accumulators,
          bugs,
          pendingAssignmentAnchors,
          businessDate,
          snapshotAt: instant
        })
      })

      const pageResult = { created: 0, reused: 0, skipped: 0 }
      const snapshots = []
      for (const recipient of recipients) {
        const role = String(recipient.role_code || '').toUpperCase()
        const existing = await pageTx.run(SELECT.one.from(DIGESTS).columns('ID').where({
          recipient_ID: recipient.ID,
          businessDate,
          digestType: digestTypeForRole(role)
        }))
        if (existing?.ID) {
          pageResult.reused += 1
          continue
        }

        const profileRows = profileRowsByUser.get(recipient.ID) || []
        const accumulator = accumulators.get(recipient.ID) || createDigestAccumulator()
        const snapshot = await buildDigestSnapshot({
          tx: pageTx,
          recipient,
          businessDate,
          snapshotAt: instant,
          limit: DEFAULT_LIMIT,
          _profileIDs: new Set(profileRows.filter(row => row.active).map(row => row.ID)),
          _profileRows: profileRows,
          _items: accumulator.items,
          _itemsRole: role,
          _itemCount: accumulator.count
        })
        if (!snapshot) {
          pageResult.skipped += 1
          continue
        }
        snapshots.push(snapshot)
      }

      return {
        pageResult,
        recipients,
        snapshots,
        nextID: recipients.at(-1)?.ID
      }
    })

    if (!page.pageResult) break
    for (const snapshot of page.snapshots) {
      const delivery = await insertDigestDelivery(tx, snapshot, runRoot)
      if (delivery.skipped) page.pageResult.skipped += 1
      else if (delivery.reused) page.pageResult.reused += 1
      else page.pageResult.created += 1
    }
    for (const key of ['created', 'reused', 'skipped']) result[key] += page.pageResult[key]

    const nextID = page.nextID
    if (page.recipients.length < DIGEST_RECIPIENT_PAGE_SIZE || !nextID || nextID === lastID) break
    lastID = nextID
  }
  return result
}

async function processNotificationDigestDeliveries ({ tx, config, sendMail, now = new Date(), workerID = cds.utils.uuid() } = {}) {
  if (!config?.ready || typeof sendMail !== 'function' || !tx || typeof tx.run !== 'function') {
    return { sent: 0, failed: 0, skipped: 0 }
  }

  const instant = normalizeInstant(now)
  const batchSize = normalizeDeliveryBatchSize(config.batchSize)
  const maxAttempts = config.maxRetryCount + 1
  const candidates = await tx.run(
    SELECT.from(DIGESTS)
      .where({ status_code: { in: ['PENDING', 'FAILED'] } })
      .orderBy('createdAt asc')
      .limit(batchSize * 3)
  )
  const today = bangkokDate(instant)
  const eligible = candidates
    .filter(row => !row.businessDate || String(row.businessDate).slice(0, 10) <= today)
    .filter(row => Number(row.attemptCount || 0) < maxAttempts)
    .filter(row => !row.nextAttemptAt || new Date(row.nextAttemptAt) <= instant)
    .filter(row => !row.lockedUntil || new Date(row.lockedUntil) <= instant)
    .slice(0, batchSize)
  const result = { sent: 0, failed: 0, skipped: 0 }

  for (const delivery of eligible) {
    const lockToken = `${workerID}-${cds.utils.uuid()}`.slice(0, 64)
    const lockedUntil = new Date(instant.getTime() + Math.max(config.pollIntervalMs * 4, 60000)).toISOString()
    const claimed = await tx.run(
      UPDATE(DIGESTS)
        .set({ lockToken, lockedUntil })
        .where({
          ID: delivery.ID,
          status_code: delivery.status_code,
          attemptCount: delivery.attemptCount,
          lockedUntil: delivery.lockedUntil || null
        })
    )
    if (!claimed) continue

    const attemptCount = Number(delivery.attemptCount || 0) + 1
    await tx.run(UPDATE(DIGESTS).set({
      attemptCount,
      lastAttemptAt: instant.toISOString()
    }).where({ ID: delivery.ID, lockToken }))

    const { recipient, profileRows } = await readDigestSendRecipient(tx, delivery.recipient_ID)
    if (!recipient?.active || !isSafeEmailAddress(recipient.email)) {
      await tx.run(UPDATE(DIGESTS).set({
        status_code: 'SKIPPED',
        lastErrorCode: recipient ? 'RECIPIENT_EMAIL_INVALID' : 'RECIPIENT_NOT_FOUND',
        lastErrorSummary: recipient ? 'Digest recipient email is invalid.' : 'Digest recipient was not found.',
        lockedUntil: null,
        lockToken: null
      }).where({ ID: delivery.ID, lockToken }))
      result.skipped += 1
      continue
    }
    if (!isSendPersonaValid(recipient, profileRows, roleFromDigestType(delivery.digestType))) {
      await tx.run(UPDATE(DIGESTS).set({
        status_code: 'SKIPPED',
        lastErrorCode: 'RECIPIENT_PERSONA_INVALID',
        lastErrorSummary: 'Digest recipient persona is no longer eligible.',
        lockedUntil: null,
        lockToken: null
      }).where({ ID: delivery.ID, lockToken }))
      result.skipped += 1
      continue
    }

    try {
      const providerResult = await sendMail({
        to: recipient.email,
        from: formatFrom(config),
        replyTo: config.replyTo || undefined,
        subject: delivery.subject,
        text: delivery.textBody,
        html: delivery.htmlBody,
        headers: {
          'X-IDTS-Digest-ID': delivery.ID,
          'X-IDTS-Digest-Type': delivery.digestType
        }
      })
      await tx.run(UPDATE(DIGESTS).set({
        status_code: 'SENT',
        sentAt: instant.toISOString(),
        providerMessageId: providerResult?.messageId || null,
        nextAttemptAt: null,
        lastErrorCode: null,
        lastErrorSummary: null,
        lockedUntil: null,
        lockToken: null
      }).where({ ID: delivery.ID, lockToken }))
      result.sent += 1
    } catch (error) {
      const safeError = sanitizeTransportError(error)
      const retryAt = attemptCount < maxAttempts
        ? new Date(instant.getTime() + retryDelayMs(attemptCount)).toISOString()
        : null
      await tx.run(UPDATE(DIGESTS).set({
        status_code: 'FAILED',
        nextAttemptAt: retryAt,
        lastErrorCode: safeError.code,
        lastErrorSummary: safeError.summary,
        lockedUntil: null,
        lockToken: null
      }).where({ ID: delivery.ID, lockToken }))
      result.failed += 1
    }
  }
  return result
}

async function readDigestSendRecipient (tx, recipientID) {
  const recipient = await tx.run(
    SELECT.one.from(USERS)
      .columns('ID', 'email', 'active', 'role_code')
      .where({ ID: recipientID })
      .forUpdate()
  )
  if (!recipient) return { recipient: null, profileRows: [] }
  const profileRows = await tx.run(
    SELECT.from(PROFILES)
      .columns('ID', 'user_ID', 'active')
      .where({ user_ID: recipient.ID, active: true })
      .orderBy('ID asc')
      .limit(1)
      .forUpdate()
  )
  return { recipient, profileRows }
}

async function insertDigestDelivery (tx, snapshot, rootRunner) {
  const key = {
    recipient_ID: snapshot.recipientID,
    businessDate: snapshot.businessDate,
    digestType: snapshot.digestType
  }
  const runInsert = rootRunner || (fn => fn(tx))
  try {
    return await runInsert(async insertTx => {
      // Thứ tự khóa chỉ là User -> digest; delivery cũng dùng User-first.
      const recipient = await insertTx.run(
        SELECT.one.from(USERS)
          .columns('ID', 'active', 'role_code')
          .where({ ID: snapshot.recipientID })
          .forUpdate()
      )
      const role = String(recipient?.role_code || '').toUpperCase()
      if (!recipient?.active || digestTypeForRole(role) !== snapshot.digestType) return { skipped: true }

      const existing = await insertTx.run(SELECT.one.from(DIGESTS).columns('ID').where(key))
      if (existing?.ID) return { ID: existing.ID, reused: true }

      const deliveryID = cds.utils.uuid()
      const entry = {
        ID: deliveryID,
        recipient_ID: snapshot.recipientID,
        businessDate: snapshot.businessDate,
        digestType: snapshot.digestType,
        windowStart: snapshot.windowStart,
        windowEnd: snapshot.windowEnd,
        snapshotAt: snapshot.snapshotAt,
        itemCount: snapshot.itemCount,
        subject: snapshot.subject,
        textBody: snapshot.textBody,
        htmlBody: snapshot.htmlBody,
        status_code: 'PENDING',
        attemptCount: 0
      }
      try {
        await insertTx.run(INSERT.into(DIGESTS).entries(entry))
        return { ID: deliveryID, reused: false }
      } catch (error) {
        if (!isDigestUniqueViolation(error)) throw error
        // PostgreSQL abort root sau 23505; throw để CAP discard root trước khi đọc winner.
        throw digestUniqueConflict(error)
      }
    })
  } catch (error) {
    const uniqueConflict = error?.digestUniqueConflict === true || isDigestUniqueViolation(error) || isDigestUniqueViolation(error?.cause)
    if (!uniqueConflict) throw error
    if (!rootRunner) throw error
    const winner = await readDigestAfterUniqueConflict(tx, key, rootRunner)
    if (!winner?.ID) throw error
    return { ID: winner.ID, reused: true }
  }
}

async function readDigestAfterUniqueConflict (tx, key, rootRunner) {
  if (rootRunner) return rootRunner(readDigestWinner)
  const service = tx?.context ? Object.getPrototypeOf(tx) : null
  if (typeof service?.tx === 'function') {
    const context = { tenant: tx.context.tenant, user: tx.context.user }
    return service.tx(context, isolatedTx => readDigestWinner(isolatedTx))
  }
  return readDigestWinner(tx)

  function readDigestWinner (readTx) {
    return readTx.run(SELECT.one.from(DIGESTS).columns('ID').where(key))
  }
}

function digestUniqueConflict (error) {
  return Object.assign(new Error('Digest unique-key conflict; discard the insert root.'), {
    digestUniqueConflict: true,
    cause: error,
    code: error?.code,
    constraint: error?.constraint
  })
}

async function readRecipient (tx, recipient) {
  const recipientID = typeof recipient === 'string' ? recipient : recipient?.ID || recipient?.id
  if (!recipientID) return null
  const row = await tx.run(SELECT.one.from(USERS).columns('ID', 'role_code', 'active').where({ ID: recipientID }))
  if (!row) return null
  return row
}

async function readDigestRecipientPage (tx, lastID) {
  const query = SELECT.from(USERS)
    .columns('ID', 'displayName', 'email', 'role_code', 'active')
    .where({ active: true, role_code: { in: [...DIGEST_ROLES] } })
    .orderBy('ID asc')
    .limit(DIGEST_RECIPIENT_PAGE_SIZE)
  if (lastID) query.and`ID > ${lastID}`
  return tx.run(query)
}

async function readDigestUserProfiles (tx, userID) {
  const rows = []
  let lastID
  for (;;) {
    const query = SELECT.from(PROFILES)
      .columns('ID', 'user_ID', 'active')
      .where({ user_ID: userID })
      .orderBy('ID asc')
      .limit(DIGEST_PAGE_SIZE)
    if (lastID) query.and`ID > ${lastID}`
    const page = await tx.run(query)
    if (!page.length) break
    rows.push(...page)
    const nextID = page.at(-1)?.ID
    if (page.length < DIGEST_PAGE_SIZE || !nextID || nextID === lastID) break
    lastID = nextID
  }
  return rows
}

async function readDigestProfileRows (tx, users) {
  const userIDs = users.map(user => user.ID).filter(Boolean)
  const byUser = new Map(userIDs.map(userID => [userID, []]))
  let lastID
  for (;;) {
    if (!userIDs.length) break
    const query = SELECT.from(PROFILES)
      .columns('ID', 'user_ID', 'active')
      .where({ user_ID: { in: userIDs } })
      .orderBy('ID asc')
      .limit(DIGEST_PAGE_SIZE)
    if (lastID) query.and`ID > ${lastID}`
    const rows = await tx.run(query)
    if (!rows.length) break
    for (const row of rows) {
      if (byUser.has(row.user_ID)) byUser.get(row.user_ID).push(row)
    }
    const nextID = rows.at(-1)?.ID
    if (rows.length < DIGEST_PAGE_SIZE || !nextID || nextID === lastID) break
    lastID = nextID
  }
  return byUser
}

async function readPendingAssignmentAnchors (tx, bugs) {
  const bugIDs = bugs.map(bug => bug.ID).filter(Boolean)
  const anchors = new Map()
  for (let index = 0; index < bugIDs.length; index += DIGEST_PAGE_SIZE) {
    const pageIDs = bugIDs.slice(index, index + DIGEST_PAGE_SIZE)
    const rows = await tx.run(
      SELECT.from(HISTORY_LOGS)
        .columns('bug_ID', { func: 'max', args: [{ ref: ['createdAt'] }], as: 'latestAt' })
        .where({ bug_ID: { in: pageIDs }, fieldName: 'status', newValue: STATUS.PENDING_ASSIGNMENT })
        .groupBy('bug_ID')
        .orderBy('bug_ID asc')
        .limit(DIGEST_PAGE_SIZE)
    )
    for (const row of rows) {
      if (row.bug_ID && row.latestAt) anchors.set(row.bug_ID, row.latestAt)
    }
  }
  return anchors
}

async function streamDigestBugPages (tx, snapshotAt, onPage) {
  let lastID
  for (;;) {
    const query = SELECT.from(BUGS)
      .columns(
        'ID', 'bugNumber', 'title', 'status_code', 'priority_code', 'severity_code',
        'createdAt', 'dueDate', 'nextProcessorUser_ID', 'nextProcessorRole_code', 'retestOwner_ID', 'assignee_ID'
      )
      .where`status_code != ${STATUS.CLOSED} and createdAt <= ${snapshotAt.toISOString()}`
      .orderBy('ID asc')
      .limit(DIGEST_PAGE_SIZE)
    if (lastID) query.and`ID > ${lastID}`
    const page = await tx.run(query)
    if (!page.length) break
    const pendingAssignmentAnchors = await readPendingAssignmentAnchors(tx, page)
    await onPage(page, pendingAssignmentAnchors)
    const nextID = page.at(-1)?.ID
    if (page.length < DIGEST_PAGE_SIZE || !nextID || nextID === lastID) break
    lastID = nextID
  }
}

function createDigestTransactionRunner (tx) {
  const service = tx?.context ? Object.getPrototypeOf(tx) : tx
  if (typeof service?.tx !== 'function') return null
  const context = tx?.context
    ? { tenant: tx.context.tenant, user: tx.context.user }
    : null
  return fn => context ? service.tx(context, fn) : service.tx(fn)
}

function createDigestAccumulator () {
  return { count: 0, items: [] }
}

function addDigestItem (accumulator, item) {
  if (!item) return
  accumulator.count += 1
  if (accumulator.items.length < DEFAULT_LIMIT) {
    accumulator.items.push(item)
    accumulator.items.sort(compareDigestItems)
    return
  }
  const last = accumulator.items.at(-1)
  if (compareDigestItems(item, last) < 0) {
    accumulator.items[accumulator.items.length - 1] = item
    accumulator.items.sort(compareDigestItems)
  }
}

function addDigestItemsForBugs (accumulator, bugs, { role, recipientID, profileIDs, businessDate, snapshotAt, pendingAssignmentAnchors }) {
  for (const bug of bugs) {
    addDigestItem(accumulator, digestItemFor({
      bug,
      role,
      recipientID,
      profileIDs,
      businessDate,
      snapshotAt,
      pendingAssignmentAt: pendingAssignmentAnchors.get(bug.ID)
    }))
  }
}

function accumulateDigestPage ({ recipients, profileRowsByUser, accumulators, bugs, pendingAssignmentAnchors, businessDate, snapshotAt }) {
  const recipientByID = new Map(recipients.map(recipient => [recipient.ID, recipient]))

  const profileUserByID = new Map()
  const profileIDsByUser = new Map()
  for (const recipient of recipients) {
    const role = String(recipient.role_code || '').toUpperCase()
    const rows = profileRowsByUser.get(recipient.ID) || []
    if (role !== 'DEVELOPER') continue
    const profileIDs = new Set(rows.filter(row => row.active).map(row => row.ID))
    profileIDsByUser.set(recipient.ID, profileIDs)
    for (const profileID of profileIDs) profileUserByID.set(profileID, recipient.ID)
  }

  for (const bug of bugs) {
    const pmItem = digestItemFor({
      bug,
      role: 'PM',
      recipientID: null,
      profileIDs: new Set(),
      businessDate,
      snapshotAt,
      pendingAssignmentAt: pendingAssignmentAnchors.get(bug.ID)
    })
    if (pmItem) {
      for (const recipient of recipients) {
        if (String(recipient.role_code || '').toUpperCase() === 'PM') {
          addDigestItem(accumulators.get(recipient.ID), pmItem)
        }
      }
    }
    const targetIDs = new Set()
    const assigneeUserID = profileUserByID.get(bug.assignee_ID)
    if (assigneeUserID && DEVELOPER_STATUSES.has(bug.status_code)) targetIDs.add(assigneeUserID)
    if (bug.nextProcessorUser_ID) targetIDs.add(bug.nextProcessorUser_ID)
    if (bug.retestOwner_ID) targetIDs.add(bug.retestOwner_ID)
    for (const recipientID of targetIDs) {
      const recipient = recipientByID.get(recipientID)
      if (!recipient) continue
      const role = String(recipient.role_code || '').toUpperCase()
      if (role !== 'DEVELOPER' && role !== 'TESTER') continue
      const item = digestItemFor({
        bug,
        role,
        recipientID,
        profileIDs: profileIDsByUser.get(recipientID) || new Set(),
        businessDate,
        snapshotAt,
        pendingAssignmentAt: pendingAssignmentAnchors.get(bug.ID)
      })
      addDigestItem(accumulators.get(recipientID), item)
    }
  }
}

function normalizeItemCount (value, fallback) {
  const count = Number(value)
  return Number.isInteger(count) && count >= fallback ? count : fallback
}

function sameSet (left, right) {
  return left.size === right.size && [...left].every(value => right.has(value))
}

function digestItemFor ({ bug, role, recipientID, profileIDs, businessDate, snapshotAt, pendingAssignmentAt }) {
  if (!bug?.ID || COMPLETED_STATUSES.has(bug.status_code)) return null
  const createdAt = new Date(bug.createdAt)
  if (Number.isNaN(createdAt.getTime()) || createdAt > snapshotAt) return null

  const overdue = isOverdue(bug, businessDate)
  const urgent = isUrgent(bug)
  const pending = bug.status_code === STATUS.PENDING_ASSIGNMENT
  const slaBreached = pending && isSlaBreached(bug, snapshotAt, pendingAssignmentAt)
  const alignedActionOwner = isAlignedActionOwner(bug, role, recipientID)
  const alignedRetestOwner = role === 'TESTER' &&
    bug.status_code === STATUS.RETEST_REQUIRED &&
    bug.retestOwner_ID === recipientID &&
    bug.nextProcessorUser_ID === recipientID &&
    bug.nextProcessorRole_code === 'TESTER'
  const awaiting = alignedActionOwner || alignedRetestOwner
  const assigned = role === 'DEVELOPER' && DEVELOPER_STATUSES.has(bug.status_code) && profileIDs.has(bug.assignee_ID)
  const reasons = []

  if (role === 'PM') {
    if (pending) reasons.push('Pending Assignment')
    if (overdue) reasons.push('Overdue')
    if (slaBreached) reasons.push('SLA breached')
    if (urgent && !new Set([STATUS.CLOSED, STATUS.RESOLVED]).has(bug.status_code)) reasons.push('Critical/Blocker')
  } else {
    if (overdue && (assigned || awaiting)) reasons.push('Overdue')
    if (awaiting) reasons.push('Awaiting your action')
  }
  if (!reasons.length) return null

  return {
    ID: bug.ID,
    bugNumber: bug.bugNumber || 'Bug',
    title: bug.title || 'Untitled bug',
    priority: safeCode(bug.priority_code, 'LOW'),
    severity: safeCode(bug.severity_code, 'MINOR'),
    reason: [...new Set(reasons)].join(' / '),
    dueDate: bug.dueDate ? String(bug.dueDate).slice(0, 10) : null,
    createdAt: createdAt.toISOString()
  }
}

function isAlignedActionOwner (bug, role, recipientID) {
  if (bug.nextProcessorUser_ID !== recipientID || bug.nextProcessorRole_code !== role) return false
  if (role === 'DEVELOPER') return DEVELOPER_STATUSES.has(bug.status_code)
  if (role === 'TESTER') return TESTER_STATUSES.has(bug.status_code)
  return false
}

function isSendPersonaValid (recipient, profileRows, snapshotRole) {
  const role = String(recipient?.role_code || '').toUpperCase()
  if (!DIGEST_ROLES.has(role) || snapshotRole !== role) return false
  const activeProfiles = profileRows.filter(row => row.active && row.user_ID === recipient.ID)
  if (role === 'DEVELOPER') return activeProfiles.length > 0
  return activeProfiles.length === 0
}

function compareDigestItems (left, right) {
  return (PRIORITY_RANK[right.priority] || 0) - (PRIORITY_RANK[left.priority] || 0) ||
    (SEVERITY_RANK[right.severity] || 0) - (SEVERITY_RANK[left.severity] || 0) ||
    Number(Boolean(right.dueDate)) - Number(Boolean(left.dueDate)) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.ID.localeCompare(right.ID)
}

function isSlaBreached (bug, snapshotAt, pendingAssignmentAt) {
  const createdAt = new Date(pendingAssignmentAt || bug.createdAt)
  const thresholdHours = isUrgent(bug) ? 4 : 24
  return !Number.isNaN(createdAt.getTime()) && snapshotAt.getTime() - createdAt.getTime() >= thresholdHours * 60 * 60 * 1000
}

function isOverdue (bug, businessDate) {
  return bug.status_code !== STATUS.CLOSED && bug.dueDate && String(bug.dueDate).slice(0, 10) < businessDate
}

function isUrgent (bug) {
  return bug.priority_code === 'CRITICAL' || bug.severity_code === 'CRITICAL' || bug.severity_code === 'BLOCKER'
}

function isDigestScheduleDue (value) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', weekday: 'short', hour: '2-digit', hourCycle: 'h23' })
    .formatToParts(normalizeInstant(value))
  const values = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]))
  return !['Sat', 'Sun'].includes(values.weekday) && values.hour === '08'
}

function digestTypeForRole (role) {
  return `${DIGEST_TYPE}_${String(role || '').toUpperCase()}`
}

function roleFromDigestType (value) {
  const match = new RegExp(`^${DIGEST_TYPE}_(PM|DEVELOPER|TESTER)$`).exec(String(value || '').toUpperCase())
  return match?.[1] || null
}

function bangkokDate (value) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BANGKOK }).format(normalizeInstant(value))
}

function bangkokMidnight (businessDate) {
  return new Date(`${businessDate}T00:00:00+07:00`).toISOString()
}

function allowlistedAppBase (baseUrl) {
  try {
    const parsed = new URL(String(baseUrl || ''))
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported app URL protocol')
    return `${parsed.origin}${APP_PATH}`
  } catch {
    return APP_PATH
  }
}

function buildQueueLink (appBase, role, recipientID) {
  const recipientFilter = role === 'PM'
    ? ''
    : `&nextProcessorUser_ID=${encodeURIComponent(recipientID)}`
  return `${appBase}#/Bugs?exclude_closed=true${recipientFilter}`
}

function safeText (value, fallback = '') {
  const text = String(value ?? fallback).replace(/[\u0000-\u001f\u007f]/g, ' ').trim()
  return text || fallback
}

function safeCode (value, fallback) {
  const code = String(value || '').toUpperCase()
  return Object.prototype.hasOwnProperty.call(PRIORITY_RANK, code) || Object.prototype.hasOwnProperty.call(SEVERITY_RANK, code)
    ? code
    : fallback
}

function normalizeLimit (value) {
  const limit = Number(value)
  return Number.isInteger(limit) && limit > 0 ? Math.min(limit, DEFAULT_LIMIT) : DEFAULT_LIMIT
}

function normalizeDeliveryBatchSize (value) {
  const batchSize = Number(value)
  return Number.isInteger(batchSize) && batchSize > 0
    ? Math.min(batchSize, DIGEST_DELIVERY_BATCH_SIZE)
    : DIGEST_DELIVERY_BATCH_SIZE
}

function normalizeBusinessDate (value) {
  const date = String(value || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw digestError(400, 'INVALID_DIGEST_DATE', 'Digest business date is invalid.')
  return date
}

function normalizeInstant (value) {
  const instant = value instanceof Date ? new Date(value.getTime()) : new Date(value === undefined || value === null ? Date.now() : value)
  if (Number.isNaN(instant.getTime())) throw digestError(400, 'INVALID_DIGEST_TIMESTAMP', 'Digest timestamp is invalid.')
  return instant
}

function isDigestUniqueViolation (error) {
  const codes = [
    error?.code,
    error?.sqlState,
    error?.sqlstate,
    error?.nativeError?.code,
    error?.cause?.code
  ].map(value => String(value || '').toUpperCase())
  const message = String(error?.message || error || '').toLowerCase()
  const constraint = [
    error?.constraint,
    error?.constraintName,
    error?.constraint_name,
    error?.constraintIdentifier,
    error?.nativeError?.constraint,
    error?.nativeError?.constraintName,
    error?.cause?.constraint
  ].map(value => String(value || '').toLowerCase()).join(' ')
  const uniqueCode = codes.some(code => code === 'SQLITE_CONSTRAINT_UNIQUE' || code === 'SQLITE_CONSTRAINT' || code === '23505' || code === 'DUPLICATE_KEY' || code === '301')
  const exactConstraint = constraint.includes('digestrecipientdatetype') ||
    message.includes('digestrecipientdatetype') ||
    constraint.includes('notificationdigestdeliveries_digestrecipientdatetype')
  const exactDigestKey = message.includes('notificationdigestdeliveries') &&
    message.includes('recipient') && message.includes('businessdate') && message.includes('digesttype')
  return uniqueCode && (exactConstraint || exactDigestKey)
}

function digestError (status, code, message) {
  return Object.assign(new Error(message), { status, statusCode: status, code })
}

module.exports = {
  buildDigestSnapshot,
  isDigestScheduleDue,
  processNotificationDigestDeliveries,
  scheduleNotificationDigests
}
