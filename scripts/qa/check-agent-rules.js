#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const RULES_DIR = path.join(ROOT, '.agents', 'rules')
const REQUIRED_RULES = [
  'scope-and-domain.md',
  'handover-and-issue-logging.md',
  'change-control-and-git.md',
  'sap-routing-and-ui.md',
  'skills-quality-and-ponytail.md',
  'documentation-knowledge-and-sap490.md',
  'testing-security-and-release.md',
  'ownership-learning-and-debug.md'
]

function read (file) {
  return fs.readFileSync(file, 'utf8')
}

function hasFrontMatter (text) {
  return /^---\r?\n[\s\S]*?\r?\n---\r?\n/.test(text)
}

function main () {
  const errors = []
  const indexPath = path.join(RULES_DIR, 'README.md')
  if (!fs.existsSync(indexPath)) errors.push('Missing .agents/rules/README.md')

  const agents = read(path.join(ROOT, 'AGENTS.md'))
  if (!agents.includes('.agents/rules/README.md')) errors.push('AGENTS.md does not route to the rule index')

  for (const name of REQUIRED_RULES) {
    const file = path.join(RULES_DIR, name)
    if (!fs.existsSync(file)) {
      errors.push(`Missing rule: ${name}`)
      continue
    }
    const text = read(file)
    if (!hasFrontMatter(text)) errors.push(`Rule has no YAML front matter: ${name}`)
    if (!agents.includes(name.replace('.md', ''))) errors.push(`AGENTS.md does not route rule: ${name}`)
  }

  const changeControl = read(path.join(RULES_DIR, 'change-control-and-git.md'))
  const worktreeSafetyPhrases = [
    'git worktree remove',
    'reparse points',
    'detach junction objects non-recursively',
    'prove every junction target still exists'
  ]
  for (const phrase of worktreeSafetyPhrases) {
    if (!changeControl.includes(phrase)) errors.push(`Change-control rule misses worktree safety phrase: ${phrase}`)
  }

  if (errors.length) {
    console.error('Agent rule check: FAIL')
    errors.forEach(error => console.error(`- ${error}`))
    process.exitCode = 1
    return
  }
  console.log(`Agent rule check: PASS (${REQUIRED_RULES.length} required rules)`)
}

main()
