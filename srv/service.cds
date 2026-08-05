// Đây là hợp đồng OData công khai của BugService. CDS nói client được đọc/gọi gì;
// `srv/service.js` gắn behavior, còn Fiori annotations/manifest gọi đúng entity/action được khai báo tại đây.
using idts.cap as db from '../db/schema';

service BugService @(requires: 'authenticated-user') {
  // Các type sau là response tạm của action AI review-only, không phải table được persist.
  type SimilarBugCandidate {
    suggestionID     : UUID;
    rank             : Integer;
    bugID            : UUID;
    bugNumber        : String(30);
    title            : String(255);
    statusCode       : String(40);
    statusName       : String(120);
    score            : Decimal(5,4);
    suggestedRelationTypeCode : String(40);
    reason           : String(500);
    providerStatus   : String(40);
    embeddingUsed    : Boolean;
  };

  type ClassificationSuggestionCandidate {
    suggestionID     : UUID;
    field            : String(40);
    fieldLabel       : String(120);
    valueID          : UUID;
    valueCode        : String(40);
    valueName        : String(120);
    confidence       : Decimal(5,4);
    reason           : String(500);
    status           : String(40);
    suggestionSource : String(20);
    providerStatus   : String(40);
    requiresReview   : Boolean;
  };

  type BugHandoffSummaryResult {
    suggestionID          : UUID;
    bugID                 : UUID;
    bugNumber             : String(30);
    generatedAt           : Timestamp;
    label                 : String(120);
    summary               : LargeString;
    currentStatus         : String(120);
    currentActionOwner    : String(120);
    missingInformation    : LargeString;
    commentSummary        : LargeString;
    verifiedComments      : LargeString;
    latestImportantEvents : LargeString;
    nextExpectedAction    : LargeString;
    groundingStatus       : String(40);
    providerStatus        : String(40);
    confidence            : Decimal(5,4);
    requiresReview        : Boolean;
  };

  type SmartAssignmentExplanationCandidate {
    suggestionID       : UUID;
    developerProfileID : UUID;
    developerName      : String(120);
    explanation        : String(700);
    warnings           : String(500);
    confidence         : Decimal(5,4);
    status             : String(40);
    explanationSource  : String(20);
    providerStatus     : String(40);
    groundingStatus    : String(40);
    workloadOpenCount  : Integer;
    workloadLimit      : Integer;
    isOverloaded       : Boolean;
    requiresReview     : Boolean;
  };

  type AiSuggestionReviewResult {
    suggestionID            : UUID;
    bugID                   : UUID;
    featureTypeCode         : String(40);
    reviewStateCode         : String(40);
    reviewStateName         : String(120);
    reviewedByID            : UUID;
    reviewedByDisplayName   : String(120);
    reviewedAt              : Timestamp;
  };

  type AiOperationalMetric {
    windowStart        : Timestamp;
    windowEnd          : Timestamp;
    featureTypeCode    : String(40);
    providerAlias      : String(80);
    modelAlias         : String(80);
    requestCount       : Integer;
    successCount       : Integer;
    failureCount       : Integer;
    badRequestCount    : Integer;
    rateLimitedCount   : Integer;
    provider5xxCount   : Integer;
    timeoutCount       : Integer;
    unavailableCount   : Integer;
    otherFailureCount  : Integer;
    acceptedCount      : Integer;
    rejectedCount      : Integer;
    ignoredCount       : Integer;
    pendingCount       : Integer;
    latencySampleCount : Integer;
    averageLatencyMs   : Integer;
    maxLatencyMs       : Integer;
  };

  type BugStatusMetric {
    statusCode        : String(40);
    statusName        : String(120);
    statusCriticality : Integer;
    sortOrder         : Integer;
    bugCount          : Integer;
  };

  type EmailOutboxRunResult {
    sent    : Integer;
    failed  : Integer;
    skipped : Integer;
  };

  // Unbound AI actions nhận context tối thiểu và trả suggestion; handler phải ground/audit nhưng không tự sửa Bug.
  action suggestSimilarBugs(
    sourceBugID            : UUID,
    title                  : String(255),
    description            : LargeString,
    statusCode             : String(40),
    sapModuleID            : UUID,
    applicationComponentID : UUID,
    defectCategoryID       : UUID,
    componentCategoryID    : UUID,
    limit                  : Integer,
    minScore               : Decimal(5,4)
  ) returns array of SimilarBugCandidate;

  action suggestClassification(
    sourceBugID            : UUID,
    title                  : String(255),
    description            : LargeString,
    stepsToReproduce       : LargeString,
    actualResult           : LargeString,
    expectedResult         : LargeString,
    sapModuleID            : UUID,
    applicationComponentID : UUID,
    defectCategoryID       : UUID,
    priorityCode           : String(40),
    severityCode           : String(40)
  ) returns array of ClassificationSuggestionCandidate;

  action summarizeBugHandoff(
    sourceBugID            : UUID
  ) returns BugHandoffSummaryResult;

  action explainSmartAssignment(
    sourceBugID          : UUID,
    componentCategoryID  : UUID,
    sapModuleID          : UUID,
    limit                : Integer
  ) returns array of SmartAssignmentExplanationCandidate;

  // Human review actions chỉ đổi audit row đang PENDING; hai action phía sau mới được apply dữ liệu đã Accept.
  action acceptAiSuggestion(suggestionID : UUID) returns AiSuggestionReviewResult;
  action rejectAiSuggestion(suggestionID : UUID) returns AiSuggestionReviewResult;
  action ignoreAiSuggestion(suggestionID : UUID) returns AiSuggestionReviewResult;
  action applyClassificationSuggestion(suggestionID : UUID) returns Bugs;
  // Chỉ nhận hai UUID; relation type và candidate membership luôn lấy từ suggestion payload đã persist.
  action confirmDuplicateSuggestion(
    suggestionID  : UUID,
    candidateBugID : UUID
  ) returns DuplicateLinks;

  // PM-only operational aggregate; reads allowlisted audit metadata and never exposes prompt/response/error detail.
  @(requires: 'PM')
  function readAiOperationalMetrics(windowDays : Integer) returns array of AiOperationalMetric;

  // PM-only lifecycle counts; the handler returns all ten current statuses, including zero-count rows.
  @(requires: 'PM')
  function readBugStatusMetrics() returns array of BugStatusMetric;

  @(requires: 'OutboxProcessor')
  action processEmailOutbox() returns EmailOutboxRunResult;

  // Projection Bugs expose aggregate chính, thêm field tính/virtual cho UX; dữ liệu gốc vẫn ở db.Bugs.
  entity Bugs as projection on db.Bugs {
    *,
    (dueDate != null and dueDate < date($now) and status.code != 'CLOSED' ? true : false) as isOverdue : Boolean,
    (status.code == 'PENDING_ASSIGNMENT' ? true : false) as isPendingAssignment : Boolean,
    (status.code == 'REJECTED' ? true : false) as isRejectedFollowUp : Boolean,
    (status.code == 'RETEST_REQUIRED' ? true : false) as isRetestRequired : Boolean,
    virtual reporterDisplayName : String(120),
    componentCategory : redirected to ComponentCategories,
    virtual assigneeDisplayName : String(120),
    virtual nextProcessorUserDisplayName : String(120),
    virtual nextProcessorRoleName : String(120),
    virtual currentActionOwnerDisplayName : String(120),
    virtual canMarkInReview       : Boolean,
    virtual canStartProgress      : Boolean,
    virtual canResolve            : Boolean,
    virtual canRequestMoreInfo    : Boolean,
    virtual canReject             : Boolean,
    virtual canSendToRetest       : Boolean,
    virtual canClose              : Boolean,
    virtual canReopen             : Boolean,
    virtual canAssign             : Boolean,
    virtual canMoveToPending      : Boolean,
    virtual canResubmit           : Boolean,
    virtual canAddComment         : Boolean,
    virtual canEdit               : Boolean,
    virtual canReassignRetestOwner: Boolean,
    virtual assigneeFieldControl  : Integer
  } actions {
    // Bound actions chạy trên một Bug cụ thể. Tên/signature phải khớp `srv/service.js` và Fiori action annotation.
    action addComment(content: LargeString) returns Bugs;
    action assignToDeveloper(
      @Common.ValueList : {
        Label : 'Assignable Developer',
        CollectionPath : 'AssignableDevelopers',
        SearchSupported : true,
        Parameters : [
          {
            $Type : 'Common.ValueListParameterInOut',
            LocalDataProperty : assigneeID,
            ValueListProperty : 'developerProfileID'
          },
          {
            $Type : 'Common.ValueListParameterDisplayOnly',
            ValueListProperty : 'developerName'
          },
          {
            $Type : 'Common.ValueListParameterDisplayOnly',
            ValueListProperty : 'developerEmail'
          },
          {
            $Type : 'Common.ValueListParameterDisplayOnly',
            ValueListProperty : 'availabilityStatusName'
          },
          {
            $Type : 'Common.ValueListParameterDisplayOnly',
            ValueListProperty : 'applicationComponentName'
          },
          {
            $Type : 'Common.ValueListParameterDisplayOnly',
            ValueListProperty : 'defectCategoryName'
          }
        ]
      }
      @Common.Label : 'Assignee'
      assigneeID: UUID,
      note: String
    ) returns Bugs;
    action moveToPendingAssignment(reason: String) returns Bugs;
    action markInReview(note: String) returns Bugs;
    action requestMoreInformation(reason: String) returns Bugs;
    action resubmitToDeveloper(note: String) returns Bugs;
    action rejectBug(reason: String) returns Bugs;
    action startProgress(note: String) returns Bugs;
    action resolveBug(note: String) returns Bugs;
    action sendToRetest(note: String) returns Bugs;
    action closeBug(note: String) returns Bugs;
    action reopenBug(reason: String) returns Bugs;
    @(requires: 'PM')
    action reassignRetestOwner(
      @Common.ValueList : {
        Label : 'Active Tester',
        CollectionPath : 'ActiveTesters',
        SearchSupported : true,
        Parameters : [
          {
            $Type : 'Common.ValueListParameterInOut',
            LocalDataProperty : retestOwnerID,
            ValueListProperty : 'ID'
          },
          {
            $Type : 'Common.ValueListParameterDisplayOnly',
            ValueListProperty : 'displayName'
          },
          {
            $Type : 'Common.ValueListParameterDisplayOnly',
            ValueListProperty : 'email'
          }
        ]
      }
      @Common.Label : 'Retest Owner'
      retestOwnerID: UUID,
      @UI.MultiLineText @Common.Label : 'Reason'
      reason: String
    ) returns Bugs;
  };
  // Projection collaboration/audit bổ sung display fields nhưng không đổi schema gốc.
  entity Comments as projection on db.Comments {
    *,
    author.displayName as authorDisplayName,
    authorRole.name as authorRoleName
  };
  entity HistoryEvents as projection on db.HistoryEvents {
    *,
    actor.displayName as actorDisplayName,
    actorRole.name as actorRoleName,
    actionType.name as actionTypeName,
    virtual changeCount : Integer,
    virtual groupedChangeContext : String(1000)
  };
  entity HistoryLogs as projection on db.HistoryLogs {
    *,
    actor.displayName as actorDisplayName,
    actorRole.name as actorRoleName,
    actionType.name as actionTypeName,
    event.summary as historyEventSummary
  };
  entity Notifications as projection on db.Notifications {
    *,
    recipient.displayName as recipientDisplayName,
    eventType.name as eventTypeName,
    channel.name as channelName,
    deliveryStatus.name as deliveryStatusName,
    deliveryStatus.criticality as deliveryStatusCriticality
  };
  // Delivery read-only chỉ expose trạng thái an toàn cho UI; body HTML/config/credential không được công khai.
  @readonly
  entity NotificationDeliveries as projection on db.NotificationDeliveries {
    ID,
    createdAt,
    modifiedAt,
    notification,
    channel,
    recipientEmail,
    templateKey,
    subject,
    status,
    attemptCount,
    nextAttemptAt,
    lastAttemptAt,
    sentAt,
    lastErrorCode,
    lastErrorSummary,
    providerMessageId
  };
  entity DuplicateLinks as projection on db.DuplicateLinks;
  // AI audit read-only: client review được suggestion nhưng không được tự POST/PATCH audit row.
  @readonly
  entity AiSuggestions as projection on db.AiSuggestions {
    ID,
    createdAt,
    modifiedAt,
    bug,
    featureType,
    featureType.name as featureTypeName,
    requestedBy,
    requestedBy.displayName as requestedByDisplayName,
    providerAlias,
    modelAlias,
    operationStatus,
    latencyMs,
    confidence,
    suggestionPayload,
    summary,
    reviewState,
    reviewState.name as reviewStateName,
    reviewedBy,
    reviewedBy.displayName as reviewedByDisplayName,
    reviewedAt,
    expiresAt,
    correlationId
  };

  // Public Users projection cố ý bỏ passwordHash và session fields.
  entity Users as projection on db.Users {
    ID,
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    displayName,
    email,
    role,
    active
  };
  @readonly
  @cds.redirection.target: false
  entity ActiveTesters as projection on db.Users {
    key ID,
    displayName,
    email
  } where active = true and role.code = 'TESTER';
  entity DeveloperProfiles as projection on db.DeveloperProfiles;
  entity SAPModules as projection on db.SAPModules;
  entity ApplicationComponents as projection on db.ApplicationComponents;
  entity SAPModuleComponents as projection on db.SAPModuleComponents;
  entity DefectCategories as projection on db.DefectCategories;
  entity ComponentCategories as projection on db.ComponentCategories;
  entity DeveloperResponsibilities as projection on db.DeveloperResponsibilities {
    *,
    componentCategory : redirected to ComponentCategories
  };
  // Hai entity không persist dưới đây do JS custom READ tính: value help assignment và dashboard workload.
  entity AssignableDevelopers {
    key ID                    : UUID;
    developerProfileID        : UUID;
    componentCategoryID       : UUID;
    sapModuleID               : UUID;
    developerName             : String(120);
    developerEmail            : String(255);
    availabilityStatusName    : String(120);
    availabilityCriticality   : Integer;
    applicationComponentName  : String(120);
    defectCategoryName        : String(120);
    sapModuleName             : String(120);
    responsibilityLevelName   : String(120);
    active                    : Boolean;
  };
  @readonly
  entity DeveloperWorkloads {
    key developerProfileID      : UUID;
    developerUserID             : UUID;
    developerName               : String(120);
    developerEmail              : String(255);
    availabilityStatusCode      : String(40);
    availabilityStatusName      : String(120);
    availabilityCriticality     : Integer;
    workloadLimit               : Integer;
    openOwnedBugCount           : Integer;
    overdueOwnedBugCount        : Integer;
    currentActionItemCount      : Integer;
    assignedCount               : Integer;
    inReviewCount               : Integer;
    inProgressCount             : Integer;
    reopenedCount               : Integer;
    needMoreInformationCount    : Integer;
    resolvedCount               : Integer;
    retestRequiredCount         : Integer;
    rejectedCount               : Integer;
    estimatedEffortHoursTotal   : Decimal(9,2);
    isOverloaded                : Boolean;
    active                      : Boolean;
  };
  // Value-help view chỉ trả cặp component/category đang active ở cả ba row liên quan.
  entity ValidDefectCategories as select from db.ComponentCategories {
    key ID as componentCategoryID,
    component.ID as applicationComponentID,
    component.code as applicationComponentCode,
    component.name as applicationComponentName,
    defectCategory.ID as defectCategoryID,
    defectCategory.code as defectCategoryCode,
    defectCategory.name as defectCategoryName,
    defectCategory.categoryType as defectCategoryType,
    active
  } where active = true and component.active = true and defectCategory.active = true;

  entity UserRoles as projection on db.UserRoles;
  entity StatusValues as projection on db.StatusValues;
  entity PriorityValues as projection on db.PriorityValues;
  entity SeverityValues as projection on db.SeverityValues;
  entity EnvironmentValues as projection on db.EnvironmentValues;
  entity ProcessorRoleValues as projection on db.ProcessorRoleValues;
  entity AvailabilityStatuses as projection on db.AvailabilityStatuses;
  entity ResponsibilityLevels as projection on db.ResponsibilityLevels;
  entity ActionTypes as projection on db.ActionTypes;
  entity NotificationEventTypes as projection on db.NotificationEventTypes;
  entity NotificationChannels as projection on db.NotificationChannels;
  entity NotificationDeliveryStatuses as projection on db.NotificationDeliveryStatuses;
  entity DuplicateRelationTypes as projection on db.DuplicateRelationTypes;
  entity AiSuggestionFeatureTypes as projection on db.AiSuggestionFeatureTypes;
  entity AiSuggestionReviewStates as projection on db.AiSuggestionReviewStates;
}

annotate BugService.Bugs with @odata.draft.enabled;
// Bật draft protocol để Fiori dùng NEW → PATCH → SAVE thay vì ghi thẳng Bug active trong form edit/create.
