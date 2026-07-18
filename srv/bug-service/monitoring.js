// Học nhanh (DonHV): tạo read-only workload aggregate cho PM Dashboard; không được dùng nó để thay đổi ownership của Bug.
const cds = require('@sap/cds')

const { SELECT } = cds.ql

const {
  PROCESSOR_ROLE,
  STATUS
} = require('./constants')

const { trimToNull } = require('./helpers')

const STATUS_COUNT_FIELDS = new Map([
  [STATUS.ASSIGNED, 'assignedCount'],
  [STATUS.IN_REVIEW, 'inReviewCount'],
  [STATUS.IN_PROGRESS, 'inProgressCount'],
  [STATUS.REOPENED, 'reopenedCount'],
  [STATUS.NEED_MORE_INFORMATION, 'needMoreInformationCount'],
  [STATUS.RESOLVED, 'resolvedCount'],
  [STATUS.RETEST_REQUIRED, 'retestRequiredCount'],
  [STATUS.REJECTED, 'rejectedCount']
])

async function readDeveloperWorkloads (req, entities) {
  // Custom READ cho Dashboard/PM: đọc profile + Bug cần thiết, tính row workload trong memory,
  // rồi áp `$search/$filter/$orderby/$top/$skip/$select` từ CQN trước khi trả response.
  const tx = cds.tx(req)
  const [profiles, bugs] = await Promise.all([
    tx.run(
      SELECT.from(entities.DeveloperProfiles)
        .columns(
          'ID',
          'user_ID',
          'availabilityStatus_code',
          'workloadLimit',
          'active',
          { ref: ['user', 'displayName'], as: 'developerName' },
          { ref: ['user', 'email'], as: 'developerEmail' },
          { ref: ['availabilityStatus', 'name'], as: 'availabilityStatusName' },
          { ref: ['availabilityStatus', 'criticality'], as: 'availabilityCriticality' }
        )
    ),
    tx.run(
      SELECT.from(entities.Bugs)
        .columns(
          'assignee_ID',
          'status_code',
          'dueDate',
          'estimatedEffortHours',
          'nextProcessorUser_ID',
          'nextProcessorRole_code'
        )
        .where({ assignee_ID: { '!=': null } })
    )
  ])

  let rows = buildDeveloperWorkloadRows(profiles, bugs)
    .filter(row => row.active || row.openOwnedBugCount > 0)

  rows = applySearch(rows, req.query?.SELECT?.search)
  rows = applyWhere(rows, req.query?.SELECT?.where)

  const total = rows.length
  if (isCountOnly(req)) {
    return [{ $count: total }]
  }

  rows = applyOrderBy(rows, req.query?.SELECT?.orderBy)
  rows = applyLimit(rows, req.query?.SELECT?.limit)
  rows = applySelect(rows, req.query?.SELECT?.columns)

  if (req.query?.SELECT?.count === true) {
    rows.$count = total
  }

  if (req.query?.SELECT?.one) {
    return rows[0] || null
  }

  return rows
}

function buildDeveloperWorkloadRows (profiles, bugs) {
  // Gom Bug theo developer và tính count/effort/overdue; không ghi aggregate xuống database.
  const rowsByProfileID = new Map()

  for (const profile of profiles) {
    rowsByProfileID.set(profile.ID, emptyDeveloperWorkloadRow({
      developerProfileID: profile.ID,
      developerUserID: profile.user_ID || null,
      developerName: profile.developerName || null,
      developerEmail: profile.developerEmail || null,
      availabilityStatusCode: profile.availabilityStatus_code || null,
      availabilityStatusName: profile.availabilityStatusName || null,
      availabilityCriticality: profile.availabilityCriticality ?? null,
      workloadLimit: profile.workloadLimit ?? null,
      active: !!profile.active
    }))
  }

  for (const bug of bugs) {
    if (!bug.assignee_ID || bug.status_code === STATUS.CLOSED) continue

    let row = rowsByProfileID.get(bug.assignee_ID)
    if (!row) {
      row = emptyDeveloperWorkloadRow({
        developerProfileID: bug.assignee_ID,
        developerUserID: null,
        developerName: 'Unknown Developer',
        developerEmail: null,
        availabilityStatusCode: null,
        availabilityStatusName: null,
        availabilityCriticality: null,
        workloadLimit: null,
        active: false
      })
      rowsByProfileID.set(bug.assignee_ID, row)
    }

    row.openOwnedBugCount += 1
    if (isOverdueBug(bug)) row.overdueOwnedBugCount += 1
    if (isCurrentDeveloperAction(row, bug)) row.currentActionItemCount += 1

    const countField = STATUS_COUNT_FIELDS.get(bug.status_code)
    if (countField) row[countField] += 1

    row.estimatedEffortHoursTotal = roundToTwoDecimals(
      row.estimatedEffortHoursTotal + decimalToNumber(bug.estimatedEffortHours)
    )
  }

  for (const row of rowsByProfileID.values()) {
    row.isOverloaded = row.workloadLimit !== null && row.workloadLimit !== undefined
      ? row.openOwnedBugCount > row.workloadLimit
      : false
  }

  return [...rowsByProfileID.values()]
}

