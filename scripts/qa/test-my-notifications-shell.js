'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const root = path.resolve(__dirname, '../..')
const moduleFile = path.join(root, 'app/bug-management-ui/webapp/ext/notification/NotificationShell.js')

class FakeControl {
  constructor (settings = {}) {
    Object.assign(this, settings)
    this.settings = settings
    this.items = settings.items || []
    this.content = settings.content || []
    this.customData = settings.customData || []
    this.classes = []
    this.destroyed = false
    this.pressHandler = settings.press
    this.selectionHandler = settings.selectionChange
  }

  addStyleClass (name) { this.classes.push(name); return this }
  addItem (item) { this.items.push(item); return this }
  addContent (item) { this.content.push(item); return this }
  addCustomData (item) { this.customData.push(item); return this }
  attachPress (handler) { this.pressHandler = handler; return this }
  attachSelectionChange (handler) { this.selectionHandler = handler; return this }
  attachAfterClose (handler) { this.afterCloseHandler = handler; return this }
  attachEvent (name, handler) { this.events = this.events || {}; this.events[name] = handler; return this }
  firePress () { return this.pressHandler && this.pressHandler({ getSource: () => this }) }
  fireSelectionChange () { return this.selectionHandler && this.selectionHandler({ getSource: () => this }) }
  getSelectedKey () { return this.selectedKey || this.settings.selectedKey }
  setSelectedKey (key) { this.selectedKey = key; return this }
  setText (text) { this.text = text; return this }
  setTooltip (tooltip) { this.tooltip = tooltip; return this }
  setVisible (value) { this.visible = value; return this }
  setBusy (value) { this.busy = value; return this }
  setValueState (value) { this.valueState = value; return this }
  setValueStateText (value) { this.valueStateText = value; return this }
  setEnabled (value) { this.enabled = value; return this }
  setValue (value) { this.value = value; return this }
  removeAllItems () { this.items = []; return this }
  destroyItems () { this.items = []; return this }
  removeAllContent () { this.content = []; return this }
  openBy (source) { this.openedBy = source; this.isOpen = true; return this }
  close () { this.isOpen = false; this.afterCloseHandler && this.afterCloseHandler(); return this }
  placeAt (host) { host.controls = host.controls || []; host.controls.push(this); this.host = host; return this }
  destroy () { this.destroyed = true; return this }
  focus () { this.focused = true; return this }
  getItems () { return this.items }
}

function control (name, globals) {
  globals.created[name] = []
  return class extends FakeControl {
    constructor (settings) { super(settings); globals.created[name].push(this) }
  }
}

function loadShell (client, globals) {
  let shell
  const classes = {
    'sap/m/Toolbar': control('Toolbar', globals),
    'sap/m/ToolbarSpacer': control('ToolbarSpacer', globals),
    'sap/m/Button': control('Button', globals),
    'sap/m/ResponsivePopover': control('ResponsivePopover', globals),
    'sap/m/VBox': control('VBox', globals),
    'sap/m/HBox': control('HBox', globals),
    'sap/m/Select': control('Select', globals),
    'sap/m/SegmentedButton': control('SegmentedButton', globals),
    'sap/m/SegmentedButtonItem': control('SegmentedButtonItem', globals),
    'sap/m/List': control('List', globals),
    'sap/m/CustomListItem': control('CustomListItem', globals),
    'sap/m/ObjectStatus': control('ObjectStatus', globals),
    'sap/m/MessageStrip': control('MessageStrip', globals),
    'sap/m/Text': control('Text', globals),
    'sap/m/Label': control('Label', globals),
    'sap/m/BadgeCustomData': control('BadgeCustomData', globals),
    'sap/ui/core/Item': control('Item', globals),
    'sap/ui/core/Icon': control('Icon', globals),
    'sap/ui/core/InvisibleMessage': { getInstance: () => ({ announce: message => { globals.announcements.push(message) } }) },
    'sap/ui/core/library': { InvisibleMessageMode: { Polite: 'Polite' } },
    'sap/ui/core/format/DateFormat': { getDateTimeInstance: () => ({ format: value => `formatted:${value}` }) },
    'sap/ui/Device': { system: { phone: false } },
    'idts/bugmanagementui/ext/notification/NotificationClient': client
  }
  const context = {
    sap: { ui: { define: (deps, factory) => { globals.loadedDeps = deps; shell = factory(...deps.map(dep => classes[dep])) } } },
    document: globals.document,
    window: globals.window,
    setInterval: globals.setInterval,
    clearInterval: globals.clearInterval,
    setTimeout,
    clearTimeout,
    Date,
    Promise,
    console
  }
  vm.runInNewContext(fs.readFileSync(moduleFile, 'utf8'), context)
  return shell
}

