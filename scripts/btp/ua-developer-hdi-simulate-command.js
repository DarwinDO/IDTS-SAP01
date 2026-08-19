'use strict'

const { spawnSync } = require('node:child_process')

const SCHEMA_FILES = Object.freeze([
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
  ]
}

function resolveDeployer () {
  return require.resolve('@sap/hdi-deploy/deploy.js', {
    paths: [process.cwd(), __dirname, require.resolve('@sap/cds-dk/package.json')]
  })
}

function run () {
  const result = spawnSync(process.execPath, [resolveDeployer(), ...buildSimulationArgs()], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    windowsHide: true
  })
  process.exitCode = result.error || !Number.isInteger(result.status) ? 1 : result.status
}

if (require.main === module) run()

module.exports = { buildSimulationArgs, resolveDeployer, SCHEMA_FILES }
