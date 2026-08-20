'use strict';

const assert = require('node:assert/strict');
const { inspectSchema } = require('../btp/inspect-user-admin-schema');

(async () => {
  const queries = [];
  const db = {
    async run (sql) {
      queries.push(sql);
      if (/IDTS_CAP_USERS/.test(sql)) return [{ ROWCOUNT: 14, ORIGINNULLS: 14, ISSUERNULLS: 14, SUBJECTNULLS: 14, HASHNULLS: 14 }];
      return [{ ROWCOUNT: 0 }];
    }
  };
  const result = await inspectSchema(db);
  assert.deepEqual(result, {
    users: { rowCount: 14, externalIdentityNullRows: 14 },
    userAccessOperations: 0,
    userIdentityAuditEvents: 0,
    userOnboardingDeliveries: 0,
    userOnboardingRequests: 0,
    userOnboardingStatuses: 0
  });
  assert.equal(queries.length, 6);
  assert.equal(queries.some((sql) => /INSERT|UPDATE|DELETE|DROP|ALTER|CREATE/i.test(sql)), false);
  console.log('User Administration schema inspector: PASS');
})().catch((error) => {
  console.error(`User Administration schema inspector: FAIL (${error.message})`);
  process.exitCode = 1;
});
