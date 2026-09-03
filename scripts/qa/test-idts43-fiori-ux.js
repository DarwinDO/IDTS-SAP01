/** IDTS-43 static contract and custom-action unit verification. */

'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const ROOT = process.cwd()
const APP = path.join(ROOT, 'app', 'bug-management-ui')

function read(relativePath) {
  return fs.readFileSync(path.join(APP, relativePath), 'utf8')
}

function pass(label) {
  pass.count = (pass.count || 0) + 1
  console.log(`  PASS  ${label}`)
}

async function main() {
  const valueHelps = read(path.join('annotations', 'value-helps.cds'))
  for (const field of ['priority', 'severity', 'environment']) {
    const pattern = new RegExp(`Bugs:${field}\\.code with @Common\\.ValueListWithFixedValues\\s*:\\s*true`)
    assert(pattern.test(valueHelps), `${field} must use a fixed value list`)
    pass(`${field} uses Common.ValueListWithFixedValues`)
  }

  const capabilities = read(path.join('annotations', 'capabilities.cds'))
  assert(capabilities.includes('UI.CreateHidden : true'), 'standard Create must be hidden')
  pass('standard Fiori Create is hidden by annotation')

  const objectPage = read(path.join('annotations', 'object-page.cds'))
  assert(!objectPage.includes("Target : 'historyEvents/@UI.LineItem'"), 'raw History facet must be removed')
  pass('raw History table facet is removed')

  const historyTimeline = read(path.join('webapp', 'ext', 'fragment', 'HistoryTimeline.fragment.xml'))
  assert(!historyTimeline.includes('groupedChangeContext'), 'groupedChangeContext must not be rendered as a default timeline text row')
  pass('History timeline hides grouped field-change context by default')

  const actions = read(path.join('annotations', 'actions.cds'))
  assert(actions.includes("Label  : 'Reopen Bug for Further Work'"))
  assert(actions.includes("@Common.Label : 'Reason for Reopening'"))
  pass('Reopen action and reason wording are explicit')

  const manifest = JSON.parse(read(path.join('webapp', 'manifest.json')))
  const appPackage = JSON.parse(read('package.json'))
  const appPackageLock = JSON.parse(read('package-lock.json'))
  assert.strictEqual(appPackage.version, '0.0.10', 'My Notifications compact Bug title fix must advance the Bug Management HTML5 cache identity')
  assert.strictEqual(manifest['sap.app'].applicationVersion.version, appPackage.version)
  assert.strictEqual(appPackageLock.version, appPackage.version)
  assert.strictEqual(appPackageLock.packages[''].version, appPackage.version)
  pass('Bug Management package, lockfile, and manifest use the N2 cache identity')
  const bootstrap = read(path.join('webapp', 'bootstrap-ui5.js'))
  const loginPage = read(path.join('webapp', 'login.html'))
  assert(bootstrap.includes('script.setAttribute("data-sap-ui-language", "en")'), 'deferred UI5 bootstrap must force English')
  assert(bootstrap.includes('script.setAttribute("data-sap-ui-ignore-url-params", "true")'), 'deferred UI5 bootstrap must ignore URL locale overrides')
  assert(loginPage.includes('data-sap-ui-language="en"'), 'login UI5 bootstrap must force English')
  assert(loginPage.includes('data-sap-ui-ignore-url-params="true"'), 'login UI5 bootstrap must ignore URL locale overrides')
  pass('all runtime UI5 bootstraps force English framework text')

  const listSettings = manifest['sap.ui5'].routing.targets.BugsList.options.settings
  const createAction = listSettings.content.header.actions.CreateBug
  assert.strictEqual(createAction.press, 'idts.bugmanagementui.ext.actions.BugListActions.createBug')
  assert.strictEqual(createAction.visible, '{session>/canCreateBug}')
  assert.strictEqual(createAction.enabled, '{session>/canCreateBug}')
  const component = read(path.join('webapp', 'Component.js'))
  assert(component.includes('new JSONModel({'), 'Component must initialize an observable session model')
  assert(component.includes('canCreateBug: Boolean(user && user.role_code === "TESTER")'))
  assert(component.includes('canAdministerUsers: Boolean(user && user.canAdministerUsers === true)'), 'Component must expose the safe UserAdmin capability in session state')
  assert(component.includes('this.setModel(sessionModel, "session")'))
  const sections = manifest['sap.ui5'].routing.targets.BugsObjectPage.options.settings.content.body.sections
  assert(sections.History, 'custom History section is missing')
  assert(!sections.HistoryTimeline, 'old HistoryTimeline section key must be removed')
  pass('manifest binds Create visibility to an observable session model')

  const userAdministrationAction = listSettings.content.header.actions.UserAdministration
  assert(userAdministrationAction, 'User Administration header action is missing')
  assert.strictEqual(userAdministrationAction.press, 'idts.bugmanagementui.ext.actions.BugListActions.openUserAdministration')
  assert.strictEqual(userAdministrationAction.visible, '{session>/canAdministerUsers}')
  assert.strictEqual(userAdministrationAction.enabled, '{session>/canAdministerUsers}')
  assert.strictEqual(userAdministrationAction.text, '{i18n>userAdministrationOpenAction}')
  assert(!Object.prototype.hasOwnProperty.call(userAdministrationAction, 'tooltip'), 'User Administration action must not invent unsupported tooltip metadata')
  pass('manifest binds User Administration visibility and enablement to the safe capability')

  let controlledUser = null
  let navigationCalls = []
  let actionModule
  const sandbox = {
    Error,
    Promise,
    window: {
      location: {
        href: '/idtsbugmanagementui/index.html',
        assign(relativePath) {
          navigationCalls.push(relativePath)
        }
      },
      open() {
        throw new Error('new-window navigation is not supported')
      }
    },
    sap: {
      ui: {
        define(dependencies, factory) {
          actionModule = factory({
            getUser() {
              return controlledUser
            }
          })
        }
      }
    }
  }
  vm.runInNewContext(read(path.join('webapp', 'ext', 'actions', 'BugListActions.js')), sandbox)

  controlledUser = { role_code: 'DEVELOPER' }
  assert.strictEqual(actionModule.isCreateVisible(), false)
  await assert.rejects(() => actionModule.createBug.call({}), /not allowed/)
  pass('Developer does not see or invoke Create Bug')

  controlledUser = { role_code: 'TESTER' }
  assert.strictEqual(actionModule.isCreateVisible(), true)
  controlledUser = { role_code: 'PM' }
  assert.strictEqual(actionModule.isCreateVisible(), false)
  await assert.rejects(() => actionModule.createBug.call({}), /not allowed/)
  pass('Only Tester sees or invokes Create Bug')

  controlledUser = { role_code: 'TESTER' }
  const listBinding = { path: '/Bugs' }
  let createArguments
  const extensionActionContext = {
    _view: {
      getModel() {
        return {
          bindList(bindingPath) {
            assert.strictEqual(bindingPath, '/Bugs')
            return listBinding
          }
        }
      }
    },
    editFlow: {
      createDocument(binding, options) {
        createArguments = { binding, options }
        return Promise.resolve('created')
      }
    }
  }
  assert.strictEqual(await actionModule.createBug.call(extensionActionContext), 'created')
  assert.strictEqual(createArguments.binding, listBinding)
  assert.strictEqual(createArguments.options.creationMode, 'NewPage')
  pass('Create Bug works with the Fiori action runtime context')

  assert.throws(
    () => actionModule.createBug.call({ editFlow: {} }),
    /model is not available/
  )
  pass('Create Bug fails safely when the Fiori model is unavailable')

  controlledUser = { role_code: 'PM', canAdministerUsers: true }
  navigationCalls = []
  await actionModule.openUserAdministration.call({})
  assert.deepStrictEqual(navigationCalls, ['/idtsuseradministrationui/index.html'])
  assert(!/[?#]|returnTo|:\/\//.test(navigationCalls[0]))
  assert.strictEqual(sandbox.window.location.href, '/idtsbugmanagementui/index.html')
  pass('PM with UserAdmin navigates in the same tab to the exact relative User Administration path')

  for (const user of [
    null,
    {},
    { role_code: 'PM' },
    { role_code: 'PM', canAdministerUsers: false },
    { role_code: 'PM', canAdministerUsers: 1 },
    { role_code: 'PM', canAdministerUsers: 'true' }
  ]) {
    controlledUser = user
    navigationCalls = []
    await assert.rejects(() => actionModule.openUserAdministration.call({}), /not allowed/)
    assert.deepStrictEqual(navigationCalls, [])
  }
  pass('Missing, false, and non-Boolean UserAdmin capability values fail closed without navigation')

  console.log(`\nIDTS-43 Fiori UX checks: ${pass.count} PASS / 0 FAIL`)
}

main().catch(error => {
  console.error('IDTS-43 Fiori UX checks: FAIL')
  console.error(error?.stack || error)
  process.exitCode = 1
})
