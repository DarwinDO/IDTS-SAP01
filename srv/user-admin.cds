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
    correlationId      : UUID;
  }

  type OnboardingRequestSummary {
    ID                    : UUID;
    targetEmailNormalized : String(255);
    requestedRole_code    : String(40);
    userAdminRequested    : Boolean;
    status_code           : String(40);
    expiresAt             : Timestamp;
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
    identityOrigin,
    identitySubject,
    correlationId,
    lastErrorCode,
    lastErrorSummary
  };
}
