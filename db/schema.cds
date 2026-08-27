// Đây là mô hình dữ liệu gốc của IDTS. Entity định nghĩa dữ liệu được lưu; association là liên kết tham chiếu;
// composition là dữ liệu con thuộc vòng đời Bug. Khi debug dữ liệu sai, bắt đầu từ field/link ở đây rồi lần sang service và handler ghi nó.
namespace idts.cap;

using { cuid, managed } from '@sap/cds/common';
using { Attachments as ManagedAttachments } from '@cap-js/attachments';

aspect BugAttachments : ManagedAttachments {
  // @cap-js/attachments quản lý metadata/storageRef/content flow; IDTS bổ sung fileSize để UI và validation hiển thị dung lượng.
  fileSize : Integer64 @readonly;
}

aspect CodeList {
  // Các bảng danh mục dùng chung một hình dạng. `active=false` giữ lịch sử nhưng ngăn chọn giá trị mới.
  key code     : String(40);
      name     : String(120) not null;
      descr    : String(255);
      sortOrder: Integer;
      active   : Boolean default true;
      criticality : Integer;
}

entity UserRoles : CodeList {}
entity StatusValues : CodeList {}
entity PriorityValues : CodeList {}
entity SeverityValues : CodeList {}
entity EnvironmentValues : CodeList {}
entity ProcessorRoleValues : CodeList {}
entity AvailabilityStatuses : CodeList {}
entity ResponsibilityLevels : CodeList {}
entity ActionTypes : CodeList {}
entity NotificationEventTypes : CodeList {}
entity NotificationChannels : CodeList {}
entity NotificationDeliveryStatuses : CodeList {}
entity UserOnboardingStatuses : CodeList {}
entity DuplicateRelationTypes : CodeList {}
entity AiSuggestionFeatureTypes : CodeList {}
entity AiSuggestionReviewStates : CodeList {}

entity Users : cuid, managed {
  // User nghiệp vụ giữ profile/role/password hash. Không bao giờ lưu password thô trong entity này.
  displayName : String(120) not null;
  email       : String(255) not null;
  role        : Association to UserRoles not null;
  // Nullable for legacy rows. Once linked, the hash of origin + issuer + stable subject is the authority;
  // email remains a mutable contact/login attribute and must not override a different linked identity.
  externalIdentityOrigin  : String(120);
  externalIdentityIssuer  : String(500);
  externalIdentitySubject : String(255);
  externalIdentityKeyHash : String(64);
  passwordHash: String(255);
  passwordChangedAt : Timestamp;
  active      : Boolean default true;
}

annotate Users with @assert.unique.userExternalIdentity: [ externalIdentityKeyHash ];

entity AuthSessions : cuid, managed {
  // Mỗi lần login tạo session; DB chỉ giữ tokenHash. revokedAt/expiresAt quyết định token còn dùng được hay không.
  user       : Association to Users not null;
  tokenHash  : String(64) not null;
  issuedAt   : Timestamp not null;
  expiresAt  : Timestamp not null;
  revokedAt  : Timestamp;
  lastUsedAt : Timestamp;
  userAgent  : String(255);
}

entity DeveloperProfiles : cuid, managed {
  // DeveloperProfile là phần mở rộng của User cho assignment/workload; Users.ID và DeveloperProfiles.ID là hai ID khác nhau.
  user               : Association to Users not null;
  availabilityStatus : Association to AvailabilityStatuses;
  workloadLimit      : Integer;
  administrationState : Composition of one DeveloperProfileAdministrationStates on administrationState.developerProfile = $self;
  active             : Boolean default true;
}

entity DeveloperProfileAdministrationStates : cuid, managed {
  developerProfile      : Association to DeveloperProfiles not null;
  administrationVersion : Integer default 0 not null;
}

annotate DeveloperProfileAdministrationStates with @assert.unique.developerProfileAdministrationState: [ developerProfile ];

entity SAPModules : cuid, managed {
  code   : String(20) not null;
  name   : String(120) not null;
  active : Boolean default true;
}

annotate SAPModules with @assert.unique.catalogCode: [ code ];

entity ApplicationComponents : cuid, managed {
  code          : String(40) not null;
  name          : String(120) not null;
  componentType : String(60);
  active        : Boolean default true;
}

