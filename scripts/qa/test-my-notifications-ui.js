'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const root = path.resolve(__dirname, '../..')
const app = path.join(root, 'app/bug-management-ui/webapp')
const moduleFile = path.join(app, 'ext/notification/NotificationClient.js')

async function main () {
  assert.ok(fs.existsSync(moduleFile), 'NotificationClient must implement the approved OData contract')
  let client
  vm.runInNewContext(fs.readFileSync(moduleFile, 'utf8'), { sap: { ui: { define: (_, factory) => { client = factory() } } } })
  const manifest = JSON.parse(fs.readFileSync(path.join(app, 'manifest.json')))
  assert.equal(manifest['sap.app'].dataSources.notificationService.uri, '/odata/v4/notification/')
  assert.equal(manifest['sap.ui5'].models.notifications.dataSource, 'notificationService')
  assert.equal(manifest['sap.ui5'].models.notifications.settings.operationMode, 'Server')
  assert.equal(manifest['sap.ui5'].models.notifications.preload, false)
  assert.notEqual(manifest['sap.ui5'].models.notifications.settings.earlyRequests, true)
  assert.equal(manifest['sap.app'].applicationVersion.version, '0.0.11')
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'app/bug-management-ui/package.json'))).version, '0.0.11')
  const appLock = JSON.parse(fs.readFileSync(path.join(root, 'app/bug-management-ui/package-lock.json')))
  assert.equal(appLock.version, '0.0.11')
  assert.equal(appLock.packages[''].version, '0.0.11')
  const index = fs.readFileSync(path.join(app, 'index.html'), 'utf8')
  assert.match(index, /id="idtsNotificationShellHost"/)
  assert.doesNotMatch(fs.readFileSync(path.join(app, 'css/idts-shell.css'), 'utf8'), /idtsNotification/i, 'notification shell adds no custom CSS')
  const bundleFiles = ['i18n.properties', 'i18n_en.properties', 'i18n_vi.properties'].map(name => fs.readFileSync(path.join(app, 'i18n', name), 'utf8'))
  const keySet = content => new Set(content.split(/\r?\n/).filter(line => /^notification[A-Z]/.test(line)).map(line => line.split('=')[0]))
  assert.deepEqual([...keySet(bundleFiles[0])].sort(), [...keySet(bundleFiles[1])].sort())
  assert.deepEqual([...keySet(bundleFiles[0])].sort(), [...keySet(bundleFiles[2])].sort())
  assert.ok(bundleFiles.every(content => !content.includes('\uFFFD')), 'bundles contain no replacement character')

  let resolveInvoke
  let invoked = false
  let destroyed = 0
  let boundPath
  let parameters = {}
  let payload = { value: [{ notificationID: 'first' }, { notificationID: 'second' }] }
  let rejectCall = false
  const model = { bindContext: name => {
    boundPath = name
    parameters = {}
    return {
      setParameter: (key, value) => { parameters[key] = value },
      invoke: group => { assert.equal(group, '$direct'); invoked = true; return rejectCall ? Promise.reject(new Error('private backend detail')) : new Promise(resolve => { resolveInvoke = resolve }) },
      getBoundContext: () => ({ requestObject: async () => payload }),
      destroy: () => { destroyed++ }
    }
  } }
  let settled = false
  const pending = client.search(model, {}).then(rows => { settled = true; return rows })
  await Promise.resolve()
  assert.equal(invoked, true)
  assert.equal(settled, false, 'must await OData completion, not only submission')
  assert.equal(boundPath, '/searchMyNotifications(...)')
  assert.deepEqual(parameters, { category: 'ALL', readState: 'ALL', skip: 0, top: 25 })
  resolveInvoke()
  assert.equal((await pending)[1].notificationID, 'second', 'preserve server order')
  assert.equal(destroyed, 1)
  payload = [{ notificationID: 'direct-first' }, { notificationID: 'direct-second' }]
  const direct = client.search(model, {})
  resolveInvoke()
  assert.equal((await direct)[1].notificationID, 'direct-second', 'accept a collection returned directly by requestObject')
  for (const options of [{ top: 101 }, { top: 0 }, { skip: 10001 }, { skip: -1 }, { skip: 1.5 }, { category: 'OTHER' }, { readState: 'OTHER' }]) {
    await assert.rejects(() => client.search(model, options))
  }
  payload = { count: 120 }
  const count = client.unreadCount(model)
  resolveInvoke()
  assert.equal(await count, 120)
  assert.equal(boundPath, '/getMyUnreadNotificationCount(...)')
  const row = { notificationID: '11111111-1111-4111-8111-111111111111', modifiedAt: '2026-08-27T01:02:03.1234567Z', readAt: null }
  payload = { ...row, readAt: '2026-08-27T02:00:00.000Z' }
  const mark = client.markRead(model, row)
  assert.equal(parameters.expectedModifiedAt, row.modifiedAt, 'preserve server precision for optimistic version')
  resolveInvoke()
  assert.equal((await mark).readAt, payload.readAt)
  assert.equal(boundPath, '/markMyNotificationRead(...)')
  payload = { count: 1 }
  const markAll = client.markAllRead(model, '2026-08-27T01:00:00.000Z')
  assert.deepEqual(parameters, { throughOccurredAt: '2026-08-27T01:00:00.000Z' })
  resolveInvoke()
  assert.equal(await markAll, 1)
  await assert.rejects(() => client.markAllRead(model, 'bad-date'))
  await assert.rejects(() => client.markRead(model, { ...row, notificationID: '../../private' }))
  rejectCall = true
  const before = destroyed
  await assert.rejects(() => client.unreadCount(model), error => !error.message.includes('private backend detail'))
  assert.equal(destroyed, before + 1, 'failed operation must release its binding')

  const landing = '/idtsbugmanagementui/index.html'
  const target = landing + '#/Bugs(ID=11111111-1111-4111-8111-111111111111,IsActiveEntity=true)'
  assert.equal(client.safeTargetPath(landing), landing)
  assert.equal(client.safeTargetPath(target), target)
  for (const unsafe of ['https://evil.test/', '//evil.test/', 'javascript:alert(1)', landing + '?redirect=https://evil.test', landing + '#/Bugs(ID=x,IsActiveEntity=false)', '/idtsuseradministrationui/index.html', '/odata/v4/bug/', landing + '/..', target + '\n']) {
    assert.equal(client.safeTargetPath(unsafe), null, 'reject non-allowlisted route')
  }
  let componentDefinition
  const order = []
  const AppComponent = { prototype: { init: () => order.push('base'), exit: () => order.push('base-exit') }, extend: (_, definition) => { componentDefinition = definition; return definition } }
  const modules = {
    'sap/fe/core/AppComponent': AppComponent,
    'sap/ui/model/json/JSONModel': function () {},
    'idts/bugmanagementui/ext/login/LoginController': { getUser: () => ({ role_code: 'TESTER' }) },
    'idts/bugmanagementui/ext/login/ProfileShell': { init: () => order.push('profile') },
    'idts/bugmanagementui/ext/notification/NotificationShell': { init: () => { order.push('notification'); return { destroy: () => order.push('destroy') } } }
  }
  vm.runInNewContext(fs.readFileSync(path.join(app, 'Component.js'), 'utf8'), { sap: { ui: { define: (dependencies, factory) => factory(...dependencies.map(name => modules[name])) } } })
  const instance = { setModel () {} }
  componentDefinition.init.call(instance)
  assert.deepEqual(order, ['base', 'profile', 'notification'], 'shell starts only after base model initialization')
  componentDefinition.exit.call(instance)
  assert.deepEqual(order.slice(-2), ['destroy', 'base-exit'], 'component teardown releases notification timers and listeners')
  const smartAssignSource = fs.readFileSync(path.join(app, 'ext/actions/SmartAssignDeveloper.js'), 'utf8')
  assert.match(smartAssignSource, /idts:notification-change/, 'successful assignment signals an immediate unread refresh')
  console.log('IDTS My Notifications UI client contract: PASS')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
