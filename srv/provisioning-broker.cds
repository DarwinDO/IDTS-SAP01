using idts.cap as db from '../db/schema';

@path: '/internal/user-access-provisioning'
service ProvisioningBrokerService @(requires: 'ProvisioningBroker') {
  type ClaimedAccessOperation {
    operationID        : UUID;
    operationType      : String(30);
    targetEmail        : String(255);
    identityOrigin     : String(120);
    identityIssuer     : String(500);
    identitySubject    : String(255);
    identityPlatformUserId : String(255);
    desiredBusinessRole: String(40);
    desiredUserAdmin   : Boolean;
    idempotencyKey     : String(64);
    expectedVersion    : Integer;
    leaseToken         : String(64);
  }

  type AccessCompletionResult {
    operationID : UUID;
    status      : String(40);
  }

  action claimNextAccessOperation() returns ClaimedAccessOperation;

  action completeAccessOperation(
    operationID            : UUID,
    leaseToken             : String(64),
    resultCode             : String(40),
    safeCode               : String(80),
    providerCorrelationHash: String(64)
  ) returns AccessCompletionResult;
}
