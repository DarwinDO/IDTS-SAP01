'use strict'

const fs = require('node:fs')
const path = require('node:path')

const generatedPackagePath = path.resolve(__dirname, '../../gen/srv/package.json')
const generatedPackage = JSON.parse(fs.readFileSync(generatedPackagePath, 'utf8'))

generatedPackage.engines = { ...generatedPackage.engines, node: '22.x' }
fs.writeFileSync(generatedPackagePath, `${JSON.stringify(generatedPackage, null, 2)}\n`)

console.log('Pinned generated Cloud Foundry package to Node 22.x.')
