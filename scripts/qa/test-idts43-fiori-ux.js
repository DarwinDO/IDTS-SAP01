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

  const actions = read(path.join('annotations', 'actions.cds'))
  assert(actions.includes("Label  : 'Reopen Bug for Further Work'"))
  assert(actions.includes("@Common.Label : 'Reason for Reopening'"))
  pass('Reopen action and reason wording are explicit')

  const manifest = JSON.parse(read(path.join('webapp', 'manifest.json')))
  const listSettings = manifest['sap.ui5'].routing.targets.BugsList.options.settings
  const createAction = listSettings.content.header.actions.CreateBug
  assert.strictEqual(createAction.press, 'idts.bugmanagementui.ext.actions.BugListActions.createBug')
  assert.strictEqual(createAction.visible, 'idts.bugmanagementui.ext.actions.BugListActions.isCreateVisible')
  const sections = manifest['sap.ui5'].routing.targets.BugsObjectPage.options.settings.content.body.sections
  assert(sections.History, 'custom History section is missing')
  assert(!sections.HistoryTimeline, 'old HistoryTimeline section key must be removed')
  pass('manifest contains supported Create action and one custom History section')

  let roleCode = null
  let actionModule
  const sandbox = {
    Error,
    Promise,
    sap: {
      ui: {
        define(dependencies, factory) {
          actionModule = factory({
            getUser() {
              return roleCode ? { role_code: roleCode } : null
            }
          })
        }
      }
    }
  }
  vm.runInNewContext(read(path.join('webapp', 'ext', 'actions', 'BugListActions.js')), sandbox)

  roleCode = 'DEVELOPER'
  assert.strictEqual(actionModule.isCreateVisible(), false)
  await assert.rejects(() => actionModule.createBug.call({}), /not allowed/)
  pass('Developer does not see or invoke Create Bug')

  roleCode = 'TESTER'
  assert.strictEqual(actionModule.isCreateVisible(), true)
  roleCode = 'PM'
  assert.strictEqual(actionModule.isCreateVisible(), true)
  pass('Tester and PM see Create Bug')

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

  console.log('\nIDTS-43 Fiori UX checks: 11 PASS / 0 FAIL')
}

main().catch(error => {
  console.error('IDTS-43 Fiori UX checks: FAIL')
  console.error(error?.stack || error)
  process.exitCode = 1
})