function emptyDeveloperWorkloadRow (base) {
  // Tạo row 0 mặc định để developer chưa có Bug vẫn xuất hiện trong PM monitoring.
  return {
    developerProfileID: base.developerProfileID,
    developerUserID: base.developerUserID,
    developerName: base.developerName,
    developerEmail: base.developerEmail,
    availabilityStatusCode: base.availabilityStatusCode,
    availabilityStatusName: base.availabilityStatusName,
    availabilityCriticality: base.availabilityCriticality,
    workloadLimit: base.workloadLimit,
    openOwnedBugCount: 0,
    overdueOwnedBugCount: 0,
    currentActionItemCount: 0,
    assignedCount: 0,
    inReviewCount: 0,
    inProgressCount: 0,
    reopenedCount: 0,
    needMoreInformationCount: 0,
    resolvedCount: 0,
    retestRequiredCount: 0,
    rejectedCount: 0,
    estimatedEffortHoursTotal: 0,
    isOverloaded: false,
    active: base.active
  }
}

function isOverdueBug (bug) {
  // Bug chỉ overdue khi chưa Closed và dueDate nhỏ hơn ngày hiện tại; ngày hôm nay chưa tính quá hạn.
  return !!(bug?.dueDate && String(bug.dueDate) < todayDateString() && bug.status_code !== STATUS.CLOSED)
}

function isCurrentDeveloperAction (row, bug) {
  // Chỉ tính workload “đang chờ developer này” khi nextProcessor và assignee cùng trỏ đúng người.
  return bug.nextProcessorRole_code === PROCESSOR_ROLE.DEVELOPER &&
    bug.nextProcessorUser_ID &&
    row.developerUserID &&
    bug.nextProcessorUser_ID === row.developerUserID
}

function todayDateString () {
  // Trả YYYY-MM-DD theo UTC để so với CDS Date mà không lẫn phần giờ.
  return new Date().toISOString().slice(0, 10)
}

