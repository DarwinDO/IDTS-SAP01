'use strict'

const { spawnSync } = require('node:child_process')
const { resolveDeployer } = require('./ua-developer-hdi-simulate-command')

const SCHEMA_FILES = Object.freeze([
  'src/gen/idts.cap.CatalogAdministrationAuditEvents.hdbtable',
  'src/gen/idts.cap.ApplicationComponents.catalogCode.hdbindex',
  'src/gen/idts.cap.ComponentCategories.catalogPair.hdbindex',
  'src/gen/idts.cap.DefectCategories.catalogCode.hdbindex',
  'src/gen/idts.cap.SAPModules.catalogCode.hdbindex'
])

function buildArgs (mode = 'simulate') {
  if (!['simulate', 'migrate'].includes(mode)) throw new Error('Unsupported Gate 5 HDI mode.')

  return [
    '--exit',
    ...(mode === 'simulate' ? ['--simulate-make'] : []),
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
  const result = spawnSync(process.execPath, [resolveDeployer(), ...buildArgs(process.argv[2])], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    windowsHide: true
  })
  process.exitCode = result.error || !Number.isInteger(result.status) ? 1 : result.status
}

if (require.main === module) run()

module.exports = { buildArgs, SCHEMA_FILES }
