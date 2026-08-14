using idts.cap as db from '../db/schema';

service UserAdministrationService @(requires: 'authenticated-user') {
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
    lastErrorCode         : String(80);
    lastErrorSummary      : String(500);
  }

  action requestOnboarding(
    email              : String(255),
    requestedRole      : String(40),
    userAdminRequested : Boolean
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
}
