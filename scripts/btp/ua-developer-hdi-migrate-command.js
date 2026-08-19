'use strict'

const { spawnSync } = require('node:child_process')
const { resolveDeployer, SCHEMA_FILES } = require('./ua-developer-hdi-simulate-command')

function buildMigrationArgs () {
  return [
    '--exit',
    '--use-hdb',
    '--treat-warnings-as-errors',
    '--treat-deployer-warnings-as-errors',
    '--no-auto-undeploy',
    '--no-trace-vcap-services',
    '--working-set', ...SCHEMA_FILES,
    '--include-filter', ...SCHEMA_FILES,
    '--deploy', ...SCHEMA_FILES
  ]
}

function run () {
  const result = spawnSync(process.execPath, [resolveDeployer(), ...buildMigrationArgs()], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    windowsHide: true
  })
  process.exitCode = result.error || !Number.isInteger(result.status) ? 1 : result.status
}

if (require.main === module) run()

module.exports = { buildMigrationArgs }