function row (index, readAt = null) {
  return {
    notificationID: `11111111-1111-4111-8111-${String(index).padStart(12, '0')}`,
    category: index % 2 ? 'BUG' : 'ACCESS',
    eventType: 'ASSIGNED',
    title: `Notification ${index}`,
    summary: 'Safe summary',
    priority: index === 1 ? 'CRITICAL' : 'NORMAL',
    actionRequired: index === 1,
    occurredAt: `2026-08-27T01:${String(index % 60).padStart(2, '0')}:00.000Z`,
    readAt,
    targetPath: '/idtsbugmanagementui/index.html#/Bugs(ID=11111111-1111-4111-8111-000000000001,IsActiveEntity=true)',
    modifiedAt: '2026-08-27T01:02:03.1234567Z'
  }
}

async function main () {
  assert.ok(fs.existsSync(moduleFile), 'NotificationShell must exist')
  const calls = { search: [], unread: 0, markRead: [], markAll: [] }
  let resolveSearch
  let holdMarkAll = false
  let releaseMarkAll
  const client = {
    search: async (model, options) => {
      calls.search.push(options)
      if (resolveSearch) return resolveSearch()
      return Array.from({ length: 25 }, (_, index) => row(index + 1))
    },
    unreadCount: async () => { calls.unread += 1; return 120 },
    markRead: async (model, notification) => { calls.markRead.push(notification); throw new Error('private backend detail') },
    markAllRead: async (model, throughOccurredAt) => {
      calls.markAll.push(throughOccurredAt)
      if (holdMarkAll) return new Promise(resolve => { releaseMarkAll = resolve })
      return 25
    },
    safeTargetPath: pathValue => pathValue === row(1).targetPath ? pathValue : null
  }
  const globals = {
    announcements: [],
    created: {},
    document: {
      visibilityState: 'visible',
      addEventListener: (name, handler) => { globals.document[name] = handler },
      removeEventListener: (name, handler) => { assert.equal(globals.document[name], handler); delete globals.document[name] },
      getElementById: id => id === 'idtsNotificationShellHost' ? host : null
    },
    window: {
      location: { hash: '' },
      addEventListener: (name, handler) => { globals.window[name] = handler },
      removeEventListener: (name, handler) => { assert.equal(globals.window[name], handler); delete globals.window[name] }
    },
    timers: [],
    setInterval: (handler, delay) => { globals.timers.push({ handler, delay }); return globals.timers.length },
    clearInterval: id => { globals.timers[id - 1].cleared = true }
  }
  const host = { dataset: {}, controls: [] }
  const shellModule = loadShell(client, globals)
  assert.ok(globals.loadedDeps.includes('sap/ui/core/library'), 'use the real UI5 core library export for InvisibleMessageMode')
  assert.ok(!globals.loadedDeps.includes('sap/ui/core/InvisibleMessageMode'), 'do not depend on a nonexistent UI5 module')
  const model = {}
  const bundle = { getText: (key, args) => args ? `${key}:${args.join(',')}` : key }
  const component = { getModel: name => name === 'notifications' ? model : name === 'i18n' ? { getResourceBundle: () => Promise.resolve(bundle) } : null }

  const first = shellModule.init(component)
  assert.equal(shellModule.init(component), first, 'init is idempotent per component')
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(host.controls.length, 1, 'shell creates one toolbar')
  const toolbar = host.controls[0]
  const bell = toolbar.content.find(item => item.icon === 'sap-icon://bell')
  assert.ok(bell, 'bell uses native Button')
  assert.equal(bell.type, 'Transparent')
  assert.ok(bell.classes.includes('sapUiLargeMarginEnd'))
  assert.equal(toolbar.content.at(-1), bell, 'bell stays at the right edge of the native toolbar')
  assert.equal(globals.timers[0].delay, 30000, 'visible count polling is 30 seconds')

  await first.refreshUnread()
  assert.equal(calls.unread, 2)
  assert.equal(bell.text, '', 'bell remains icon-only')
  assert.equal(globals.created.BadgeCustomData[0].value, '99+', 'native badge caps counts above 99')
  assert.match(bell.tooltip, /notification/i)

  bell.firePress()
  await new Promise(resolve => setImmediate(resolve))
  const popover = globals.created.ResponsivePopover[0]
  assert.ok(popover && popover.isOpen, 'bell opens native ResponsivePopover')
  assert.equal(calls.search[0].category, 'ALL')
  assert.equal(calls.search[0].readState, 'ALL')
  assert.equal(calls.search[0].skip, 0)
  assert.equal(calls.search[0].top, 25)
  const list = popover.content[0].items.find(item => item.settings && item.settings.mode === 'None')
  assert.equal(list.items.length, 25, 'first page is 25 rows')
  assert.ok(list.items[0].content[0].items[0].items.some(item => item.text === 'notificationUnread'), 'unread state has a literal marker')
  assert.ok(globals.created.Icon.some(icon => icon.src === 'sap-icon://bug'), 'Bug rows render a category icon')
  assert.ok(list.items[0].content[0].items[0].items.some(item => item.text === 'notificationEventASSIGNED'), 'rows render the localized event type')

  const countBeforeSignal = calls.unread
  globals.window['idts:notification-change']()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(calls.unread, countBeforeSignal + 1, 'relevant Bug action signal refreshes unread count immediately')

  const markAll = popover.content[0].items[0].content.find(item => item.text === 'notificationMarkAllRead')
  assert.ok(markAll, 'mark all control is present')
  markAll.firePress()
  await new Promise(resolve => setImmediate(resolve))
  markAll.firePress()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(calls.markAll.length, 2)
  assert.equal(calls.markAll[0], calls.markAll[1], 'mark-all uses frozen first-page snapshot')

  holdMarkAll = true
  markAll.firePress()
  resolveSearch = () => [{ ...row(99), occurredAt: '2099-01-01T00:00:00.000Z' }]
  const loadMore = popover.content[0].items.find(item => item.text === 'notificationLoadMore')
  loadMore.firePress()
  await new Promise(resolve => setImmediate(resolve))
  releaseMarkAll(25)
  await new Promise(resolve => setImmediate(resolve))
  const futureStatuses = list.items.at(-1).content[0].items[0].items
  assert.ok(futureStatuses.some(item => item.text === 'notificationUnread'), 'mark-all response does not mark a post-snapshot arrival read locally')

  globals.document.visibilityState = 'hidden'
  const countBeforeHiddenPoll = calls.unread
  globals.timers[0].handler()
  assert.equal(calls.unread, countBeforeHiddenPoll, 'hidden polling does not request a count')
  first.destroy()
  assert.equal(globals.timers[0].cleared, true)
  assert.equal(host.controls[0].destroyed, true)
  assert.equal(globals.document.visibilitychange, undefined)
  assert.equal(globals.window['idts:notification-change'], undefined)
  console.log('IDTS My Notifications shell contract: PASS')
}

main().catch(error => { console.error(error); process.exitCode = 1 })
