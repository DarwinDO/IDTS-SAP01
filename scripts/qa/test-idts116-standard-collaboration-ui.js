const fs = require('fs')
const path = require('path')
const assert = require('assert')
const vm = require('vm')
const cds = require('@sap/cds')

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
const uiPackage = JSON.parse(read('app/bug-management-ui/package.json'))
const uiManifest = JSON.parse(manifest)

assert(controller.includes('BugService.addComment(...)'), 'Comment must use the bound OData V4 action path')
assert(controller.includes('.setParameter("content", content)'), 'Comment must set the bound action parameter')
assert(/\.invoke\(|\.execute\(/.test(controller), 'Comment must invoke the action through OData V4 model APIs')
assert(!controller.includes('invoke("$direct")'), 'Comment action must use the model update group so UI5 can manage CSRF through the OData batch lifecycle')
assert(controller.includes('idtsCommentsFeed'), 'Comment success must refresh the comments feed, not the complete Object Page context')
assert(controller.includes('getBinding("items")'), 'Comment refresh must use the public list binding API')
assert(controller.includes('requestRefresh("$direct")'), 'Comment refresh must use the Promise-returning OData V4 requestRefresh API')
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
assert(routerXsApp.includes('index\\\\.html|manifest\\\\.json|Component\\\\.js|Component-preload\\\\.js'), 'AppRouter must route HTML5 entry assets through an explicit cache-control rule')
assert(routerXsApp.includes('"cacheControl": "no-cache, no-store, must-revalidate"'), 'HTML5 entry assets must be revalidated after app-content rollout')
assert.strictEqual(uiManifest['sap.app'].applicationVersion.version, uiPackage.version, 'UI manifest and package versions must stay aligned for HTML5 app-content cache invalidation')
assert.notStrictEqual(uiPackage.version, '0.0.1', 'Changed HTML5 app content must not reuse the original 0.0.1 application version')

async function verifyCompiledAttachmentFacet () {
  const model = await cds.load('*')
  const bugs = model.definitions['BugService.Bugs']
  const facets = bugs && bugs['@UI.Facets'] ? bugs['@UI.Facets'] : []
  const attachmentFacets = facets.filter(facet =>
    facet && facet.Target === 'attachments/@UI.LineItem'
  )

  assert.strictEqual(attachmentFacets.length, 1, 'Compiled BugService metadata must expose exactly one attachment facet')
}

async function verifyCommentOperation (options = {}) {
  let module
  const calls = { parameters: {}, invoked: false, listRefreshed: false, rootRefreshed: false, toast: null }
  const operation = {
    setParameter: (name, value) => { calls.parameters[name] = value },
    invoke: groupId => {
      calls.invoked = groupId === undefined ? 'default' : groupId
      return options.actionReject ? Promise.reject(new Error('simulated action failure')) : Promise.resolve()
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
      calls.rootRefreshed = true
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
  const commentsFeed = {
    getId: () => 'view--idtsCommentsFeed',
    getBinding: name => name === 'items' ? {
      requestRefresh: groupId => {
        calls.listRefreshed = groupId
        if (options.refreshThrow) throw new Error('simulated synchronous refresh failure')
        return options.refreshReject ? Promise.reject(new Error('simulated refresh failure')) : Promise.resolve()
      }
    } : null,
    getMetadata: () => ({ getAllAggregations: () => ({}) })
  }
  const root = {
    getId: () => 'view--root',
    getMetadata: () => ({ getAllAggregations: () => ({ content: {} }) }),
    getAggregation: name => name === 'content' ? [textArea, commentsFeed] : null,
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
  assert.strictEqual(calls.invoked, '$auto')
  assert.strictEqual(calls.rootRefreshed, false)
  assert.strictEqual(calls.enabled, true)

  if (options.actionReject) {
    assert.strictEqual(calls.listRefreshed, false)
    assert.strictEqual(calls.clearedValue, undefined)
    assert.strictEqual(calls.toast, null)
    assert.strictEqual(calls.error, 'The comment could not be posted. Please refresh and try again.')
    return
  }

  assert.strictEqual(calls.listRefreshed, '$direct')
  assert.strictEqual(calls.clearedValue, '')
  assert.strictEqual(calls.error, undefined)
  assert.strictEqual(
    calls.toast,
    options.refreshReject || options.refreshThrow ? 'Comment posted. Refresh the page to see it.' : 'Comment posted.'
  )
}

verifyCompiledAttachmentFacet()
  .then(() => verifyCommentOperation())
  .then(() => verifyCommentOperation({ refreshReject: true }))
  .then(() => verifyCommentOperation({ refreshThrow: true }))
  .then(() => verifyCommentOperation({ actionReject: true }))
  .then(() => console.log('IDTS-116 SAP-standard collaboration UI checks passed.'))
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
