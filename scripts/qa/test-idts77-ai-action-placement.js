/**
 * IDTS-77 AI action placement verification.
 */

'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', '..')

function read (relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function parseProperties (relativePath) {
  return read(relativePath)
    .split(/\r?\n/)
    .filter(line => line && !line.trim().startsWith('#') && line.includes('='))
    .reduce((result, line) => {
      const index = line.indexOf('=')
      result[line.slice(0, index).trim()] = line.slice(index + 1).trim()
      return result
    }, {})
}

function expectIncludes (label, content, expected) {
  assert(content.includes(expected), `${label} must include ${expected}`)
  return { label, pass: true }
}

function expectNotIncludes (label, content, unexpected) {
  assert(!content.includes(unexpected), `${label} must not include ${unexpected}`)
  return { label, pass: true }
}

function expectPosition (checks, sections, id, anchor, placement) {
  assert(sections[id], `manifest must register ${id}`)
  assert.deepStrictEqual(
    sections[id].position,
    { anchor, placement },
    `${id} must be positioned ${placement} ${anchor}`
  )
  checks.push({ label: `${id} is positioned ${placement} ${anchor}`, pass: true })
}

const manifest = JSON.parse(read('app/bug-management-ui/webapp/manifest.json'))
const sections = manifest['sap.ui5'].routing.targets.BugsObjectPage.options.settings.content.body.sections
const similarFragment = read('app/bug-management-ui/webapp/ext/fragment/SimilarBugCheckSection.fragment.xml')
const smartAssignmentFragment = read('app/bug-management-ui/webapp/ext/fragment/SmartAssignmentSection.fragment.xml')
const classificationFragment = read('app/bug-management-ui/webapp/ext/fragment/ClassificationAssistanceSection.fragment.xml')
const handoffFragment = read('app/bug-management-ui/webapp/ext/fragment/HandoffSummarySection.fragment.xml')
const i18nFiles = [
  'app/bug-management-ui/webapp/i18n/i18n.properties',
  'app/bug-management-ui/webapp/i18n/i18n_en.properties'
]

const checks = []

assert.strictEqual(
  sections.IdtsSimilarBugCheck.template,
  'idts.bugmanagementui.ext.fragment.SimilarBugCheckSection'
)
checks.push({ label: 'manifest uses the Similar Bug Check fragment', pass: true })

expectPosition(checks, sections, 'IdtsSimilarBugCheck', 'BugDetails', 'After')
expectPosition(checks, sections, 'IdtsClassificationAssistance', 'ClassificationAndAssignment', 'After')
expectPosition(checks, sections, 'IdtsSmartAssignment', 'IdtsClassificationAssistance', 'After')
expectPosition(checks, sections, 'IdtsHandoffSummary', 'History', 'Before')

checks.push(expectIncludes('similar bug section opens duplicate review', similarFragment, 'DuplicateReview.openDialog'))
checks.push(expectIncludes('similar bug section uses the existing duplicate action module', similarFragment, 'idts/bugmanagementui/ext/actions/DuplicateReview'))
checks.push(expectIncludes('similar bug section uses the shared thin action-row hint', similarFragment, 'similarBugReviewSectionHint'))
checks.push(expectIncludes('classification section still opens classification review', classificationFragment, 'ClassificationReview.openDialog'))
checks.push(expectIncludes('handoff section still opens handoff review', handoffFragment, 'HandoffSummaryReview.openDialog'))
checks.push(expectNotIncludes('Assignment section no longer owns Find Similar Bugs', smartAssignmentFragment, 'DuplicateReview.openDialog'))
checks.push(expectNotIncludes('Assignment section no longer loads duplicate review module', smartAssignmentFragment, 'idts/bugmanagementui/ext/actions/DuplicateReview'))
checks.push(expectNotIncludes('Assignment section no longer uses duplicate review button text', smartAssignmentFragment, 'duplicateReviewOpenButton'))

for (const file of i18nFiles) {
  const props = parseProperties(file)
  assert.strictEqual(props.similarBugReviewSectionTitle, 'Similar Bug Check')
  assert.strictEqual(
    props.similarBugReviewSectionHint,
    'Check whether this bug looks similar to existing reports before continuing.'
  )
  checks.push({ label: `${file} contains user-facing Similar Bug Check copy`, pass: true })

  for (const key of ['similarBugReviewSectionTitle', 'similarBugReviewSectionHint']) {
    assert(
      !/\b(prompt|token|model|provider|architecture|debug|stack|sql|password|credential|secret|api key|bearer|endpoint|XSUAA|BTP|QA|CAP)\b/i.test(props[key]),
      `${file}:${key} must not expose internal/developer/environment copy`
    )
    checks.push({ label: `${file}:${key} has no internal/developer-facing copy`, pass: true })
  }
}

const evidenceDir = path.join(root, 'docs', 'pm', 'evidence', 'idts-77')
fs.mkdirSync(evidenceDir, { recursive: true })
fs.writeFileSync(
  path.join(evidenceDir, 'ai-action-placement-static-check.json'),
  JSON.stringify({
    task: 'IDTS-77',
    checkedAt: new Date().toISOString(),
    checks
  }, null, 2)
)

console.log(`IDTS-77 AI action placement: ${checks.length}/${checks.length} checks passed`)
