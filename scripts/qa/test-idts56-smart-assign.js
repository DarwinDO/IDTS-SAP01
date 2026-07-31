/**
 * IDTS-56 smart assignment UI contract and backend validation checks.
 */

'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const Module = require('module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const cds = require('@sap/cds')

const ROOT = process.cwd()
const APP = path.join(ROOT, 'app', 'bug-management-ui')
const BUG1 = '90000000-0000-0000-0000-000000000001'
const COMPONENT_CATEGORY_1 = '60000000-0000-0000-0000-000000000001'
const DEV_DAT = '20000000-0000-0000-0000-000000000002'
const DEV_MISSING = '20000000-0000-0000-0000-000000009999'

let pass = 0
let fail = 0

function readApp(relativePath) {
  return fs.readFileSync(path.join(APP, relativePath), 'utf8')
}

function rec(label, ok, detail = '') {
  if (ok) {
    pass += 1
    console.log(`  PASS  ${label}${detail ? ' | ' + detail : ''}`)
  } else {
    fail += 1
    console.log(`  FAIL  ${label}${detail ? ' | ' + detail : ''}`)
  }
}

function assertHasAll(source, labels, fileLabel) {
  for (const label of labels) {
    assert(source.includes(label), `${fileLabel} is missing ${label}`)
  }
}

function makeControl(name) {
  return class {
    constructor(settings = {}) {
      this.name = name
      this.settings = settings
      this.models = {}
      this.isOpen = false
      this.isDestroyed = false
    }

    setModel(model, alias) {
      this.models[alias || ''] = model
      return this
    }

    bindItems(settings) {
      this.binding = settings
      return this
    }

    addStyleClass(styleClass) {
      this.styleClass = styleClass
      return this
    }

    setBusy(value) {
      this.busy = value
      return this
    }

    open() {
      this.isOpen = true
      makeControl.lastOpened = this
    }

    close() {
      this.isOpen = false
      if (this.settings.afterClose) this.settings.afterClose()
    }

    destroy() {
      this.isDestroyed = true
    }
  }
}

class JSONModel {
  constructor(data = {}) {
    this.data = data
  }

