'use strict'

const crypto = require('crypto')

const MEMBERS = new Set(['donhv', 'datdt', 'sangvn', 'nhant'])

const FLOW_ALIASES = {
  authentication: 'authentication', auth: 'authentication', session: 'authentication', profile: 'authentication',
  create: 'create', lifecycle: 'create',
  assignment: 'assignment', collaboration: 'assignment', comments: 'assignment', attachments: 'assignment',
  dashboard: 'dashboard', history: 'dashboard', monitoring: 'dashboard',
  email: 'email', notifications: 'email',
  ai: 'ai',
  qa: 'qa', release: 'qa', evidence: 'qa'
}

const QUESTION_BANK = {
  authentication: ['Trace Sign In từ login.html đến AuthSessions; request nào tạo session?', 'Vì sao auth.cds và auth.js đều cần thiết trong custom authentication?', 'Breakpoint backend an toàn đầu tiên khi login thất bại nằm ở đâu, và cần xem biến nào?', 'Bearer token được gắn vào request OData ở đâu?', 'Khi database lỗi, dữ liệu nào tuyệt đối không được trả về UI/API?'],
  create: ['Trong Browser Network, request nào đại diện cho draft create, PATCH và SAVE?', 'Role validation của create chạy ở đâu; tại sao UI không phải lớp bảo vệ cuối?', 'Sau khi tạo bug thành công, những dữ liệu nghiệp vụ nào cần được ghi cùng flow?', 'Breakpoint nào giúp chẩn đoán một status transition sai mà không sửa dữ liệu?', 'Vì sao dữ liệu invalid không được persist kể cả request gọi trực tiếp OData?'],
  assignment: ['Assignee khác Current Action Owner thế nào trong IDTS?', 'Trace Smart Assign từ lựa chọn UI đến backend validation.', 'Vì sao hệ thống không được auto-select một developer ngẫu nhiên?', 'Trace một comment hoặc attachment write đến nơi lưu metadata và binary.', 'Metadata attachment khác S3 binary content thế nào, và breakpoint an toàn là gì?'],
  dashboard: ['Dashboard đang dùng OData read/projection nào cho KPI chính?', 'Nêu một derived monitoring field và dữ liệu nguồn tạo ra nó.', 'Trace History từ UI đến read model; vì sao cần limit hoặc paging?', 'Breakpoint đầu tiên khi KPI hiển thị sai là ở đâu?', 'Làm sao phân biệt lỗi dữ liệu persisted với lỗi formatter/UI binding?'],
  email: ['Trace workflow event vào Notification và email outbox.', 'Vì sao email failure không được rollback action xử lý bug?', 'Worker email claim, send và update delivery theo thứ tự nào?', 'Giải thích PENDING, SENT, FAILED và SKIPPED.', 'Khi provider lỗi, log/evidence nào an toàn để xem mà không lộ secret?'],
  ai: ['Trace một AI review action từ UI đến OData action và audit row.', 'Suggestion-only nghĩa là gì; AI không được tự thay đổi workflow bằng cách nào?', 'Provider unavailable phải fallback ra sao?', 'Những dữ liệu nào cấm gửi sang AI provider?', 'Breakpoint nào giúp phân biệt lỗi provider với lỗi UI rendering?'],
  qa: ['Browser smoke khác API integration test như thế nào?', 'Một test PASS tối thiểu phải có negative/edge evidence nào?', 'Khi nào HTTP 401/403 là expected result, khi nào là bug?', 'Trace một failure từ screenshot/log đến Jira defect như thế nào?', 'Evidence nào phải đưa vào repo và Jira attachment, và không được chứa gì?']
}

function questionPool (flow) {
  return QUESTION_BANK[flow].concat([
    `Với flow ${flow}, caller và callee quan trọng nhất là file/hàm nào?`,
    `Với flow ${flow}, dữ liệu hoặc side effect nào phải kiểm tra sau khi request hoàn tất?`,
    `Với flow ${flow}, hãy nêu một negative case và dấu hiệu PASS an toàn.`,
    `Với flow ${flow}, hãy giải thích lại luồng này trong một phút cho người mới học.`
  ])
}