annotate ApplicationComponents with @assert.unique.catalogCode: [ code ];

entity SAPModuleComponents : cuid, managed {
  // Bridge này nói component thuộc SAP module nào; không phải assignment responsibility của developer.
  sapModule : Association to SAPModules not null;
  component : Association to ApplicationComponents not null;
  active    : Boolean default true;
}

entity DefectCategories : cuid, managed {
  code         : String(40) not null;
  name         : String(120) not null;
  categoryType : String(60);
  active       : Boolean default true;
}

annotate DefectCategories with @assert.unique.catalogCode: [ code ];

entity ComponentCategories : cuid, managed {
  // Bridge component + defect category tạo khóa phân loại thật dùng để đối chiếu DeveloperResponsibilities.
  component      : Association to ApplicationComponents not null;
  defectCategory : Association to DefectCategories not null;
  active         : Boolean default true;
}

annotate ComponentCategories with @assert.unique.catalogPair: [ component, defectCategory ];

entity CatalogAdministrationAuditEvents : cuid, managed {
  // Audit append-only cho quản trị catalog; chỉ lưu summary an toàn, không lưu raw request hoặc identity/provider data.
  actor         : Association to Users not null;
  catalogType   : String(30) not null;
  targetID      : UUID not null;
  action        : String(30) not null;
  result        : String(30) not null;
  beforeSummary : String(500);
  afterSummary  : String(500);
  reason        : String(500);
  correlationId : UUID not null;
}

entity DeveloperResponsibilities : cuid, managed {
  // Quy định Developer nào phù hợp cặp component/category và tùy chọn module; Smart Assign đọc, backend assign kiểm lại.
  developerProfile   : Association to DeveloperProfiles not null;
  componentCategory  : Association to ComponentCategories not null;
  sapModule          : Association to SAPModules;
  responsibilityLevel: Association to ResponsibilityLevels;
  active             : Boolean default true;
}

entity Bugs : cuid, managed {
  // Aggregate root chính. `assignee` là technical owner; `nextProcessor*` là người/role cần hành động tiếp theo.
  bugNumber              : String(30)         @Common.Label : 'Bug Number';
  title                  : String(255) not null @Common.Label : 'Title';
  description            : LargeString not null @Common.Label : 'Description';
  status                 : Association to StatusValues not null;
  @assert.target
  priority               : Association to PriorityValues not null;
  @assert.target
  severity               : Association to SeverityValues not null;
  @assert.target
  environment            : Association to EnvironmentValues;
  environmentDetail      : String(255)        @Common.Label : 'Environment Detail';
  stepsToReproduce       : LargeString not null @Common.Label : 'Steps to Reproduce';
  actualResult           : LargeString not null @Common.Label : 'Actual Result';
  expectedResult         : LargeString not null @Common.Label : 'Expected Result';
  sapModule              : Association to SAPModules;
  applicationComponent   : Association to ApplicationComponents not null;
  defectCategory         : Association to DefectCategories not null;
  componentCategory      : Association to ComponentCategories not null;
  reporter               : Association to Users not null;
  retestOwner            : Association to Users;
  assignee               : Association to DeveloperProfiles;
  nextProcessorUser      : Association to Users;
  nextProcessorRole      : Association to ProcessorRoleValues;
  rejectionReason        : LargeString        @Common.Label : 'Rejection Reason';
  testCaseRef            : String(80)         @Common.Label : 'Test Case Reference';
  testRunRef             : String(80)         @Common.Label : 'Test Run Reference';
  plannedCompletionDate  : Date               @Common.Label : 'Planned Completion Date';
  dueDate                : Date               @Common.Label : 'Due Date';
  estimatedEffortHours   : Decimal(9,2)       @Common.Label : 'Estimated Effort Hours';

  // Các composition bên dưới thuộc Bug: xóa/vòng đời Bug ảnh hưởng dữ liệu con theo semantics CAP composition.
  comments               : Composition of many Comments on comments.bug = $self;
  attachments            : Composition of many BugAttachments;
  historyEvents          : Composition of many HistoryEvents on historyEvents.bug = $self;
  notifications          : Composition of many Notifications on notifications.bug = $self;
  duplicateLinks         : Composition of many DuplicateLinks on duplicateLinks.sourceBug = $self;
  aiSuggestions          : Composition of many AiSuggestions on aiSuggestions.bug = $self;
}

