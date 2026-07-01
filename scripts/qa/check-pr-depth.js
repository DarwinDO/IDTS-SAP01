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
  'Known Gaps',
  'Jira/Evidence Links'
]

const MIN_CONTENT_LENGTH = 12

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
  const lines = markdown.split(/\r?\n/)
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

function validatePullRequestBody(markdown) {
  const sections = extractSections(markdown)
  const errors = []

  for (const name of REQUIRED_SECTIONS) {
    const key = normalizeHeading(name)
    if (!sections.has(key)) {
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
  stripComments
}
