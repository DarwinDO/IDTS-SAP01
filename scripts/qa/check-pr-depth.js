#!/usr/bin/env node
'use strict'

const fs = require('fs')

const REQUIRED_SECTIONS = [
  'Summary',
  'Positive Evidence',
  'Negative Evidence',
  'Edge/Boundary Evidence',
  'Roles/Authorization',
  'Persistence/Reload',
  'UI/UX Review',
  'Ponytail Simplicity',
  'Ownership Knowledge Gate',
  'Known Gaps',
  'Jira/Evidence Links'
]

const MIN_CONTENT_LENGTH = 12
const OWNERSHIP_GATE_EFFECTIVE_DATE = '2026-07-13'

function parseArgs(argv) {
  const args = {}
  for (let index = 2; index < argv.length; index += 1) {
    const item = argv[index]
    if (item === '--body-file') args.bodyFile = argv[++index]
    else if (item === '--event') args.event = argv[++index]
    else if (item === '--stdin') args.stdin = true
  }
  return args
}

function readBody(args) {
  if (args.bodyFile) return fs.readFileSync(args.bodyFile, 'utf8')
  if (args.event) {
    const event = JSON.parse(fs.readFileSync(args.event, 'utf8'))
    return event.pull_request?.body || ''
  }
  if (args.stdin) return fs.readFileSync(0, 'utf8')
  if (process.env.GITHUB_EVENT_PATH) {
    const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
    return event.pull_request?.body || ''
  }
  return ''
}

function normalizeHeading(text) {
  return text
    .replace(/^#+\s*/, '')
    .replace(/[:：]\s*$/, '')
    .trim()
    .toLowerCase()
}

function extractSections(markdown) {
  const sections = new Map()
  const lines = markdown.replace(/^\uFEFF/, '').split(/\r?\n/)
  let current = null
  let buffer = []

  function flush() {
    if (!current) return
    sections.set(current, buffer.join('\n').trim())
  }

  for (const line of lines) {
    const match = /^(#{2,6})\s+(.+?)\s*$/.exec(line)
    if (match) {
      flush()
      current = normalizeHeading(match[2])
      buffer = []
    } else if (current) {
      buffer.push(line)
    }
  }
  flush()
  return sections
}

function stripComments(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/-\s*\[\s*\]\s+.*/g, '')
    .trim()
}

function hasBareNA(text) {
  const cleaned = stripComments(text)
  return /^n\/?a\.?$/i.test(cleaned) || /^not applicable\.?$/i.test(cleaned)
}

function hasExplainedNA(text) {
  const cleaned = stripComments(text)
  return /^(n\/?a|not applicable)\s*[-:–—]\s+\S.{6,}/i.test(cleaned)
}

function isAllowedNoneSection(name, text) {
  if (name !== 'Known Gaps') return false
  const cleaned = stripComments(text)
  return /^none\.?$/i.test(cleaned)
}

const OWNERSHIP_GATE_FIELDS = [
  'Member',
  'Date',
  'Ownership flow',
  'Base questions',
  'Inactive-day questions',
  'Additional-flow questions',
  'Score',
  'Critical questions',
  'Debug exercise',
  'Teach-back',
  'Evidence',
  'Result'
]

function validateOwnershipKnowledgeGate (text, errors) {
  const values = new Map()
  for (const line of text.split(/\r?\n/)) {
    const match = /^([^:]+):\s*(.+?)\s*$/.exec(line)
    if (match) values.set(match[1].trim().toLowerCase(), match[2].trim())
  }

  for (const field of OWNERSHIP_GATE_FIELDS) {
    if (!values.has(field.toLowerCase())) errors.push(`Missing Ownership Knowledge Gate field: ${field}`)
  }

  const score = values.get('score') || ''
  const scoreMatch = /^(\d{1,3})%$/.exec(score)
  if (!scoreMatch || Number(scoreMatch[1]) < 80 || Number(scoreMatch[1]) > 100) {
    errors.push('Ownership Knowledge Gate score must be 80% to 100%')
  }

  for (const field of ['Critical questions', 'Debug exercise', 'Teach-back', 'Result']) {
    if ((values.get(field.toLowerCase()) || '').toUpperCase() !== 'PASS') {
      errors.push(`Ownership Knowledge Gate field must be PASS: ${field}`)
    }
  }

  const evidence = values.get('evidence') || ''
  if (!/(^|\s)(docs\/learning\/progress\/|docs\/pm\/evidence\/)/.test(evidence)) {
    errors.push('Ownership Knowledge Gate evidence must reference docs/learning/progress/ or docs/pm/evidence/')
  }
}

function isOwnershipGateRequired (today = new Date().toISOString().slice(0, 10)) {
  return today >= OWNERSHIP_GATE_EFFECTIVE_DATE
}

function validatePullRequestBody (markdown, options = {}) {
  const sections = extractSections(markdown)
  const errors = []
  const ownershipGateRequired = options.ownershipGateRequired ?? isOwnershipGateRequired(options.today)

  for (const name of REQUIRED_SECTIONS) {
    const key = normalizeHeading(name)
    if (!sections.has(key)) {
      if (name === 'Ownership Knowledge Gate' && !ownershipGateRequired) continue
      errors.push(`Missing required section: ${name}`)
      continue
    }

    const content = stripComments(sections.get(key))
    if (hasBareNA(sections.get(key))) {
      errors.push(`N/A must include a reason in section: ${name}`)
      continue
    }

    if (!isAllowedNoneSection(name, sections.get(key)) && content.length < MIN_CONTENT_LENGTH) {
      errors.push(`Section is empty or too thin: ${name}`)
      continue
    }
  }

  for (const name of ['Negative Evidence', 'Edge/Boundary Evidence', 'Roles/Authorization', 'Persistence/Reload', 'UI/UX Review']) {
    const content = sections.get(normalizeHeading(name)) || ''
    const cleaned = stripComments(content)
    const untestedClaim =
      /^(none|not tested|no tests?|no testing)([.\s-]|$)/i.test(cleaned) ||
      /\b(not tested|no tests?|no testing)\b/i.test(cleaned)
    if (untestedClaim && !hasExplainedNA(content)) {
      errors.push(`Section must explain untested/none claim: ${name}`)
    }
  }

  const ownershipGate = sections.get(normalizeHeading('Ownership Knowledge Gate'))
  if (ownershipGate) validateOwnershipKnowledgeGate(stripComments(ownershipGate), errors)

  return {
    pass: errors.length === 0,
    errors,
    checkedSections: REQUIRED_SECTIONS.length
  }
}

function main() {
  const body = readBody(parseArgs(process.argv))
  const result = validatePullRequestBody(body)

  if (result.pass) {
    console.log(`QA Depth Gate PR body check: PASS (${result.checkedSections} required sections)`)
    return
  }

  console.error('QA Depth Gate PR body check: FAIL')
  for (const error of result.errors) console.error(`- ${error}`)
  process.exitCode = 1
}

if (require.main === module) main()

module.exports = {
  REQUIRED_SECTIONS,
  validatePullRequestBody,
  extractSections,
  stripComments,
  validateOwnershipKnowledgeGate,
  isOwnershipGateRequired
}
