'use strict';

const assert = require('node:assert/strict');
const {
  SCHEMA_FILES,
  buildSchemaMakeArgs
} = require('../btp/ua-hdi-schema-make-command');

const args = buildSchemaMakeArgs();
assert.equal(SCHEMA_FILES.length, 13);
assert.equal(args.filter((value) => value === '--exit').length, 1);
assert.equal(args.includes('--simulate-make'), false);
assert.equal(args.includes('--no-auto-undeploy'), true);
assert.equal(args.includes('--treat-warnings-as-errors'), true);
assert.equal(args.includes('--treat-deployer-warnings-as-errors'), true);
assert.equal(args.includes('--no-trace-vcap-services'), true);
assert.equal(args.some((value) => /\.csv$|\.hdbtabledata$/i.test(value)), false);
assert.equal(args.some((value) => /undeploy/i.test(value) && value !== '--no-auto-undeploy'), false);
for (const file of SCHEMA_FILES) {
  assert.equal(args.filter((value) => value === file).length, 3);
}

console.log('User Administration schema-only HDI make command: PASS');
