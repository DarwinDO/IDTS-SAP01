'use strict'

const assert = require('node:assert/strict')
const { buildSimulationArgs, resolveDeployer, SCHEMA_FILES } = require('../btp/ua-developer-hdi-simulate-command')

const args = buildSimulationArgs()

assert.equal(SCHEMA_FILES.length, 9)
assert.deepEqual(SCHEMA_FILES, [
  'src/gen/idts.cap.DeveloperProfiles.hdbtable',
  'src/gen/idts.cap.UserOnboardingDeveloperResponsibilities.hdbtable',
  'src/gen/idts.cap.UserOnboardingDeveloperResponsibilities.onboardingDeveloperScope.hdbindex',
  'src/gen/idts.cap.UserOnboardingRequests.hdbtable',
  'src/gen/BugService.DeveloperProfiles.hdbview',
  'src/gen/UserAdministrationService.AvailabilityStatuses.hdbview',
  'src/gen/UserAdministrationService.ComponentCategories.hdbview',
  'src/gen/UserAdministrationService.ResponsibilityLevels.hdbview',
  'src/gen/UserAdministrationService.SAPModules.hdbview'
])
for (const flag of ['--exit', '--simulate-make', '--treat-warnings-as-errors', '--treat-deployer-warnings-as-errors', '--no-auto-undeploy', '--no-trace-vcap-services']) {
  assert.equal(args.filter(value => value === flag).length, 1, `${flag} must occur exactly once`)
}
for (const option of ['--working-set', '--include-filter', '--deploy']) {
  const start = args.indexOf(option)
  assert.notEqual(start, -1)
  assert.deepEqual(args.slice(start + 1, start + 1 + SCHEMA_FILES.length), SCHEMA_FILES)
}
assert.equal(args.includes('--undeploy'), false)
assert.equal(args.some(value => /\.csv$|\.hdbtabledata$/i.test(value)), false)
assert.match(resolveDeployer().replaceAll('\\', '/'), /@sap\/hdi-deploy\/deploy\.js$/)

console.log('UA Developer HDI simulation command contract: PASS')
