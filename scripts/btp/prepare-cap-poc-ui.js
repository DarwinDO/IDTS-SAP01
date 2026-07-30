const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')
const source = path.join(projectRoot, 'app', 'bug-management-ui', 'webapp')
const target = path.join(projectRoot, 'gen', 'srv', 'app', 'bug-management-ui', 'webapp')
const generatedPackagePath = path.join(projectRoot, 'gen', 'srv', 'package.json')
const passwordHelperSource = path.join(projectRoot, 'scripts', 'dev', 'set-local-user-password.js')
const passwordHelperTarget = path.join(projectRoot, 'gen', 'srv', 'scripts', 'dev', 'set-local-user-password.js')

if (!fs.existsSync(source)) {
  throw new Error(`UI source directory not found: ${source}`)
}

if (!fs.existsSync(path.join(projectRoot, 'gen', 'srv', 'server.js'))) {
  throw new Error('Run "cds build --production" before packaging the UI.')
}

// SAP BTP's Node.js buildpack rejects range expressions with spaces.
// Keep the repository-wide range intact for Render/local use and narrow only
// the generated Cloud Foundry staging package to the Node 22 line available
// in the SAP BTP Cloud Foundry buildpack.
const generatedPackage = JSON.parse(fs.readFileSync(generatedPackagePath, 'utf8'))
generatedPackage.engines = { ...generatedPackage.engines, node: '22.x' }
fs.writeFileSync(generatedPackagePath, `${JSON.stringify(generatedPackage, null, 2)}\n`)

fs.rmSync(target, { recursive: true, force: true })
fs.mkdirSync(path.dirname(target), { recursive: true })
fs.cpSync(source, target, { recursive: true })

// Package the existing env-only password helper so a one-off CF task can
// initialize an isolated seed user without committing plaintext credentials.
fs.mkdirSync(path.dirname(passwordHelperTarget), { recursive: true })
fs.copyFileSync(passwordHelperSource, passwordHelperTarget)

console.log(`Packaged IDTS UI for BTP POC: ${path.relative(projectRoot, target)}`)