entity Comments : cuid, managed {
  // Comment chỉ tồn tại sau khi gắn Bug và author đã xác thực; content không phải history log kỹ thuật.
  bug        : Association to Bugs not null;
  author     : Association to Users not null;
  authorRole : Association to UserRoles;
  content    : LargeString not null;
}

entity HistoryEvents : cuid, managed {
  // Một thao tác người dùng tạo một HistoryEvent; `logs` chứa từng field old/new của cùng thao tác.
  bug        : Association to Bugs not null;
  actor      : Association to Users not null;
  actorRole  : Association to UserRoles;
  actionType : Association to ActionTypes not null;
  summary    : String(500) not null;
  reason     : LargeString;
  logs       : Composition of many HistoryLogs on logs.event = $self;
}

annotate Bugs.attachments with {
  // Binary tối đa 10MB và chỉ nhận MIME allow-list. Metadata nằm PostgreSQL; storage adapter giữ nội dung ở S3/cloud storage.
  content @Validation.Maximum : '10MB'
          // Force a real browser download. The plugin default is inline preview,
          // which opens text/PDF content in a new tab instead of saving the file.
          @Core.ContentDisposition.Type : 'attachment'
          @Core.AcceptableMediaTypes : [
            'image/jpeg',
            'image/png',
            'application/pdf',
            'text/plain',
            'application/json',
            'text/csv',
            'application/zip'
          ];
}

entity HistoryLogs : cuid, managed {
  // Một row mô tả một field thay đổi; raw value phục vụ audit, display value phục vụ người đọc.
  bug        : Association to Bugs not null;
  event      : Association to HistoryEvents not null;
  actor      : Association to Users not null;
  actorRole  : Association to UserRoles;
  actionType : Association to ActionTypes not null;
  fieldName  : String(80);
  fieldLabel : String(120);
  oldValue   : String(1000);
  oldValueDisplay : String(1000);
  newValue   : String(1000);
  newValueDisplay : String(1000);
  reason     : LargeString;
}

entity Notifications : cuid, managed {
  // Notification in-app là intent nghiệp vụ; composition deliveries theo dõi việc gửi từng channel như EMAIL.
  bug            : Association to Bugs not null;
  recipient      : Association to Users not null;
  eventType      : Association to NotificationEventTypes not null;
  channel        : Association to NotificationChannels;
  deliveryStatus : Association to NotificationDeliveryStatuses not null;
  message        : String(500);
  sentAt         : Timestamp;
  deliveries     : Composition of many NotificationDeliveries on deliveries.notification = $self;
}

extend Notifications with { sourceKey : String(255); }
annotate Notifications with @assert.unique.notificationSourceKey: [ sourceKey ];

entity NotificationDeliveries : cuid, managed {
  // Outbox email lưu message snapshot, retry/lock/status. Provider credential không thuộc entity này.
  notification      : Association to Notifications not null;
  channel           : Association to NotificationChannels not null;
  recipientEmail    : String(255);
  templateKey       : String(80) not null;
  subject           : String(255) not null;
  textBody          : LargeString not null;
  htmlBody          : LargeString not null;
  status            : Association to NotificationDeliveryStatuses not null;
  attemptCount      : Integer default 0 not null;
  nextAttemptAt     : Timestamp;
  lastAttemptAt     : Timestamp;
  sentAt            : Timestamp;
  lastErrorCode     : String(80);
  lastErrorSummary  : String(500);
  providerMessageId : String(255);
  lockedUntil       : Timestamp;
  lockToken         : String(64);
}

annotate NotificationDeliveries with @assert.unique.notificationChannel: [ notification, channel ];
// Unique constraint ngăn cùng một notification tạo hai delivery EMAIL khi workflow/worker chạy lặp.

