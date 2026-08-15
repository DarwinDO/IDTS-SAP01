'use strict';

const assert = require('node:assert/strict');

const { buildSimulationArgs, SCHEMA_FILES } = require('../btp/ua-hdi-simulate-command');

const args = buildSimulationArgs();

assert.equal(SCHEMA_FILES.length, 13);
assert.equal(args.filter((value) => value === '--exit').length, 1);
assert.equal(args.filter((value) => value === '--simulate-make').length, 1);
assert.equal(args.filter((value) => value === '--no-auto-undeploy').length, 1);
assert.equal(args.filter((value) => value === '--no-trace-vcap-services').length, 1);
assert.equal(args.filter((value) => value === '--treat-warnings-as-errors').length, 1);
assert.equal(args.filter((value) => value === '--treat-deployer-warnings-as-errors').length, 1);
assert.equal(args.some((value) => value.startsWith('try_fast_table_migration=')), false);

for (const option of ['--working-set', '--include-filter', '--deploy']) {
  const start = args.indexOf(option);
  assert.notEqual(start, -1, `${option} is required`);
  assert.deepEqual(args.slice(start + 1, start + 1 + SCHEMA_FILES.length), SCHEMA_FILES);
}

assert.equal(args.includes('--undeploy'), false);
assert.equal(args.some((value) => /\.csv$/i.test(value)), false);
assert.equal(args.some((value) => /\.hdbtabledata$/i.test(value)), false);

console.log('UA HDI simulation command contract: PASS');
