// Nguồn hằng số runtime cho lifecycle, role, action, capability và read-only entity.
// Đổi code ở đây phải đồng bộ catalog seed, schema/service contract, handler và Fiori annotation/value help.
const STATUS = {
  // Các trạng thái Bug được lưu bằng code; label hiển thị lấy từ StatusValues.
  NEW: 'NEW',
  PENDING_ASSIGNMENT: 'PENDING_ASSIGNMENT',
  ASSIGNED: 'ASSIGNED',
  IN_REVIEW: 'IN_REVIEW',
  NEED_MORE_INFORMATION: 'NEED_MORE_INFORMATION',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  RETEST_REQUIRED: 'RETEST_REQUIRED',
  REJECTED: 'REJECTED',
  REOPENED: 'REOPENED',
  CLOSED: 'CLOSED'
}

const PROCESSOR_ROLE = {
  // Role/hàng đợi đang cần hành động tiếp theo; không đồng nghĩa với assignee kỹ thuật.
  TESTER: 'TESTER',
  DEVELOPER: 'DEVELOPER',
  PM: 'PM',
  UNASSIGNED_QUEUE: 'UNASSIGNED_QUEUE',
  NONE: 'NONE'
}

const USER_ROLE = {
  // Ba role user nội bộ dùng cho authorization backend.
  TESTER: 'TESTER',
  DEVELOPER: 'DEVELOPER',
  PM: 'PM'
}

const ACTION = {
  // Loại thao tác audit/history; không phải toàn bộ tên OData action.
  CREATE: 'CREATE',
  EDIT: 'EDIT',
  ASSIGN: 'ASSIGN',
  REASSIGN: 'REASSIGN',
  REASSIGN_RETEST_OWNER: 'REASSIGN_RETEST_OWNER',
  STATUS_CHANGE: 'STATUS_CHANGE',
  REQUEST_INFO: 'REQUEST_INFO',
  REJECT: 'REJECT',
  RESOLVE: 'RESOLVE',
  RETEST: 'RETEST',
  CLOSE: 'CLOSE',
  REOPEN: 'REOPEN',
  ASSIGN_TO_DEVELOPER: 'ASSIGN_TO_DEVELOPER',
  MOVE_TO_PENDING_ASSIGNMENT: 'MOVE_TO_PENDING_ASSIGNMENT',
  MARK_IN_REVIEW: 'MARK_IN_REVIEW',
  REQUEST_MORE_INFORMATION: 'REQUEST_MORE_INFORMATION',
  RESUBMIT_TO_DEVELOPER: 'RESUBMIT_TO_DEVELOPER',
  REJECT_BUG: 'REJECT_BUG',
  START_PROGRESS: 'START_PROGRESS',
  RESOLVE_BUG: 'RESOLVE_BUG',
  SEND_TO_RETEST: 'SEND_TO_RETEST',
  CLOSE_BUG: 'CLOSE_BUG',
  REOPEN_BUG: 'REOPEN_BUG'
}

const HISTORY_FIELD_LABELS = {
  // Nhãn user-facing cho field audit để timeline không hiện tên kỹ thuật.
  title: 'Title',
  description: 'Description',
  status: 'Status',
  priority: 'Priority',
  severity: 'Severity',
  environment: 'Environment',
  environmentDetail: 'Environment Detail',
  assignee: 'Assignee',
  sapModule: 'SAP Module',
  applicationComponent: 'Application Component',
  defectCategory: 'Defect Category',
  componentCategory: 'Component Category',
  retestOwner: 'Retest Owner',
  stepsToReproduce: 'Steps to Reproduce',
  actualResult: 'Actual Result',
  expectedResult: 'Expected Result',
  testCaseRef: 'Test Case Reference',
  testRunRef: 'Test Run Reference',
  plannedCompletionDate: 'Planned Completion Date',
  dueDate: 'Due Date',
  estimatedEffortHours: 'Estimated Effort Hours',
  nextProcessorUser: 'Current Action Owner',
  nextProcessorRole: 'Action Owner Role',
  rejectionReason: 'Rejection Reason',
  comment: 'Comment',
  attachment: 'Attachment'
}

const COORDINATOR_ROLES = new Set([USER_ROLE.TESTER, USER_ROLE.PM])
// Các Set quyền giúp permission/capability dùng cùng allow-list thay vì rải điều kiện role khắp file.
const COMMENT_ROLES = new Set([USER_ROLE.TESTER, USER_ROLE.DEVELOPER, USER_ROLE.PM])
const ATTACHMENT_ROLES = new Set([USER_ROLE.TESTER, USER_ROLE.DEVELOPER, USER_ROLE.PM])
const DEVELOPER_ACTIONS = new Set([
  ACTION.MARK_IN_REVIEW,
  ACTION.REQUEST_MORE_INFORMATION,
  ACTION.REJECT_BUG,
  ACTION.START_PROGRESS,
  ACTION.RESOLVE_BUG
])
const DEVELOPER_DIRECT_STATUSES = new Set([
  STATUS.IN_REVIEW,
  STATUS.NEED_MORE_INFORMATION,
  STATUS.IN_PROGRESS,
  STATUS.RESOLVED,
  STATUS.REJECTED
])

