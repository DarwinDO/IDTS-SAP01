const fs = require('fs')
const path = require('path')
const assert = require('assert')
const vm = require('vm')
const cds = require('@sap/cds')
require('@cap-js/attachments')

const root = path.resolve(__dirname, '..', '..')

function read (relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function exists (relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

const controller = read('app/bug-management-ui/webapp/ext/sections/BugCollaboration.js')
const commentsFragment = read('app/bug-management-ui/webapp/ext/fragment/CommentsSection.fragment.xml')
const manifest = read('app/bug-management-ui/webapp/manifest.json')
const annotations = read('app/bug-management-ui/annotations/object-page.cds')
const routerXsApp = read('app/router/xs-app.json')
const uiXsApp = read('app/bug-management-ui/xs-app.json')
const uiPackage = JSON.parse(read('app/bug-management-ui/package.json'))
const uiManifest = JSON.parse(manifest)

assert(controller.includes('BugService.addComment(...)'), 'Comment must use the bound OData V4 action path')
assert(controller.includes('.setParameter("content", content)'), 'Comment must set the bound action parameter')
assert(controller.includes('.setParameter("mentionedUserIDs", mentionedUserIDs)'), 'Comment must send selected UUIDs separately from text')
assert(controller.includes('BugService.getMentionCandidates(...)'), 'Mention picker must load candidates through the Bug-bound server operation')
assert(commentsFragment.includes('modelContextChange'), 'Mention candidates must refresh for the current Bug context')
assert(controller.includes('operation.invoke("$direct")'), 'UI5 1.148 bound mention function must use invoke, not deprecated execute')
assert(!controller.includes('operation.execute("$direct")'), 'Mention function must not use deprecated execute')
assert(!controller.includes('loadItems'), 'MultiComboBox must not use unsupported loadItems')
assert(/\.invoke\(|\.execute\(/.test(controller), 'Comment must invoke the action through OData V4 model APIs')
assert(controller.includes('operation.invoke("$auto")'), 'Comment action must use the model update group so UI5 can manage CSRF through the OData batch lifecycle')
assert(controller.includes('idtsCommentsFeed'), 'Comment success must refresh the comments feed, not the complete Object Page context')
assert(controller.includes('getBinding("items")'), 'Comment refresh must use the public list binding API')
assert(controller.includes('requestRefresh("$direct")'), 'Comment refresh must use the Promise-returning OData V4 requestRefresh API')
assert(commentsFragment.includes('$$ownRequest: true'), 'The relative comments list binding must own its request before requestRefresh() is supported')
assert(commentsFragment.includes('idtsMentionRecipients'), 'Comments must expose a visible mention recipient picker')
assert(commentsFragment.includes('MultiComboBox'), 'Mention picker must use a native multi-selection control')
assert(commentsFragment.includes('commentsMentionRecipientsLabel'), 'Mention picker needs a visible localized label')
assert(!controller.includes('new XMLHttpRequest()'), 'Collaboration writes must not use raw XMLHttpRequest')
assert(!controller.includes('pendingCreateAttachmentsByBugId'), 'Custom browser-memory attachment queue must be retired')
assert(!controller.includes('BugService.draftEdit'), 'Attachment handling must not manually orchestrate draftEdit')
assert(!controller.includes('BugService.draftActivate'), 'Attachment handling must not manually orchestrate draftActivate')
assert(!controller.includes('onAttachmentSelected'), 'Custom attachment upload handler must be retired')

assert(!manifest.includes('IdtsAttachmentsCustom'), 'Manifest must not register the custom attachment section')
assert(!manifest.includes('AttachmentsSection.fragment'), 'Manifest must use the generated attachment facet')
assert(!exists('app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml'), 'Retired custom attachment fragment must be removed')
assert(!annotations.includes("Target : 'attachments/@UI.LineItem'"), 'Application annotations must not compete with the attachment plugin-owned facet')
assert(!uiManifest['sap.ui5']?.routing?.targets?.BugObjectPage?.options?.settings?.controlConfiguration?.['attachments/@com.sap.vocabularies.UI.v1.LineItem'], 'Manifest must not override the attachment plugin-owned table configuration')

assert(routerXsApp.includes('"csrfProtection": true'), 'AppRouter OData route must keep CSRF protection enabled')
assert(uiXsApp.includes('"csrfProtection": true'), 'UI OData route must keep CSRF protection enabled')
assert(routerXsApp.includes('index\\\\.html|manifest\\\\.json|Component\\\\.js|Component-preload\\\\.js'), 'AppRouter must route HTML5 entry assets through an explicit cache-control rule')
assert(routerXsApp.includes('"cacheControl": "no-cache, no-store, must-revalidate"'), 'HTML5 entry assets must be revalidated after app-content rollout')
assert.strictEqual(uiManifest['sap.app'].applicationVersion.version, uiPackage.version, 'UI manifest and package versions must stay aligned for HTML5 app-content cache invalidation')
assert.notStrictEqual(uiPackage.version, '0.0.1', 'Changed HTML5 app content must not reuse the original 0.0.1 application version')

async function verifyCompiledAttachmentFacet () {
  const model = await cds.load('*')
  cds.compile.to.edmx(model, { service: 'BugService' })
  const bugs = model.definitions['BugService.Bugs']
  const facets = bugs && bugs['@UI.Facets'] ? bugs['@UI.Facets'] : []
  const attachmentFacets = facets.filter(facet =>
    facet && facet.Target === 'attachments/@UI.LineItem'
  )

  assert.strictEqual(attachmentFacets.length, 1, 'Compiled BugService metadata must expose exactly one attachment facet')
  assert.strictEqual(attachmentFacets[0].ID, 'attachments_attachments', 'Compiled metadata must use the attachment plugin-owned facet ID')

  const attachmentEntity = model.definitions[bugs.elements.attachments.target]
  assert(attachmentEntity, 'Compiled model must expose the plugin-managed attachment entity')
  assert.strictEqual(
    attachmentEntity.elements.content['@Core.ContentDisposition.Type'],
    'attachment',
    'Attachment content must force a browser download instead of opening an inline preview tab'
  )
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
  const mentionPicker = {
    getId: () => 'view--idtsMentionRecipients',
    getSelectedKeys: () => ['00000000-0000-4000-8000-000000000002'],
    setSelectedKeys: value => { calls.clearedMentionKeys = value },
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
    getAggregation: name => name === 'content' ? [textArea, mentionPicker, commentsFeed] : null,
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
            { show: message => { calls.toast = message } },
            { constructor: function () {} }
          );
        }
      }
    }
  }

  vm.runInNewContext(controller, sandbox)
  module.onAddComment({ getSource: () => source })
  await new Promise(resolve => setTimeout(resolve, 0))

  assert.strictEqual(calls.path, bugContext.getPath() + '/BugService.addComment(...)')
  assert.deepStrictEqual(calls.parameters, { content: 'verified comment', mentionedUserIDs: ['00000000-0000-4000-8000-000000000002'] })
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
  assert.deepStrictEqual(Array.from(calls.clearedMentionKeys), [])
  assert.strictEqual(calls.error, undefined)
  assert.strictEqual(
    calls.toast,
    options.refreshReject || options.refreshThrow ? 'Comment posted. Refresh the page to see it.' : 'Comment posted.'
  )
}

