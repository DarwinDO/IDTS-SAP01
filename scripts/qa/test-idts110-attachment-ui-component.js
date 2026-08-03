'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const root = path.resolve(__dirname, '..', '..')
const sourcePath = path.join(root, 'app', 'bug-management-ui', 'webapp', 'ext', 'sections', 'BugCollaboration.js')
const evidencePath = path.join(root, 'docs', 'pm', 'evidence', 'idts-110', 'ui-component-results.json')
const messages = []
let collaboration

const MessageBox = {
  Action: { DELETE: 'DELETE', CANCEL: 'CANCEL' },
  error: message => messages.push(message),
  confirm: () => { throw new Error('Confirmation is outside this validation harness.') }
}

const context = vm.createContext({
  sap: {
    ui: {
      define: (_dependencies, factory) => {
        collaboration = factory(MessageBox, { show: () => {} }, function JSONModel () {}, { save: () => {} })
      }
    }
  },
  window: { crypto: {} },
  console,
  Date,
  Intl,
  JSON,
  Math,
  Object,
  Promise,
  setTimeout,
  clearTimeout
})

vm.runInContext(fs.readFileSync(sourcePath, 'utf8'), context, { filename: sourcePath })
assert(collaboration?.onAttachmentSelected, 'BugCollaboration.onAttachmentSelected must be exported.')

function executeRejectedFile(caseId, file, expectedMessage) {
  messages.length = 0
  let clearCount = 0
  let enabledChangeCount = 0
  const source = {
    clear: () => { clearCount += 1 },
    getBindingContext: () => null,
    getParent: () => null,
    setEnabled: () => { enabledChangeCount += 1 }
  }

  collaboration.onAttachmentSelected({
    getSource: () => source,
    getParameter: name => name === 'files' ? [file] : undefined
  })

  assert.deepStrictEqual(messages, [expectedMessage], `${caseId} must show one safe validation message.`)
  assert.strictEqual(clearCount, 1, `${caseId} must clear the rejected selection.`)
  assert.strictEqual(enabledChangeCount, 0, `${caseId} must stop before the upload path.`)

  return {
    caseId,
    status: 'PASS',
    assertions: {
      safeMessage: expectedMessage,
      selectionCleared: true,
      uploadPathNotEntered: true
    }
  }
}

const results = [
  executeRejectedFile(
    'UT-ATT-007',
    { name: 'blocked-evidence.exe', type: 'application/octet-stream', size: 7 },
    'This file type is not supported. Please upload a text, PDF, PNG, or JPEG file.'
  ),
  executeRejectedFile(
    'UT-ATT-008',
    { name: 'oversized-evidence.txt', type: 'text/plain', size: 10 * 1024 * 1024 + 1 },
    'The selected file is too large. Please upload a file up to 10 MB.'
  )
]

fs.writeFileSync(evidencePath, `${JSON.stringify({
  task: 'IDTS-110',
  harness: 'isolated-ui-component',
  source: 'app/bug-management-ui/webapp/ext/sections/BugCollaboration.js#onAttachmentSelected',
  checkedAt: new Date().toISOString(),
  results
}, null, 2)}\n`)

for (const result of results) console.log(`PASS ${result.caseId} — ${result.assertions.safeMessage}`)
console.log(`IDTS110_UI_COMPONENT_RESULT ${JSON.stringify({ pass: results.length, fail: 0 })}`)