function normalizeFlow (flow) {
  const normalized = String(flow || '').trim().toLowerCase()
  const resolved = FLOW_ALIASES[normalized] || FLOW_ALIASES[normalized.split(/[/:]/)[0]]
  if (!resolved) throw new Error(`Unknown flow: ${flow}`)
  return resolved
}

function parseDate (value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) throw new Error(`${label} must use YYYY-MM-DD`)
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error(`${label} is not a valid calendar date`)
  return parsed
}

function calculateInactiveDayQuestions (date, lastActivity) {
  if (!lastActivity) return 0
  const currentDate = parseDate(date, 'date')
  const activityDate = parseDate(lastActivity, 'last activity')
  if (activityDate > currentDate) throw new Error('last activity cannot be after date')
  const elapsedDays = Math.floor((currentDate - activityDate) / 86400000)
  return Math.min(4, Math.max(0, elapsedDays - 1))
}

function selectQuestions (questions, count, seed) {
  return questions.map((question, index) => ({ question, rank: crypto.createHash('sha256').update(`${seed}|${index}`).digest('hex') }))
    .sort((left, right) => left.rank.localeCompare(right.rank))
    .slice(0, count)
    .map(({ question }) => question)
}

function buildGate ({ member, flow, date, lastActivity, additionalFlow = false }) {
  const normalizedMember = String(member || '').trim().toLowerCase()
  if (!MEMBERS.has(normalizedMember)) throw new Error(`Unknown member: ${member}`)
  parseDate(date, 'date')
  const normalizedFlow = normalizeFlow(flow)
  const baseQuestions = 3
  const inactiveDayQuestions = calculateInactiveDayQuestions(date, lastActivity)
  const firstDailyGateQuestions = Math.min(7, baseQuestions + inactiveDayQuestions)
  const additionalFlowQuestions = additionalFlow ? 2 : 0
  const questionCount = firstDailyGateQuestions + additionalFlowQuestions
  return {
    member: normalizedMember, date, flow: normalizedFlow, baseQuestions, inactiveDayQuestions, additionalFlowQuestions, questionCount,
    questions: selectQuestions(questionPool(normalizedFlow), questionCount, `${normalizedMember}|${normalizedFlow}|${date}|${additionalFlow ? 'additional' : 'first'}`)
  }
}

function parseArguments (argv) {
  const options = {}
  const positional = []
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--additional-flow') options.additionalFlow = true
    else if (value.startsWith('--')) {
      options[value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = argv[index + 1]
      index += 1
    } else positional.push(value)
  }
  if (!options.member && positional.length >= 3) {
    ;[options.member, options.flow, options.date, options.lastActivity] = positional
    if (options.lastActivity === '-') delete options.lastActivity
    options.additionalFlow = positional[4] === 'additional'
  }
  return options
}

function printGate (gate) {
  console.log(`Member: ${gate.member}\nDate: ${gate.date}\nOwnership flow: ${gate.flow}\nBase questions: ${gate.baseQuestions}\nInactive-day questions: ${gate.inactiveDayQuestions}\nAdditional-flow questions: ${gate.additionalFlowQuestions}\nTotal questions: ${gate.questionCount}`)
  console.log('\nQuestions (answer before requesting hints):')
  gate.questions.forEach((question, index) => console.log(`${index + 1}. ${question}`))
  console.log('\nEvidence template (complete after human/agent assessment):\nScore:\nCritical questions:\nDebug exercise:\nTeach-back:\nEvidence: docs/learning/progress/<member>.md\nResult: PASS or FAIL')
  console.log('\nNote: --last-activity must be the last verified ownership-code activity date. The runner selects questions only; it never auto-passes a member or writes progress/Jira evidence.')
}

function main () {
  const options = parseArguments(process.argv.slice(2))
  if (!options.member || !options.flow || !options.date) throw new Error('Usage: npm run learning:gate -- <member> <flow> YYYY-MM-DD [last-activity|-] [additional]')
  printGate(buildGate(options))
}

if (require.main === module) {
  try { main() } catch (error) { console.error(`Ownership Gate runner: FAIL - ${error.message}`); process.exitCode = 1 }
}

module.exports = { buildGate, calculateInactiveDayQuestions, normalizeFlow }
