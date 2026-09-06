#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { createReceiptManifest, defaults, parseArgs } = require('./generate-idts110-final-report.js')

const root = process.cwd()
const config = defaults(root)
const args = parseArgs(process.argv.slice(2))
for (const key of ['workbookReceipt', 'reviewReceipt', 'reviewArtifact', 'receiptManifest']) {
  if (typeof args[key] === 'string') config[key] = path.resolve(root, args[key])
}

const manifest = createReceiptManifest(config)
fs.mkdirSync(path.dirname(config.receiptManifest), { recursive: true })
fs.writeFileSync(config.receiptManifest, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
process.stdout.write(`${JSON.stringify({ output: path.relative(root, config.receiptManifest).replaceAll(path.sep, '/'), ...manifest }, null, 2)}\n`)
