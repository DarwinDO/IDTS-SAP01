using idts.cap as db from '../db/schema';

service UserAdministrationService @(requires: 'authenticated-user') {
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
  }

  action requestOnboarding(
    email              : String(255),
    requestedRole      : String(40),
    userAdminRequested : Boolean,
    developerProfile   : DeveloperProfileInput
  ) returns OnboardingResult;

  action verifySapIdentity(token : String(2048)) returns OnboardingResult;

  action searchOnboarding(query : String(255)) returns many OnboardingRequestSummary;

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
