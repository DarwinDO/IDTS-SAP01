const fs = require('fs')
const path = require('path')
const assert = require('assert')
const vm = require('vm')

const root = path.resolve(__dirname, '..', '..')

function read (relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function exists (relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

const controller = read('app/bug-management-ui/webapp/ext/sections/BugCollaboration.js')
const manifest = read('app/bug-management-ui/webapp/manifest.json')
const annotations = read('app/bug-management-ui/annotations/object-page.cds')
const routerXsApp = read('app/router/xs-app.json')
const uiXsApp = read('app/bug-management-ui/xs-app.json')

assert(controller.includes('BugService.addComment(...)'), 'Comment must use the bound OData V4 action path')
assert(controller.includes('.setParameter("content", content)'), 'Comment must set the bound action parameter')
assert(/\.invoke\(|\.execute\(/.test(controller), 'Comment must invoke the action through OData V4 model APIs')
assert(!controller.includes('new XMLHttpRequest()'), 'Collaboration writes must not use raw XMLHttpRequest')
assert(!controller.includes('pendingCreateAttachmentsByBugId'), 'Custom browser-memory attachment queue must be retired')
assert(!controller.includes('BugService.draftEdit'), 'Attachment handling must not manually orchestrate draftEdit')
assert(!controller.includes('BugService.draftActivate'), 'Attachment handling must not manually orchestrate draftActivate')
assert(!controller.includes('onAttachmentSelected'), 'Custom attachment upload handler must be retired')

assert(!manifest.includes('IdtsAttachmentsCustom'), 'Manifest must not register the custom attachment section')
assert(!manifest.includes('AttachmentsSection.fragment'), 'Manifest must use the generated attachment facet')
assert(!exists('app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml'), 'Retired custom attachment fragment must be removed')
assert(annotations.includes("Target : 'attachments/@UI.LineItem'"), 'Generated attachment facet must target the attachment LineItem')
assert(!/ID\s*:\s*'Attachments'[\s\S]{0,180}!\[@UI\.Hidden\]\s*:\s*true/.test(annotations), 'Generated attachment facet must not be hidden')

assert(routerXsApp.includes('"csrfProtection": true'), 'AppRouter OData route must keep CSRF protection enabled')
assert(uiXsApp.includes('"csrfProtection": true'), 'UI OData route must keep CSRF protection enabled')

async function verifyCommentOperation () {
  let module
  const calls = { parameters: {}, invoked: false, refreshed: false, toast: null }
  const operation = {
    setParameter: (name, value) => { calls.parameters[name] = value },
    invoke: groupId => {
      calls.invoked = groupId
      return Promise.resolve()
    }
  }
  const model = {
    bindContext: (operationPath, context, parameters) => {
      calls.path = operationPath
      calls.context = context
      calls.bindingParameters = parameters
      return operation
    }
  }
  const bugContext = {
    getPath: () => '/Bugs(ID=00000000-0000-0000-0000-000000000001,IsActiveEntity=true)',
    getProperty: name => ({ IsActiveEntity: true, HasDraftEntity: false }[name]),
    requestRefresh: () => {
      calls.refreshed = true
      return Promise.resolve()
    }
  }
  const textArea = {
    getId: () => 'view--idtsCommentTextArea',
    getValue: () => '  verified comment  ',
    setValue: value => { calls.clearedValue = value },
    setValueState: state => { calls.valueState = state },
    getMetadata: () => ({ getAllAggregations: () => ({}) })
  }
  const root = {
    getId: () => 'view--root',
    getMetadata: () => ({ getAllAggregations: () => ({ content: {} }) }),
    getAggregation: name => name === 'content' ? [textArea] : null,
    getParent: () => null
  }
  const source = {
    getId: () => 'view--postComment',
    getModel: () => model,
    getBindingContext: () => bugContext,
    getMetadata: () => ({ getAllAggregations: () => ({}) }),
    getParent: () => root,
    setEnabled: enabled => { calls.enabled = enabled }
  }
  const sandbox = {
    window: { Promise },
    Intl,
    Date,
    sap: {
      ui: {
        define: (dependencies, factory) => {
          module = factory(
            { error: message => { calls.error = message } },
            { show: message => { calls.toast = message } }
          )
        }
      }
    }
  }

  vm.runInNewContext(controller, sandbox)
  module.onAddComment({ getSource: () => source })
  await new Promise(resolve => setTimeout(resolve, 0))

  assert.strictEqual(calls.path, bugContext.getPath() + '/BugService.addComment(...)')
  assert.deepStrictEqual(calls.parameters, { content: 'verified comment' })
  assert.strictEqual(calls.invoked, '$direct')
  assert.strictEqual(calls.refreshed, true)
  assert.strictEqual(calls.clearedValue, '')
  assert.strictEqual(calls.toast, 'Comment posted.')
  assert.strictEqual(calls.enabled, true)
  assert.strictEqual(calls.error, undefined)
}

verifyCommentOperation()
  .then(() => console.log('IDTS-116 SAP-standard collaboration UI checks passed.'))
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
