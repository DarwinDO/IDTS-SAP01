'use strict'

const { spawnSync } = require('node:child_process')
const { resolveDeployer } = require('./ua-developer-hdi-simulate-command')

const VIEW_FILES = Object.freeze([
  'src/gen/UserAdministrationService.CatalogSAPModules.hdbview',
  'src/gen/UserAdministrationService.CatalogApplicationComponents.hdbview',
  'src/gen/UserAdministrationService.CatalogDefectCategories.hdbview',
  'src/gen/UserAdministrationService.CatalogComponentCategories.hdbview'
])

function buildArgs (mode = 'simulate') {
  if (!['simulate', 'migrate'].includes(mode)) throw new Error('Unsupported Gate 5 catalog-view HDI mode.')

  return [
    '--exit',
    ...(mode === 'simulate' ? ['--simulate-make'] : []),
    '--use-hdb',
    '--treat-warnings-as-errors',
    '--treat-deployer-warnings-as-errors',
    '--no-auto-undeploy',
    '--no-trace-vcap-services',
    '--working-set', ...VIEW_FILES,
    '--include-filter', ...VIEW_FILES,
    '--deploy', ...VIEW_FILES
  ]
}

function run () {
  const result = spawnSync(process.execPath, [resolveDeployer(), ...buildArgs(process.argv[2])], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    windowsHide: true
  })
  process.exitCode = result.error || !Number.isInteger(result.status) ? 1 : result.status
}

if (require.main === module) run()

module.exports = { buildArgs, VIEW_FILES }