async function verifyMentionContextRace () {
  let module
  const operations = []
  const modelStore = {}
  const selectedKeyCalls = []
  const busyCalls = []
  let currentContext
  let resolveA
  let resolveB
  const candidateA = new Promise(resolve => { resolveA = resolve })
  const candidateB = new Promise(resolve => { resolveB = resolve })
  const model = {
    bindContext: path => {
      const deferred = path.includes('00000000-0000-0000-0000-000000000001') ? candidateA : candidateB
      const operation = {
        invoke: groupId => {
          assert.strictEqual(groupId, '$direct', 'mention candidate function uses its own read group')
          return Promise.resolve()
        },
        getBoundContext: () => ({ requestObject: () => deferred })
      }
      operations.push({ path, operation })
      return operation
    }
  }
  function JSONModel (initial) {
    this.values = initial
  }
  JSONModel.prototype.setProperty = function (path, value) {
    this.values[path.slice(1)] = value
  }
  JSONModel.prototype.getProperty = function (path) {
    return this.values[path.slice(1)]
  }
  const picker = {
    getModel: name => name ? modelStore[name] : model,
    setModel: (value, name) => { modelStore[name] = value },
    getBindingContext: () => currentContext,
    data: (key, value) => value === undefined ? picker.dataValues[key] : (picker.dataValues[key] = value),
    dataValues: {},
    setSelectedKeys: value => { selectedKeyCalls.push(Array.from(value)) },
    setBusy: value => { busyCalls.push(value) }
  }
  const contextA = { getPath: () => '/Bugs(ID=00000000-0000-0000-0000-000000000001,IsActiveEntity=true)' }
  const contextB = { getPath: () => '/Bugs(ID=00000000-0000-0000-0000-000000000002,IsActiveEntity=true)' }
  const sandbox = {
    window: { Promise },
    Intl,
    Date,
    sap: {
      ui: {
        define: (dependencies, factory) => {
          module = factory({ error: () => {} }, { show: () => {} }, JSONModel)
        }
      }
    }
  }

  vm.runInNewContext(controller, sandbox)
  currentContext = contextA
  module.onMentionContextChanged({ getSource: () => picker })
  assert.deepStrictEqual(selectedKeyCalls, [[]], 'context A immediately clears stale recipient selections')
  assert.strictEqual(busyCalls.at(-1), true, 'context A starts its own busy state')

  currentContext = contextB
  module.onMentionContextChanged({ getSource: () => picker })
  assert.deepStrictEqual(selectedKeyCalls, [[], []], 'context B immediately clears A selections')
  assert.strictEqual(operations.length, 2, 'each Bug context creates one bound candidate operation')

  resolveA([{ ID: '00000000-0000-0000-0000-000000000010', displayName: 'Old A', roleCode: 'TESTER' }])
  await new Promise(resolve => setImmediate(resolve))
  assert.deepStrictEqual(Array.from(modelStore.mentionRecipients.getProperty('/items')), [], 'stale Bug A response cannot populate Bug B')
  assert.strictEqual(busyCalls.at(-1), true, 'stale Bug A completion cannot clear Bug B busy state')

  resolveB([{ ID: '00000000-0000-0000-0000-000000000020', displayName: 'Current B', roleCode: 'DEVELOPER' }])
  await new Promise(resolve => setImmediate(resolve))
  assert.deepStrictEqual(JSON.parse(JSON.stringify(modelStore.mentionRecipients.getProperty('/items'))), [{ ID: '00000000-0000-0000-0000-000000000020', displayName: 'Current B', roleCode: 'DEVELOPER' }], 'current Bug B response populates its picker')
  assert.strictEqual(busyCalls.at(-1), false, 'current Bug B completion clears only its busy state')
}

verifyCompiledAttachmentFacet()
  .then(() => verifyCommentOperation())
  .then(() => verifyCommentOperation({ refreshReject: true }))
  .then(() => verifyCommentOperation({ refreshThrow: true }))
  .then(() => verifyCommentOperation({ actionReject: true }))
  .then(() => verifyMentionContextRace())
  .then(() => console.log('IDTS-116 SAP-standard collaboration UI checks passed.'))
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