entity UserOnboardingRequests : cuid, managed {
  targetEmailNormalized : String(255) not null;
  linkTargetUser            : Association to Users;
  linkSourceEmailNormalized : String(255);
  openRequestKey        : String(64);
  requestedRole         : Association to UserRoles not null;
  userAdminRequested    : Boolean default false not null;
  status                : Association to UserOnboardingStatuses not null;
  requestedBy           : Association to Users not null;
  expiresAt             : Timestamp not null;
  tokenNonce            : String(120) not null;
  tokenHash             : String(64) not null;
  consumedAt            : Timestamp;
  verifiedAt            : Timestamp;
  identityOrigin        : String(120);
  identityIssuer        : String(500);
  identitySubject       : String(255);
  identityPlatformUserId: String(255);
  identityKeyHash       : String(64);
  identityEmailNormalized : String(255);
  provisioningVersion   : Integer default 0 not null;
  approvedAt            : Timestamp;
  approvedBy            : Association to Users;
  activeUser            : Association to Users;
  latestOperation       : Association to UserAccessOperations;
  provisionedAt         : Timestamp;
  revokedAt             : Timestamp;
  revokedBy             : Association to Users;
  correlationId         : UUID not null;
  lastErrorCode         : String(80);
  lastErrorSummary      : String(500);
  deliveries            : Composition of many UserOnboardingDeliveries on deliveries.onboardingRequest = $self;
  developerProfile      : Composition of one UserOnboardingDeveloperProfiles on developerProfile.onboardingRequest = $self;
  developerResponsibilities : Composition of many UserOnboardingDeveloperResponsibilities on developerResponsibilities.onboardingRequest = $self;
}

annotate UserOnboardingRequests with @assert.unique.onboardingTokenHash: [ tokenHash ];
annotate UserOnboardingRequests with @assert.unique.externalIdentity: [ identityKeyHash ];
annotate UserOnboardingRequests with @assert.unique.openOnboardingRequest: [ openRequestKey ];

entity UserOnboardingDeveloperProfiles : cuid, managed {
  onboardingRequest   : Association to UserOnboardingRequests not null;
  availabilityStatus : Association to AvailabilityStatuses not null;
  workloadLimit      : Integer not null;
}

annotate UserOnboardingDeveloperProfiles with @assert.unique.onboardingDeveloperProfile: [ onboardingRequest ];

entity UserOnboardingDeveloperResponsibilities : cuid, managed {
  onboardingRequest   : Association to UserOnboardingRequests not null;
  componentCategory  : Association to ComponentCategories not null;
  sapModule           : Association to SAPModules;
  responsibilityLevel: Association to ResponsibilityLevels not null;
}

annotate UserOnboardingDeveloperResponsibilities with @assert.unique.onboardingDeveloperScope: [ onboardingRequest, componentCategory, sapModule ];

entity UserOnboardingDeliveries : cuid, managed {
  onboardingRequest : Association to UserOnboardingRequests not null;
  recipientEmail    : String(255) not null;
  templateKey       : String(80) not null;
  status            : Association to NotificationDeliveryStatuses not null;
  attemptCount      : Integer default 0 not null;
  nextAttemptAt     : Timestamp;
  lastAttemptAt     : Timestamp;
  sentAt            : Timestamp;
  lastErrorCode     : String(80);
  lastErrorSummary  : String(500);
  providerMessageId : String(255);
  lockedUntil       : Timestamp;
  lockToken         : String(64);
}

annotate UserOnboardingDeliveries with @assert.unique.onboardingRequestDelivery: [ onboardingRequest ];

entity UserAccessOperations : cuid, managed {
  onboardingRequest : Association to UserOnboardingRequests not null;
  operationType     : String(30) not null;
  state             : String(30) not null;
  requestedBy       : Association to Users not null;
  idempotencyKey    : String(64) not null;
  expectedVersion   : Integer not null;
  desiredRole       : Association to UserRoles not null;
  desiredUserAdmin  : Boolean default false not null;
  correlationId     : UUID not null;
  attemptCount      : Integer default 0 not null;
  nextAttemptAt     : Timestamp;
  leasedAt          : Timestamp;
  leaseExpiresAt    : Timestamp;
  leaseTokenHash    : String(64);
  completedAt       : Timestamp;
  safeResultCode    : String(80);
  safeResultSummary : String(500);
  providerCorrelationHash : String(64);
}

annotate UserAccessOperations with @assert.unique.provisioningIdempotencyKey: [ idempotencyKey ];

