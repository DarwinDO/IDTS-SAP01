#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'gen',
  'coverage',
  'uat-evidence'
])
const IGNORED_FILES = new Set([
  'package-lock.json',
  'db.sqlite'
])
const PATTERNS = [
  { name: 'AWS access key', regex: /(?:AKIA|ASIA)[0-9A-Z]{16}/ },
  { name: 'Private key block', regex: /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/ },
  { name: 'AWS secret assignment', regex: /aws_secret_access_key\s*[:=]\s*['"]?[A-Za-z0-9/+=]{20,}/i },
  { name: 'SMTP password assignment', regex: /smtp[^=\n]{0,40}password\s*[:=]\s*['"]?[^\s'"<>{}]{12,}/i },
  { name: 'Bearer token literal', regex: /bearer\s+[A-Za-z0-9._~+/-]{30,}/i }
]

function shouldSkip(fullPath) {
  const relative = path.relative(ROOT, fullPath)
  const parts = relative.split(path.sep)
  return parts.some(part => IGNORED_DIRS.has(part)) || IGNORED_FILES.has(path.basename(fullPath))
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (shouldSkip(fullPath)) continue
    if (entry.isDirectory()) yield* walk(fullPath)
    else if (entry.isFile()) yield fullPath
  }
}

function scan() {
  const hits = []
  for (const file of walk(ROOT)) {
    let content
    try {
      content = fs.readFileSync(file, 'utf8')
    } catch {
      continue
    }
    for (const pattern of PATTERNS) {
      const match = pattern.regex.exec(content)
      if (match) {
        hits.push(`${path.relative(ROOT, file)}: ${pattern.name}`)
      }
    }
  }
  return hits
}

function main() {
  const hits = scan()
  if (hits.length) {
    console.error('IDTS secret scan: FAIL')
    for (const hit of hits.slice(0, 50)) console.error(`- ${hit}`)
    if (hits.length > 50) console.error(`...and ${hits.length - 50} more`)
    process.exitCode = 1
    return
  }
  console.log('IDTS secret scan: PASS - no credential-like key patterns found.')
}

if (require.main === module) main()

module.exports = { scan, PATTERNS }
