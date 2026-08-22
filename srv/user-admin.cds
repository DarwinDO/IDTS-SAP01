using idts.cap as db from '../db/schema';

service UserAdministrationService @(requires: 'authenticated-user') {
  type BootstrapPmNormalizationResult {
    status        : String(20);
    correlationId : UUID;
  }

  type DeveloperResponsibilityInput {
    componentCategoryID      : UUID;
    sapModuleID              : UUID;
    responsibilityLevelCode  : String(40);
  }

  type DeveloperProfileInput {
    availabilityStatusCode : String(40);
    workloadLimit          : Integer;
    responsibilities      : array of DeveloperResponsibilityInput;
  }

  type DeveloperResponsibilityResult {
    ID                       : UUID;
    componentCategoryID      : UUID;
    sapModuleID              : UUID;
    responsibilityLevelCode  : String(40);
    active                   : Boolean;
  }

  type DeveloperProfileResult {
    userID                    : UUID;
    developerProfileID        : UUID;
    availabilityStatusCode    : String(40);
    workloadLimit             : Integer;
    administrationVersion     : Integer;
    ready                     : Boolean;
    activeResponsibilityCount : Integer;
    openBugImpactCount        : Integer;
    responsibilities          : array of DeveloperResponsibilityResult;
  }

  type ActiveUserSummary {
    userID                   : UUID;
    displayName              : String(120);
    email                    : String(255);
    businessRole             : String(40);
    userAdminCapability      : Boolean;
    accessState              : String(20);
    identityLinked           : Boolean;
    linkEligible             : Boolean;
    developerReady           : Boolean;
    activeResponsibilityCount: Integer;
    pendingOperationType     : String(30);
    pendingOperationState    : String(30);
    lastSafeResultCode       : String(80);
    lastReconciledAt         : Timestamp;
  }

  type ActiveUserDetails {
    userID                        : UUID;
    displayName                   : String(120);
    email                         : String(255);
    businessRole                  : String(40);
    userAdminCapability           : Boolean;
    accessState                   : String(20);
    identityLinked                : Boolean;
    linkEligible                  : Boolean;
    developerReady                : Boolean;
    activeResponsibilityCount     : Integer;
    pendingOperationType          : String(30);
    pendingOperationState         : String(30);
    lastSafeResultCode            : String(80);
    lastReconciledAt              : Timestamp;
    requestCount                 : Integer;
    auditEventCount              : Integer;
    developerProfileID           : UUID;
    developerAvailabilityStatus  : String(40);
    developerWorkloadLimit       : Integer;
    developerOpenBugImpactCount  : Integer;
  }

  type OnboardingResult {
    ID                 : UUID;
    targetEmail        : String(255);
    requestedRole      : String(40);
    userAdminRequested : Boolean;
    status             : String(40);
    expiresAt          : Timestamp;
    verifiedAt         : Timestamp;
    provisionedAt      : Timestamp;
    revokedAt          : Timestamp;
    provisioningVersion: Integer;
    correlationId      : UUID;
  }

  type OnboardingRequestSummary {
    ID                    : UUID;
    targetEmailNormalized : String(255);
    requestedRole_code    : String(40);
    userAdminRequested    : Boolean;
    status_code           : String(40);
    expiresAt             : Timestamp;
    verifiedAt            : Timestamp;
    provisionedAt         : Timestamp;
    revokedAt             : Timestamp;
    provisioningVersion   : Integer;
    activeUser_ID          : UUID;
    latestOperation_ID     : UUID;
    latestOperationAttemptCount : Integer;
    lastErrorCode         : String(80);
    lastErrorSummary      : String(500);
    cancelEligible        : Boolean;
  }

  action requestOnboarding(
    email              : String(255),
    requestedRole      : String(40),
    userAdminRequested : Boolean,
    developerProfile   : DeveloperProfileInput
  ) returns OnboardingResult;

  action requestExistingUserIdentityLink(
    userID : UUID,
    email  : String(255)
  ) returns OnboardingResult;

  action cancelExistingUserIdentityLink(
    requestID      : UUID,
    expectedVersion: Integer
  ) returns OnboardingResult;

  @requires: 'PM'
  action normalizeCurrentBootstrapPm() returns BootstrapPmNormalizationResult;

  action verifySapIdentity(token : String(2048)) returns OnboardingResult;

  action searchOnboarding(query : String(255)) returns many OnboardingRequestSummary;

  action searchActiveUsers(query : String(255), includeNonActive : Boolean, skip : Integer, top : Integer) returns many ActiveUserSummary;

  action readActiveUserDetails(userID : UUID) returns ActiveUserDetails;

  action approveProvisioning(
    requestID       : UUID,
    expectedVersion: Integer
  ) returns OnboardingResult;

  action requestRoleChange(
    userID              : UUID,
    requestedRole       : String(40),
    userAdminRequested  : Boolean,
    developerProfile    : DeveloperProfileInput,
    reason              : String(500),
    expectedVersion     : Integer
  ) returns OnboardingResult;

  action requestRevoke(
    userID          : UUID,
    reason          : String(500),
    expectedVersion : Integer
  ) returns OnboardingResult;

  action requestSuspend(
    userID          : UUID,
    reason          : String(500),
    expectedVersion : Integer
  ) returns OnboardingResult;

  action requestReactivate(
    userID          : UUID,
    reason          : String(500),
    expectedVersion : Integer
  ) returns OnboardingResult;

  action retryAccessOperation(
    operationID    : UUID,
    expectedVersion: Integer
  ) returns OnboardingResult;

  action readDeveloperProfile(userID : UUID) returns DeveloperProfileResult;

  action updateDeveloperProfile(
    userID          : UUID,
    desiredProfile  : DeveloperProfileInput,
    reason          : String(500),
    expectedVersion : Integer
  ) returns DeveloperProfileResult;

  action reconcileAccessOperation(
    operationID    : UUID,
    expectedVersion: Integer
  ) returns OnboardingResult;

  @readonly
  entity OnboardingRequests as projection on db.UserOnboardingRequests {
    ID,
    createdAt,
    modifiedAt,
    targetEmailNormalized,
    requestedRole,
    userAdminRequested,
    status,
    requestedBy,
    expiresAt,
    verifiedAt,
    provisionedAt,
    revokedAt,
    provisioningVersion,
    activeUser,
    latestOperation,
    correlationId,
    lastErrorCode,
    lastErrorSummary
  };

  @readonly entity AvailabilityStatuses as projection on db.AvailabilityStatuses;
  @readonly entity ResponsibilityLevels as projection on db.ResponsibilityLevels;
  @readonly entity SAPModules as projection on db.SAPModules;
  @readonly entity ApplicationComponents as projection on db.ApplicationComponents;
  @readonly entity DefectCategories as projection on db.DefectCategories;
  @readonly entity ComponentCategories as projection on db.ComponentCategories {
    ID,
    component,
    defectCategory,
    active
  };
}
