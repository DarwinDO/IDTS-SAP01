const STATUS = {
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
  TESTER: 'TESTER',
  DEVELOPER: 'DEVELOPER',
  PM: 'PM',
  UNASSIGNED_QUEUE: 'UNASSIGNED_QUEUE',
  NONE: 'NONE'
}

const USER_ROLE = {
  TESTER: 'TESTER',
  DEVELOPER: 'DEVELOPER',
  PM: 'PM'
}

const ACTION = {
  CREATE: 'CREATE',
  EDIT: 'EDIT',
  ASSIGN: 'ASSIGN',
  REASSIGN: 'REASSIGN',
  STATUS_CHANGE: 'STATUS_CHANGE',
  REQUEST_INFO: 'REQUEST_INFO',
  REJECT: 'REJECT',
  RESOLVE: 'RESOLVE',
  RETEST: 'RETEST',
  CLOSE: 'CLOSE',
  REOPEN: 'REOPEN'
}

const HISTORY_FIELD_LABELS = {
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
const COMMENT_ROLES = new Set([USER_ROLE.TESTER, USER_ROLE.DEVELOPER, USER_ROLE.PM])
const ATTACHMENT_ROLES = new Set([USER_ROLE.TESTER, USER_ROLE.DEVELOPER, USER_ROLE.PM])
const DEVELOPER_ACTIONS = new Set([
  ACTION.STATUS_CHANGE,
  ACTION.REQUEST_INFO,
  ACTION.REJECT,
  ACTION.RESOLVE
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
  STATUS.ASSIGNED,
  STATUS.IN_REVIEW,
  STATUS.IN_PROGRESS,
  STATUS.REOPENED
])

const TESTER_STATUSES = new Set([
  STATUS.NEED_MORE_INFORMATION,
  STATUS.REJECTED,
  STATUS.RESOLVED,
  STATUS.RETEST_REQUIRED
])

const CAPABILITY_FIELDS = new Set([
  'canAddComment',
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
  'assigneeFieldControl'
])

const FIELD_CONTROL = {
  READ_ONLY: 1,
  OPTIONAL: 3
}

const READ_ONLY_ENTITY_NAMES = [
  'Users',
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
