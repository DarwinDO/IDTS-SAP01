'use strict';

const { spawnSync } = require('node:child_process');

const SCHEMA_FILES = Object.freeze([
  'src/gen/idts.cap.UserAccessOperations.hdbtable',
  'src/gen/idts.cap.UserAccessOperations.provisioningIdempotencyKey.hdbindex',
  'src/gen/idts.cap.UserIdentityAuditEvents.hdbtable',
  'src/gen/idts.cap.UserOnboardingDeliveries.hdbtable',
  'src/gen/idts.cap.UserOnboardingDeliveries.onboardingRequestDelivery.hdbindex',
  'src/gen/idts.cap.UserOnboardingRequests.externalIdentity.hdbindex',
  'src/gen/idts.cap.UserOnboardingRequests.hdbtable',
  'src/gen/idts.cap.UserOnboardingRequests.onboardingTokenHash.hdbindex',
  'src/gen/idts.cap.UserOnboardingRequests.openOnboardingRequest.hdbindex',
  'src/gen/idts.cap.UserOnboardingStatuses.hdbtable',
  'src/gen/idts.cap.Users.hdbtable',
  'src/gen/idts.cap.Users.userExternalIdentity.hdbindex',
  'src/gen/UserAdministrationService.OnboardingRequests.hdbview'
]);

function buildSimulationArgs () {
  return [
    '--exit',
    '--simulate-make',
    '--treat-warnings-as-errors',
    '--treat-deployer-warnings-as-errors',
    '--no-auto-undeploy',
    '--no-trace-vcap-services',
    '--working-set', ...SCHEMA_FILES,
    '--include-filter', ...SCHEMA_FILES,
    '--deploy', ...SCHEMA_FILES
  ];
}

function resolveDeployer () {
  return require.resolve('@sap/hdi-deploy/deploy.js', { paths: [process.cwd(), __dirname] });
}

function run () {
  const result = spawnSync(process.execPath, [resolveDeployer(), ...buildSimulationArgs()], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    windowsHide: true
  });

  if (result.error) {
    process.exitCode = 1;
    return;
  }

  process.exitCode = Number.isInteger(result.status) ? result.status : 1;
}

if (require.main === module) run();

module.exports = { buildSimulationArgs, SCHEMA_FILES };