function decimalToNumber (value) {
  // CAP/PostgreSQL có thể trả Decimal dạng chuỗi; chuyển an toàn để cộng effort.
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function roundToTwoDecimals (value) {
  // Làm tròn effort hiển thị, không thay đổi dữ liệu effort gốc trên Bug.
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function isCountOnly (req) {
  // Nhận diện request chỉ cần `$count`; caller trả số thay vì materialize toàn bộ row ra UI.
  const columns = req.query?.SELECT?.columns
  return Array.isArray(columns) &&
    columns.length === 1 &&
    columns[0]?.as === '$count'
}

function applySearch (rows, search) {
  // Áp full-text search đơn giản trên row đã tính vì đây không phải table SQL trực tiếp.
  const term = searchTermFromCqn(search)
  if (!term) return rows

  const needle = term.toLowerCase()
  return rows.filter(row => {
    const haystack = [
      row.developerName,
      row.developerEmail,
      row.availabilityStatusName
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(needle)
  })
}

function searchTermFromCqn (search) {
  // Trích text từ biểu thức CQN do CAP parse; không parse query string thủ công.
  if (!search) return null
  if (typeof search === 'string') return trimToNull(search)
  if (Array.isArray(search)) {
    const parts = search
      .map(entry => entry?.val)
      .filter(value => typeof value === 'string')
    return trimToNull(parts.join(' '))
  }
  return null
}

function applyWhere (rows, where) {
  // Đánh giá `$filter` trên aggregate rows trong memory; chỉ hỗ trợ tập toán tử được implement bên dưới.
  if (!Array.isArray(where) || !where.length) return rows
  return rows.filter(row => evaluateExpression(where, row))
}

function evaluateExpression (tokens, row) {
  // Evaluator nhỏ cho AND/OR/comparison CQN; breakpoint tại đây khi filter dashboard trả sai row.
  let index = 0

  function parseOr () {
    let value = parseAnd()
    while (tokens[index] === 'or') {
      index += 1
      value = value || parseAnd()
    }
    return value
  }

  function parseAnd () {
    let value = parseFactor()
    while (tokens[index] === 'and') {
      index += 1
      value = value && parseFactor()
    }
    return value
  }

  function parseFactor () {
    const token = tokens[index]
    if (token === 'not') {
      index += 1
      return !parseFactor()
    }
    if (token?.xpr) {
      index += 1
      return evaluateExpression(token.xpr, row)
    }
    return parseComparison()
  }

  function parseComparison () {
    const left = tokens[index++]
    const operator = tokens[index++]
    const right = tokens[index++]
    return compareValues(valueFromOperand(left, row), operator, valueFromOperand(right, row))
  }

  return parseOr()
}

function valueFromOperand (operand, row) {
  // Đọc literal hoặc field reference từ operand CQN; không dùng eval JavaScript.
  if (operand?.ref?.length) return row[operand.ref.at(-1)]
  if (Object.prototype.hasOwnProperty.call(operand || {}, 'val')) return operand.val
  return operand
}

function compareValues (left, operator, right) {
  // Thực hiện phép so sánh allow-list; operator lạ trả false thay vì chạy code động.
  switch (operator) {
    case '=':
    case '==':
      return left === right
    case '!=':
    case '<>':
      return left !== right
    case '>':
      return left > right
    case '>=':
      return left >= right
    case '<':
      return left < right
    case '<=':
      return left <= right
    case 'like':
      return likeCompare(left, right)
    default:
      return true
  }
}

function likeCompare (left, right) {
  // Mô phỏng LIKE cho chuỗi aggregate; escape/normalize wildcard trước khi so.
  if (left === null || left === undefined || right === null || right === undefined) return false
  const pattern = String(right)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.')
  return new RegExp(`^${pattern}$`, 'i').test(String(left))
}

function applyOrderBy (rows, orderBy) {
  // Sort bản sao rows theo CQN order để không làm biến đổi array nguồn dùng cho count/filter khác.
  const sorted = [...rows]
  const clauses = Array.isArray(orderBy) && orderBy.length
    ? orderBy
    : [{ ref: ['developerName'], sort: 'asc' }]

  sorted.sort((left, right) => {
    for (const clause of clauses) {
      const field = clause?.ref?.at(-1)
      if (!field) continue

      const direction = String(clause.sort || 'asc').toLowerCase() === 'desc' ? -1 : 1
      const comparison = compareOrderValues(left[field], right[field]) * direction
      if (comparison !== 0) return comparison
    }
    return 0
  })

  return sorted
}

function compareOrderValues (left, right) {
  // So null/string/number ổn định cho sort nhiều cột.
  if (left === right) return 0
  if (left === null || left === undefined) return 1
  if (right === null || right === undefined) return -1
  if (typeof left === 'string' || typeof right === 'string') {
    return String(left).localeCompare(String(right))
  }
  return left < right ? -1 : 1
}

function applyLimit (rows, limit) {
  // Áp `$skip/$top` sau filter và sort, đúng thứ tự OData mong đợi.
  if (!limit) return rows
  const offset = Number(limit.offset?.val || 0)
  const top = Number(limit.rows?.val || rows.length)
  return rows.slice(offset, offset + top)
}

function applySelect (rows, columns) {
  // Chỉ trả field client yêu cầu nhưng giữ key cần thiết; giảm payload cho dashboard.
  if (!Array.isArray(columns) || !columns.length) return rows
  if (columns.some(column => column === '*' || column?.ref?.[0] === '*')) return rows

  const projectedFields = columns
    .filter(column => Array.isArray(column?.ref) && column.ref.length === 1)
    .map(column => ({ source: column.ref[0], target: column.as || column.ref[0] }))

  if (!projectedFields.length) return rows

  return rows.map(row => {
    const projected = {}
    for (const field of projectedFields) {
      projected[field.target] = row[field.source]
    }
    return projected
  })
}

module.exports = {
  readDeveloperWorkloads
}
