// Học nhanh (DonHV): helper đọc Bug/user và chuẩn hóa input dùng chung. Chỉ giữ logic không thuộc riêng một action để tránh rule bị lệch.
const cds = require('@sap/cds')

const { SELECT } = cds.ql
const { enforcePlatformRoleAlignment, isXsuaaRuntime } = require('../auth/platform-role')
const { selectActiveUserForRequest } = require('../auth/identity-map')

async function readBug (req, entities, bugID) {
  // Helper chung đọc một Bug trong transaction của request; caller nhận row hoặc undefined, không tự reject.
  if (!bugID) return null
  return cds.tx(req).run(SELECT.one.from(entities.Bugs).where({ ID: bugID }))
}

async function resolveRequestUser (req, entities) {
  // Chuyển identity từ CAP request/session thành Users row active của IDTS. Đây là nguồn actor đáng tin
  // cho permission, reporter, author và history; không dùng role/email do payload nghiệp vụ gửi lên.
  const users = await cds.tx(req).run(
    SELECT.from('idts.cap.Users')
      .columns('ID', 'displayName', 'email', 'role_code', 'active', 'externalIdentityKeyHash')
      .where({ active: true })
  )
  const user = selectActiveUserForRequest(users, req.user, { requireExternalIdentity: isXsuaaRuntime() })
  return user ? enforcePlatformRoleAlignment(req, user) : null
}

function requestUserCandidates (req) {
  // Gom các ID/email có thể có trong `req.user` theo thứ tự ưu tiên; chỉ tạo danh sách, chưa query database.
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
  // Map status code lưu trong DB sang label để History/UI hiển thị; fallback code giúp dữ liệu cũ vẫn đọc được.
  return displayCodeListName(req, entities.StatusValues, code)
}

async function displayProcessorRole (req, entities, code) {
  // Map next-processor role code sang tên thân thiện cho audit, không làm thay đổi role thật của user.
  return displayCodeListName(req, entities.ProcessorRoleValues, code)
}

async function displayCodeListName (req, entity, code) {
  // Helper query catalog theo code và trả name; dùng cho Priority/Severity/Environment trong history.
  if (!code || !entity) return null
  const row = await cds.tx(req).run(
    SELECT.one.from(entity)
      .columns('name')
      .where({ code })
  )
  return row?.name || String(code)
}

async function displayUserName (req, entities, userID) {
  // Map Users.ID sang displayName; tránh đưa UUID thô lên giao diện/audit khi có dữ liệu người dùng.
  if (!userID) return null
  const row = await cds.tx(req).run(
    SELECT.one.from(entities.Users)
      .columns('displayName')
      .where({ ID: userID })
  )
  return row?.displayName || String(userID)
}

async function displayDeveloperName (req, entities, developerProfileID) {
  // Assignee lưu DeveloperProfile ID nên cần query profile/user để lấy tên hiển thị.
  if (!developerProfileID) return null
  const userID = await userIDForDeveloper(req, entities, developerProfileID)
  if (!userID) return String(developerProfileID)
  return displayUserName(req, entities, userID)
}

async function displayEntityNameByID (req, entity, id) {
  // Map foreign key UUID sang field `name`; caller chịu trách nhiệm truyền đúng entity projection.
  if (!id || !entity) return null
  const row = await cds.tx(req).run(
    SELECT.one.from(entity)
      .columns('name')
      .where({ ID: id })
  )
  return row?.name || String(id)
}

async function displayComponentCategory (req, entities, componentCategoryID) {
  // Ghép tên Application Component và Defect Category của bridge row thành một label dễ đọc.
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
  // Tìm số BUG lớn nhất trong transaction rồi sinh số tiếp theo; caller ghi kết quả vào req.data lúc create.
  const result = await cds.tx(req).run(SELECT.one.from(entities.Bugs).columns('count(*) as count'))
  const next = Number(result?.count || 0) + 1
  return `BUG-${String(next).padStart(4, '0')}`
}

async function firstUserByRole (req, entities, roleCode) {
  // Fallback có kiểm soát: lấy user active đầu tiên của role cho hàng đợi khi Bug cũ thiếu owner cụ thể.
  return cds.tx(req).run(SELECT.one.from(entities.Users).where({ role_code: roleCode, active: true }))
}

async function userIDForDeveloper (req, entities, developerProfileID) {
  // Chuyển DeveloperProfiles.ID sang Users.ID; permission và notification cần Users.ID chứ không dùng ID assignee trực tiếp.
  if (!developerProfileID) return null
  const profile = await cds.tx(req).run(SELECT.one.from(entities.DeveloperProfiles).where({ ID: developerProfileID }))
  return profile?.user_ID || null
}

function bugIDFrom (req) {
  // Đọc Bug ID từ nhiều hình dạng params/data của bound action và draft request; chỉ parse, không query.
  return req.params?.[0]?.ID || req.data?.ID
}

function trimToNull (value) {
  // Chuẩn hóa text trống/whitespace thành null để validation không coi dấu cách là dữ liệu hợp lệ.
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed || null
}

function reasonTarget () {
  // Trả tên target field thống nhất để CAP/Fiori gắn message lỗi action vào đúng input reason/note.
  return 'reason'
}

function toHistoryValue (value) {
  // Chuyển giá trị sang chuỗi an toàn để lưu HistoryLogs; null/undefined được giữ thành biểu diễn rỗng có chủ ý.
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