entity UserIdentityAuditEvents : cuid, managed {
  operation          : Association to UserAccessOperations;
  onboardingRequest : Association to UserOnboardingRequests;
  actor              : Association to Users;
  targetUser         : Association to Users;
  action             : String(40) not null;
  result             : String(40) not null;
  fromState          : String(40);
  toState            : String(40);
  correlationId      : UUID not null;
  beforeIdentityHash : String(64);
  afterIdentityHash  : String(64);
  detailsSummary     : String(500);
}

annotate UserIdentityAuditEvents with @assert.unique.identityAuditCorrelationAction: [ correlationId, action ];

entity UserNotificationInboxEntries : cuid, managed {
  // Personal inbox index: source records remain authoritative; this row owns only recipient/read state.
  recipient        : Association to Users not null;
  bugNotification  : Association to Notifications;
  accessAuditEvent : Association to UserIdentityAuditEvents;
  occurredAt       : Timestamp not null;
  readAt           : Timestamp;
}

annotate UserNotificationInboxEntries with @assert.unique.inboxBugSource: [ bugNotification ];
annotate UserNotificationInboxEntries with @assert.unique.inboxAccessSource: [ accessAuditEvent ];

entity UserAccessNotificationDeliveries : cuid, managed {
  // Outbox riêng cho access-change; source audit event là business idempotency key.
  sourceAuditEvent    : Association to UserIdentityAuditEvents not null;
  targetUser          : Association to Users not null;
  recipientEmail      : String(255) not null;
  eventType           : String(40) not null;
  templateKey         : String(80) not null;
  subject             : String(255) not null;
  textBody            : LargeString not null;
  htmlBody            : LargeString not null;
  status              : Association to NotificationDeliveryStatuses not null;
  attemptCount        : Integer default 0 not null;
  nextAttemptAt       : Timestamp;
  lastAttemptAt       : Timestamp;
  sentAt              : Timestamp;
  lastErrorCode       : String(80);
  lastErrorSummary    : String(500);
  providerMessageId   : String(255);
  lockedUntil         : Timestamp;
  lockToken           : String(64);
}

annotate UserAccessNotificationDeliveries with @assert.unique.accessAuditDelivery: [ sourceAuditEvent ];

entity NotificationDigestDeliveries : cuid, managed {
  // One stored digest snapshot per recipient/business date/type; the shared worker owns delivery attempts.
  recipient         : Association to Users not null;
  businessDate      : Date not null;
  digestType        : String(30) not null;
  windowStart       : Timestamp not null;
  windowEnd         : Timestamp not null;
  snapshotAt        : Timestamp not null;
  itemCount         : Integer not null;
  subject           : String(255) not null;
  textBody          : LargeString not null;
  htmlBody          : LargeString not null;
  status            : Association to NotificationDeliveryStatuses not null;
  attemptCount      : Integer default 0 not null;
  nextAttemptAt     : Timestamp;
  lastAttemptAt     : Timestamp;
  sentAt            : Timestamp;
  lastErrorCode     : String(80);
  lastErrorSummary  : String(500);
  providerMessageId : String(255);
  lockedUntil       : Timestamp;
  lockToken         : String(64);
}

annotate NotificationDigestDeliveries
  with @assert.unique.digestRecipientDateType: [ recipient, businessDate, digestType ];

entity DuplicateLinks : cuid, managed {
  // Liên kết duplicate chỉ được tạo khi user xác nhận; kết quả AI Similar Bugs tự nó không insert entity này.
  sourceBug    : Association to Bugs not null;
  targetBug    : Association to Bugs not null;
  relationType : Association to DuplicateRelationTypes not null;
}

entity AiSuggestions : cuid, managed {
  // Audit suggestion review-only: lưu metadata/payload đã sanitize, không thay thế field nghiệp vụ trên Bugs.
  bug               : Association to Bugs not null;
  featureType       : Association to AiSuggestionFeatureTypes not null;
  requestedBy       : Association to Users not null;
  providerAlias     : String(80);
  modelAlias        : String(80);
  operationStatus   : String(40);
  latencyMs         : Integer;
  confidence        : Decimal(5,4);
  suggestionPayload : LargeString not null;
  summary           : String(500);
  reviewState       : Association to AiSuggestionReviewStates not null;
  reviewedBy        : Association to Users;
  reviewedAt        : Timestamp;
  expiresAt         : Timestamp;
  correlationId     : String(80);
}
