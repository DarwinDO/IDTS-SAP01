const fs = require('fs')
const path = require('path')
const assert = require('assert')

const root = path.resolve(__dirname, '..', '..')

function read (relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

const schema = read('db/schema.cds')
const annotations = read('app/bug-management-ui/annotations/object-page.cds')
const manifest = read('app/bug-management-ui/webapp/manifest.json')
const controller = read('app/bug-management-ui/webapp/ext/sections/BugCollaboration.js')

assert(schema.includes("from '@cap-js/attachments'"), 'Attachment entity must use the CAP attachment plugin')
assert(schema.includes('Composition of many BugAttachments'), 'Bug must own attachment drafts through a composition')
assert(!annotations.includes("Target : 'attachments/@UI.LineItem'"), 'Application annotations must leave the attachment facet to the CAP attachment plugin')
assert(!manifest.includes('attachments/@com.sap.vocabularies.UI.v1.LineItem'), 'Manifest must not override the plugin-owned attachment table')
assert(!manifest.includes('IdtsAttachmentsCustom'), 'Custom attachment section must not duplicate the generated facet')
assert(!manifest.includes('AttachmentsSection.fragment'), 'Custom FileUploader fragment must be retired')
assert(!controller.includes('pendingCreateAttachmentsByBugId'), 'Files must use CAP draft persistence instead of a browser-memory queue')
assert(!controller.includes('BugService.draftEdit'), 'Fiori Elements must own the attachment draft lifecycle')
assert(!controller.includes('BugService.draftActivate'), 'Fiori Elements must activate the parent draft on Save')
assert(manifest.includes('"csrfProtection": true') === false, 'CSRF route configuration belongs to xs-app files, not the UI manifest')

console.log('IDTS-73 SAP-standard draft attachment checks passed.')
