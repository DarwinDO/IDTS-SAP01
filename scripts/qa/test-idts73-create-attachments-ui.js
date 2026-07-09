const fs = require('fs')
const path = require('path')
const assert = require('assert')

const root = path.resolve(__dirname, '..', '..')

function read (relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function expectIncludes (label, content, expected) {
  assert(
    content.includes(expected),
    `${label} must include ${expected}`
  )
  return { label, pass: true }
}

function expectNotIncludes (label, content, forbidden) {
  assert(
    !content.includes(forbidden),
    `${label} must not include ${forbidden}`
  )
  return { label, pass: true }
}

const commentsFragment = read('app/bug-management-ui/webapp/ext/fragment/CommentsSection.fragment.xml')
const attachmentsFragment = read('app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml')
const manifest = read('app/bug-management-ui/webapp/manifest.json')
const collaborationSection = read('app/bug-management-ui/webapp/ext/controls/BugCollaborationSection.js')
const collaborationController = read('app/bug-management-ui/webapp/ext/sections/BugCollaboration.js')
const i18n = read('app/bug-management-ui/webapp/i18n/i18n.properties')

const checks = [
  expectIncludes('manifest hides Comments custom section on create draft', manifest, '"visible": "{= ${IsActiveEntity} === true || ${HasActiveEntity} === true }"'),
  expectIncludes('comments section is hidden only for create drafts', commentsFragment, 'hideOnCreate="true"'),
  expectIncludes('attachment section flushes pending files after active save', attachmentsFragment, 'uploadPendingAttachmentsOnActive="true"'),
  expectIncludes('attachment uploader allows selecting more than one file', attachmentsFragment, 'multiple="true"'),
  expectIncludes('attachment uploader is enabled for create drafts', attachmentsFragment, '${HasActiveEntity} !== true'),
  expectIncludes('pending attachment list is visible on create draft', attachmentsFragment, 'idtsPendingAttachmentsList'),
  expectIncludes('pending list uses selected-file model', attachmentsFragment, 'idtsPendingAttachments>/files'),
  expectIncludes('custom section has create-hide property', collaborationSection, 'hideOnCreate'),
  expectIncludes('custom section has pending-upload property', collaborationSection, 'uploadPendingAttachmentsOnActive'),
  expectIncludes('custom section hides nearest ObjectPage subsection', collaborationSection, 'sap.uxap.ObjectPageSubSection'),
  expectIncludes('collaboration controller keeps files in memory by bug id', collaborationController, 'pendingCreateAttachmentsByBugId'),
  expectIncludes('collaboration controller detects create draft context', collaborationController, 'isCreateDraftContext'),
  expectIncludes('collaboration controller flushes files after save', collaborationController, 'flushPendingCreateAttachments'),
  expectIncludes('collaboration controller reuses saved-bug upload flow', collaborationController, 'uploadFilesToSavedBug'),
  expectIncludes('pending attachment no-data text exists', i18n, 'attachmentsPendingNoData='),
  expectNotIncludes('create attachment UI must not expose internal auth/deploy explanation', attachmentsFragment, 'XSUAA')
]

const evidenceDir = path.join(root, 'docs', 'pm', 'evidence', 'idts-73')
fs.mkdirSync(evidenceDir, { recursive: true })
fs.writeFileSync(
  path.join(evidenceDir, 'create-attachment-static-check.json'),
  JSON.stringify({
    task: 'IDTS-73',
    checkedAt: new Date().toISOString(),
    checks
  }, null, 2)
)

console.log(`IDTS-73 create attachment UI checks passed (${checks.length}).`)
