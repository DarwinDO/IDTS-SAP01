'use strict'

const { spawnSync } = require('node:child_process')
const { resolveDeployer } = require('./ua-developer-hdi-simulate-command')
const { SCHEMA_FILES } = require('./gate5-business-catalog-hdi-command')

function buildRollbackArgs () {
  return [
    '--exit',
    '--use-hdb',
    '--treat-warnings-as-errors',
    '--treat-deployer-warnings-as-errors',
    '--no-auto-undeploy',
    '--no-trace-vcap-services',
    '--undeploy', ...SCHEMA_FILES
  ]
}

function run () {
  const result = spawnSync(process.execPath, [resolveDeployer(), ...buildRollbackArgs()], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    windowsHide: true
  })
  process.exitCode = result.error || !Number.isInteger(result.status) ? 1 : result.status
}

if (require.main === module) run()

module.exports = { buildRollbackArgs }