const EVENT = {
  ASSIGNED: 'ASSIGNED',
  NEED_MORE_INFORMATION: 'NEED_MORE_INFORMATION',
  UPDATED: 'UPDATED',
  REJECTED: 'REJECTED',
  CLOSED: 'CLOSED'
}

const ALLOWED_TRANSITIONS = {
  // State machine chính: key là status hiện tại, array là status được phép đi tới.
  [STATUS.NEW]: [STATUS.PENDING_ASSIGNMENT, STATUS.ASSIGNED, STATUS.REJECTED],
  [STATUS.PENDING_ASSIGNMENT]: [STATUS.ASSIGNED, STATUS.REJECTED],
  [STATUS.ASSIGNED]: [
    STATUS.PENDING_ASSIGNMENT,
    STATUS.ASSIGNED,
    STATUS.IN_REVIEW,
    STATUS.NEED_MORE_INFORMATION,
    STATUS.IN_PROGRESS,
    STATUS.REJECTED
  ],
  [STATUS.IN_REVIEW]: [
    STATUS.ASSIGNED,
    STATUS.NEED_MORE_INFORMATION,
    STATUS.IN_PROGRESS,
    STATUS.RESOLVED,
    STATUS.REJECTED
  ],
  [STATUS.NEED_MORE_INFORMATION]: [STATUS.ASSIGNED, STATUS.PENDING_ASSIGNMENT],
  [STATUS.IN_PROGRESS]: [STATUS.NEED_MORE_INFORMATION, STATUS.RESOLVED, STATUS.REJECTED],
  [STATUS.RESOLVED]: [STATUS.RETEST_REQUIRED, STATUS.CLOSED, STATUS.REOPENED],
  [STATUS.RETEST_REQUIRED]: [STATUS.CLOSED, STATUS.REOPENED],
  [STATUS.REJECTED]: [STATUS.PENDING_ASSIGNMENT, STATUS.ASSIGNED],
  [STATUS.REOPENED]: [STATUS.ASSIGNED, STATUS.IN_REVIEW, STATUS.IN_PROGRESS],
  [STATUS.CLOSED]: [STATUS.REOPENED]
}

const DEVELOPER_STATUSES = new Set([
  // Status mà current action owner thường là Developer assignee.
  STATUS.ASSIGNED,
  STATUS.IN_REVIEW,
  STATUS.IN_PROGRESS,
  STATUS.REOPENED
])

const TESTER_STATUSES = new Set([
  // Status mà reporter/Tester cần phản hồi hoặc xác nhận.
  STATUS.NEED_MORE_INFORMATION,
  STATUS.REJECTED,
  STATUS.RESOLVED,
  STATUS.RETEST_REQUIRED
])

const CAPABILITY_FIELDS = new Set([
  // Virtual fields cần bảo vệ trong `$select` để after READ tính enable/visible cho action.
  'canAddComment',
  'canEdit',
  'canManageAttachments',
  'canReassignRetestOwner',
  'canMarkInReview',
  'canStartProgress',
  'canResolve',
  'canRequestMoreInfo',
  'canReject',
  'canSendToRetest',
  'canClose',
  'canReopen',
  'canAssign',
  'canMoveToPending',
  'canResubmit',
  'assigneeFieldControl',
  'bugRequiredFieldControl',
  'bugOptionalFieldControl'
])

const FIELD_CONTROL = {
  // Giá trị SAP Common.FieldControl dùng cho field động theo role/ownership.
  READ_ONLY: 1,
  OPTIONAL: 3,
  MANDATORY: 7
}

const READ_ONLY_ENTITY_NAMES = [
  // Projection/catalog/audit chỉ đọc từ client; guards.js gắn reject handler cho thao tác ghi.
  'Users',
  'ActiveTesters',
  'DeveloperProfiles',
  'SAPModules',
  'ApplicationComponents',
  'SAPModuleComponents',
  'DefectCategories',
  'ComponentCategories',
  'DeveloperResponsibilities',
  'AssignableDevelopers',
  'DeveloperWorkloads',
  'ValidDefectCategories',
  'UserRoles',
  'StatusValues',
  'PriorityValues',
  'SeverityValues',
  'EnvironmentValues',
  'ProcessorRoleValues',
  'AvailabilityStatuses',
  'ResponsibilityLevels',
  'ActionTypes',
  'NotificationEventTypes',
  'NotificationChannels',
  'NotificationDeliveryStatuses',
  'DuplicateRelationTypes',
  'AiSuggestionFeatureTypes',
  'AiSuggestionReviewStates',
  'AiSuggestions',
  'HistoryEvents',
  'HistoryLogs',
  'Notifications',
  'NotificationDeliveries',
  'DuplicateLinks'
]

module.exports = {
  STATUS,
  PROCESSOR_ROLE,
  USER_ROLE,
  ACTION,
  HISTORY_FIELD_LABELS,
  COORDINATOR_ROLES,
  COMMENT_ROLES,
  ATTACHMENT_ROLES,
  DEVELOPER_ACTIONS,
  DEVELOPER_DIRECT_STATUSES,
  EVENT,
  ALLOWED_TRANSITIONS,
  DEVELOPER_STATUSES,
  TESTER_STATUSES,
  CAPABILITY_FIELDS,
  FIELD_CONTROL,
  READ_ONLY_ENTITY_NAMES
}
