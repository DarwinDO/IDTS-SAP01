'use strict'

const { spawnSync } = require('node:child_process')
const { resolveDeployer } = require('./ua-developer-hdi-simulate-command')

const CATALOG_VIEWS = Object.freeze([
  'src/gen/UserAdministrationService.ApplicationComponents.hdbview',
  'src/gen/UserAdministrationService.DefectCategories.hdbview'
])

function buildArgs (mode = 'simulate') {
  if (!['simulate', 'migrate'].includes(mode)) throw new Error('Unsupported catalog HDI mode.')
  return [
    '--exit',
    ...(mode === 'simulate' ? ['--simulate-make'] : []),
    '--use-hdb',
    '--treat-warnings-as-errors',
    '--treat-deployer-warnings-as-errors',
    '--no-auto-undeploy',
    '--no-trace-vcap-services',
    '--working-set', ...CATALOG_VIEWS,
    '--include-filter', ...CATALOG_VIEWS,
    '--deploy', ...CATALOG_VIEWS
  ]
}

function run () {
  const mode = process.argv[2] || 'simulate'
  const result = spawnSync(process.execPath, [resolveDeployer(), ...buildArgs(mode)], {
    cwd: process.cwd(), env: process.env, stdio: 'inherit', windowsHide: true
  })
  process.exitCode = result.error || !Number.isInteger(result.status) ? 1 : result.status
}

if (require.main === module) run()

module.exports = { buildArgs, CATALOG_VIEWS }