  getProperty(pathExpression) {
    return this.data[pathExpression.replace(/^\//, '')]
  }

  setProperty(pathExpression, value) {
    this.data[pathExpression.replace(/^\//, '')] = value
  }
}

class Filter {
  constructor(pathName, operator, value) {
    this.pathName = pathName
    this.operator = operator
    this.value = value
  }
}

function loadSmartAssignModule(roleCode, modelHooks = {}) {
  let actionModule
  const Control = makeControl('Control')
  const sandbox = {
    console,
    Error,
    Promise,
    setTimeout,
    sap: {
      ui: {
        define(dependencies, factory) {
          const resolved = dependencies.map(dependency => {
            if (dependency === 'sap/ui/model/json/JSONModel') return JSONModel
            if (dependency === 'sap/ui/model/Filter') return Filter
            if (dependency === 'sap/ui/model/FilterOperator') return { EQ: 'EQ' }
            if (dependency === 'sap/m/SearchField') return makeControl('SearchField')
            if (dependency === '../login/LoginController') {
              return {
                getUser() {
                  return roleCode ? { role_code: roleCode } : null
                }
              }
            }
            if (dependency === '../ai/AiReviewUi') {
              return {
                loading() {
                  return {
                    explanation: 'Preparing suggestion...',
                    meta: 'Review required',
                    state: 'Information',
                    warnings: '',
                    hasWarnings: false,
                    decisionHint: 'Review this suggestion and choose manually.'
                  }
                },
                unavailable() {
                  return {
                    explanation: 'Suggestion details are unavailable. Review the standard details before deciding.',
                    meta: 'Suggestion could not be prepared',
                    state: 'Warning',
                    warnings: '',
                    hasWarnings: false,
                    decisionHint: 'Review this suggestion and choose manually.'
                  }
                },
                decorateResult(row) {
                  return {
                    explanation: row.explanation,
                    meta: Number.isFinite(Number(row.confidence)) ? `Ready for review - confidence ${Math.round(Number(row.confidence) * 100)}%` : 'Review required',
                    state: row.warnings ? 'Warning' : 'Information',
                    warnings: row.warnings || '',
                    hasWarnings: Boolean(row.warnings),
                    decisionHint: 'Review this suggestion and choose manually.'
                  }
                }
              }
            }
            if (dependency === 'sap/m/MessageToast') return { show: message => { modelHooks.toast = message } }
            if (dependency === 'sap/m/MessageBox') return { error: message => { modelHooks.error = message } }
            return Control
          })
          actionModule = factory(...resolved)
        }
      }
    }
  }

  vm.runInNewContext(readApp(path.join('webapp', 'ext', 'actions', 'SmartAssignDeveloper.js')), sandbox)
  return actionModule
}

async function verifyStaticContract() {
  const manifest = JSON.parse(readApp(path.join('webapp', 'manifest.json')))
  const objectPageContent = manifest['sap.ui5'].routing.targets.BugsObjectPage.options.settings.content
  assert(!objectPageContent.header?.actions?.SmartAssignDeveloper)
  const smartAssignment = objectPageContent.body.sections.IdtsSmartAssignment
  assert.strictEqual(smartAssignment.template, 'idts.bugmanagementui.ext.fragment.SmartAssignmentSection')
  assert.strictEqual(smartAssignment.title, '{i18n>smartAssignmentSectionTitle}')
  rec('manifest wires Smart Assign through the Assignee custom section, not a header action', true)

  const objectPageAnnotations = readApp(path.join('annotations', 'object-page.cds'))
  assert(objectPageAnnotations.includes("Label: 'Classification and Planning'"))
  assert(!objectPageAnnotations.includes("ID     : 'Assignment'"))
  assert(!objectPageAnnotations.includes("Target : '@UI.FieldGroup#Assignment'"))
  rec('Object Page keeps assignment in one dedicated section without duplicate Assignment subsection', true)

  const source = readApp(path.join('webapp', 'ext', 'actions', 'SmartAssignDeveloper.js'))
  assertHasAll(source, [
    'sap/m/Dialog',
    'sap/m/SearchField',
    'sap/m/Table',
    'sap/m/ObjectStatus',
    'sap/m/MessageStrip',
    'openAssigneePicker',
    'setProperty("assignee_ID"',
    'BugService.assignToDeveloper'
  ], 'SmartAssignDeveloper.js')
  assert(!/<(div|span|style)\b/i.test(source), 'Smart Assign must not embed raw HTML/CSS')
  rec('Smart Assign uses SAPUI5 controls without raw mockup HTML/CSS', true)

  const fragment = readApp(path.join('webapp', 'ext', 'fragment', 'SmartAssignmentSection.fragment.xml'))
  assertHasAll(fragment, [
    'showValueHelp="true"',
    'valueHelpRequest="SmartAssign.openAssigneePicker"',
    "mode: 'OneWay'",
    'change="SmartAssign.resetAssigneeInput"'
  ], 'SmartAssignmentSection.fragment.xml')
  rec('Assignee field opens Smart Assign from value help and blocks free-text persistence', true)

  const requiredI18n = [
    'smartAssignDeveloper=',
    'smartAssignmentSectionTitle=',
    'smartAssigneeLabel=',
    'smartAssignUseValueHelp=',
    'smartAssignDialogTitle=',
    'smartAssignSearchPlaceholder=',
    'smartAssignBusyWarning=',
    'smartAssignUnavailableWarning=',
    'smartAssignAiExplanationColumn=',
    'smartAssignAiNotice=',
    'smartAssignAiExplanationUnavailable=',
    'aiReviewStatusReady=',
    'aiReviewStatusUnavailable=',
    'aiReviewDecisionHint=',
    'smartAssignAssignedToast='
  ]
  assertHasAll(readApp(path.join('webapp', 'i18n', 'i18n.properties')), requiredI18n, 'i18n.properties')
  assertHasAll(readApp(path.join('webapp', 'i18n', 'i18n_en.properties')), requiredI18n, 'i18n_en.properties')
  assert(!/CAP validation|Backend validation/i.test(readApp(path.join('webapp', 'i18n', 'i18n.properties'))))
  assert(!/CAP validation|Backend validation/i.test(readApp(path.join('webapp', 'i18n', 'i18n_en.properties'))))
  rec('i18n bundles contain Smart Assign text keys', true)
}

async function verifyUiActionModule() {
  const developerModule = loadSmartAssignModule('DEVELOPER')
  assert.strictEqual(developerModule.isVisible(), false)
  await assert.rejects(() => developerModule.openDialog.call({}), /not allowed/)
  rec('Developer cannot see or invoke Smart Assign', true)

  const pmModule = loadSmartAssignModule('PM')
  assert.strictEqual(pmModule.isVisible(), true)
  rec('PM can see Smart Assign', true)

  const hooks = {}
  const testerModule = loadSmartAssignModule('TESTER', hooks)
  let bindListPath
  let bindListFilters
  let bindContextPath
  const operationParameters = {}
  const candidateRows = [
    {
      ID: DEV_DAT,
      developerProfileID: DEV_DAT,
      developerName: 'DatDT',
      developerEmail: 'datdt@example.local',
      availabilityStatusName: 'Available',
      availabilityCriticality: 3,
      applicationComponentName: 'Finance',
      defectCategoryName: 'Value Help',
      sapModuleName: null,
      responsibilityLevelName: 'Primary'
    },
    {
      ID: 'busy-profile',
      developerProfileID: 'busy-profile',
      developerName: 'Busy Developer',
      developerEmail: 'busy@example.local',
      availabilityStatusName: 'Busy',
      availabilityCriticality: 2,
      applicationComponentName: 'Finance',
      defectCategoryName: 'Value Help',
      sapModuleName: 'FI',
      responsibilityLevelName: 'Backup'
    }
  ]

  const model = {
    pendingGroups: [],
    hasPendingChanges(groupId) {
      this.pendingGroups.push(groupId)
      // UI5 value-help bindings may keep their internal "donotsubmit" group
      // pending while the application update group completes normally.
      return groupId === '$auto' ? this.pendingGroups.length === 1 : true
    },
    getUpdateGroupId() {
      return '$auto'
    },
    submitBatch() {
      throw new Error('submitBatch must not be called for $auto')
    },
    bindList(pathName, unusedContext, unusedSorters, filters) {
      bindListPath = pathName
      bindListFilters = filters
      return {
        requestContexts() {
          return Promise.resolve(candidateRows.map(row => ({
            getObject() {
              return row
            }
          })))
        }
      }
    },
    bindContext(pathName) {
      bindContextPath = pathName
      return {
        setParameter(name, value) {
          operationParameters[name] = value
        },
        execute() {
          return Promise.resolve()
        },
        getBoundContext() {
          return {
            requestObject() {
              return Promise.resolve({
                value: [
                  {
                    developerProfileID: DEV_DAT,
                    explanation: 'Matches Finance and Value Help responsibility.',
                    confidence: 0.72,
                    requiresReview: true
                  },
                  {
                    developerProfileID: 'busy-profile',
                    explanation: 'Matches Finance and Value Help but workload should be reviewed.',
                    warnings: 'Availability is Busy.',
                    confidence: 0.55,
                    requiresReview: true
                  }
                ]
              })
            }
          }
        }
      }
    }
  }

  const view = {
    getModel(name) {
      if (name === 'i18n' || name === '@i18n') {
        return {
          getResourceBundle() {
            return {
              getText(key, args) {
                return args ? `${key}:${args.join('|')}` : key
              }
            }
          }
        }
      }
      return model
    },
    addDependent(dialog) {
      hooks.dialog = dialog
    },
    getBindingContext() {
      return bugContext
    }
  }

  const bugContext = {
    getModel() {
      return model
    },
    getPath() {
      return `/Bugs(ID=${BUG1},IsActiveEntity=true)`
    },
    requestObject() {
      return Promise.resolve({
        ID: BUG1,
        IsActiveEntity: true,
        canAssign: true,
        componentCategory_ID: COMPONENT_CATEGORY_1,
        sapModule_ID: null,
        assigneeDisplayName: null
      })
    },
    requestRefresh() {
      hooks.refreshed = true
      return Promise.resolve()
    },
    requestProperty(propertyName) {
      const values = {
        applicationComponent_ID: '40000000-0000-0000-0000-000000000001',
        defectCategory_ID: '50000000-0000-0000-0000-000000000001',
        componentCategory_ID: COMPONENT_CATEGORY_1
      }
      return Promise.resolve(values[propertyName])
    }
  }

  const dialog = await testerModule.openDialog.call({ _view: view }, bugContext)
  assert(dialog)
  assert.strictEqual(bindListPath, '/AssignableDevelopers')
  assert(bindListFilters.some(filter => filter.pathName === 'componentCategoryID' && filter.value === COMPONENT_CATEGORY_1))
  assert.strictEqual(hooks.dialog, dialog)
  assert.strictEqual(hooks.refreshed, true)
  assert.deepStrictEqual(model.pendingGroups, ['$auto', '$auto'])
  rec('dialog loads assignable developers filtered by bug component category', true)
  rec('unrelated UI5 pending groups do not block the auto-group candidate read', true)

  await new Promise(resolve => setImmediate(resolve))
  await new Promise(resolve => setImmediate(resolve))
  assert.strictEqual(bindContextPath, '/explainSmartAssignment(...)')
  assert.strictEqual(operationParameters.componentCategoryID, COMPONENT_CATEGORY_1)
  const state = dialog.models.smartAssign
  assert.strictEqual(state.getProperty('/visibleCandidates').length, 2)
  assert(state.getProperty('/visibleCandidates')[0].aiExplanation.includes('Matches Finance'))
  rec('dialog decorates Smart Assign candidates with reviewable explanations', true)
  state.setProperty('/searchQuery', 'busy fi backup')
  const searchField = dialog.settings.content[0].settings.items.find(control => control.name === 'SearchField')
  searchField.settings.search({ getParameter: name => name === 'query' ? 'busy fi backup' : '' })
  assert.strictEqual(state.getProperty('/visibleCandidates').length, 1)
  assert.strictEqual(state.getProperty('/visibleCandidates')[0].developerName, 'Busy Developer')
  rec('dialog search matches developer, module, and capability fields', true)
}

async function callAssignAction(srv, assigneeID) {
  const req = new cds.Request({
    method: 'POST',
    event: 'assignToDeveloper',
    target: srv.entities.Bugs,
    params: [{ ID: BUG1, IsActiveEntity: true }],
    data: { assigneeID, note: 'IDTS-56 QA smart assign validation' },
    user: new cds.User({ id: 'DonHV', roles: ['authenticated-user'] })
  })
  return srv.dispatch(req)
}

async function verifyBackendValidation() {
  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const srv = await cds.serve('BugService').from(csn)

  const readReq = new cds.Request({
    method: 'READ',
    target: srv.entities.AssignableDevelopers,
    query: SELECT.from(srv.entities.AssignableDevelopers).where({
      componentCategoryID: COMPONENT_CATEGORY_1,
      active: true
    }),
    user: new cds.User({ id: 'DonHV', roles: ['authenticated-user'] })
  })
  const candidates = await srv.dispatch(readReq)
  assert(candidates.some(candidate => candidate.developerProfileID === DEV_DAT))
  rec('AssignableDevelopers returns a valid candidate for BUG-0001', true)

  const assigned = await callAssignAction(srv, DEV_DAT)
  assert.strictEqual(assigned.status_code, 'ASSIGNED')
  assert.strictEqual(assigned.assignee_ID, DEV_DAT)
  rec('positive assignment through backend action succeeds', true)

  await assert.rejects(() => callAssignAction(srv, DEV_MISSING), /does not exist|not active|not responsible/)
  rec('negative assignment is blocked by backend validation', true)
}

async function main() {
  console.log('')
  console.log('==============================================')
  console.log(' IDTS-56 Smart Assign Verification')
  console.log(' ' + new Date().toISOString())
  console.log('==============================================')

  try {
    await verifyStaticContract()
    await verifyUiActionModule()
    await verifyBackendValidation()
  } catch (error) {
    rec('unhandled verification error', false, error && error.stack ? error.stack : String(error))
  }

  console.log('')
  console.log('==============================================')
  console.log(` TOTAL: ${pass} PASS  |  ${fail} FAIL`)
  console.log('==============================================')

  process.exit(fail > 0 ? 1 : 0)
}

main()
