'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const app = path.join(root, 'app/user-administration-ui')
const webapp = path.join(app, 'webapp')
const manifest = JSON.parse(fs.readFileSync(path.join(webapp, 'manifest.json'), 'utf8'))
const controllerSource = fs.readFileSync(path.join(webapp, 'controller/Main.controller.js'), 'utf8')
const viewSource = fs.readFileSync(path.join(webapp, 'view/Main.view.xml'), 'utf8')
const detailFragmentSource = fs.readFileSync(path.join(webapp, 'fragment/DeveloperWorkloadDetails.fragment.xml'), 'utf8')
const formatterSource = fs.readFileSync(path.join(webapp, 'model/formatter.js'), 'utf8')
const monitoringSource = fs.readFileSync(path.join(root, 'srv/bug-service/monitoring.js'), 'utf8')
const serviceSource = fs.readFileSync(path.join(root, 'srv/service.cds'), 'utf8')

const VALID_UUID = '20000000-0000-0000-0000-000000000001'
const SECOND_UUID = '20000000-0000-0000-0000-000000000002'

assert.equal(manifest['sap.app'].dataSources.bugService?.uri, '/odata/v4/bug/')
assert.equal(manifest['sap.app'].dataSources.bugService?.settings?.odataVersion, '4.0')
assert.equal(manifest['sap.ui5'].models.bugApi?.dataSource, 'bugService')
assert.equal(manifest['sap.ui5'].models.bugApi?.type, 'sap.ui.model.odata.v4.ODataModel')
assert.equal(manifest['sap.ui5'].models.bugApi?.settings?.operationMode, 'Server')
assert.equal(manifest['sap.ui5'].models.bugApi?.settings?.autoExpandSelect, true)
assert.equal(manifest['sap.ui5'].models.bugApi?.settings?.earlyRequests, false)
assert.equal(manifest['sap.ui5'].models.bugApi?.preload, false)

const workloadIndex = viewSource.indexOf('key="developerWorkload"')
const responsibilitiesIndex = viewSource.indexOf('key="developerResponsibilities"')
assert.ok(workloadIndex >= 0 && responsibilitiesIndex > workloadIndex, 'Workload must precede Responsibilities')
const workloadSectionSource = viewSource.slice(workloadIndex, responsibilitiesIndex)
const workloadTableStart = workloadSectionSource.indexOf('id="developerWorkloadTable"')
const workloadTableEnd = workloadSectionSource.indexOf('</Table>', workloadTableStart)
const workloadTableSource = workloadSectionSource.slice(workloadTableStart, workloadTableEnd)

function openingTagById (source, controlName, id) {
  const idIndex = source.indexOf(`id="${id}"`)
  assert.ok(idIndex >= 0, `${id} must exist`)
  const start = source.lastIndexOf(`<${controlName}`, idIndex)
  assert.ok(start >= 0, `${id} must be a ${controlName}`)
  let lineStart = start
  while (lineStart < source.length) {
    const lineEnd = source.indexOf('\n', lineStart)
    const end = lineEnd < 0 ? source.length : lineEnd
    if (source.slice(lineStart, end).trimEnd().endsWith('>')) return source.slice(start, end)
    lineStart = end + 1
  }
  assert.fail(`${id} opening tag is incomplete`)
}

function countDirectXmlControls (source, containerName) {
  const containerStart = source.indexOf(`<${containerName}>`)
  const containerEnd = source.indexOf(`</${containerName}>`, containerStart)
  assert.ok(containerStart >= 0 && containerEnd > containerStart, `${containerName} container must exist`)
  const controlLines = source.slice(containerStart, containerEnd).split(/\r?\n/)
    .filter(line => /^\s*<[A-Z]/.test(line))
  const minimumIndent = Math.min(...controlLines.map(line => line.match(/^\s*/)[0].length))
  return controlLines.filter(line => line.match(/^\s*/)[0].length === minimumIndent).length
}

assert.equal(countDirectXmlControls(workloadTableSource, 'columns'), 9, 'Workload table must declare one column for every cell')
assert.equal(countDirectXmlControls(workloadTableSource, 'cells'), 9, 'Workload row must provide one cell for every column')
const workloadOpeningTag = openingTagById(workloadSectionSource, 'Table', 'developerWorkloadTable')
assert.match(workloadOpeningTag, /autoPopinMode="true"/)
assert.match(workloadOpeningTag, /contextualWidth="Auto"/)
assert.match(workloadTableSource.split(/\r?\n/).find(line => line.includes('i18n>actions')), /importance="High"/)
assert.match(workloadTableSource, /i18n>workloadStatus/)
assert.match(workloadTableSource, /<HBox[^>]*>[\s\S]*?<Button[^>]*i18n>viewWorkload[^>]*press="\.onOpenDeveloperWorkload"/)
assert.match(viewSource, /items="\{workload>\/items\}"/)
assert.match(viewSource, /press="\.onOpenDeveloperWorkload"/)
assert.match(viewSource, /search="\.onDeveloperWorkloadSearch"/)
assert.match(viewSource, /press="\.onRefreshDeveloperWorkload"/)
assert.match(viewSource, /press="\.onLoadMoreDeveloperWorkload"/)
assert.doesNotMatch(viewSource, /workload>developerProfileID/)
assert.match(detailFragmentSource, /press="\.openBugInManagement"/)
const workloadBugsOpeningTag = openingTagById(detailFragmentSource, 'Table', 'developerWorkloadBugsTable')
assert.match(workloadBugsOpeningTag, /autoPopinMode="true"/)
assert.match(workloadBugsOpeningTag, /contextualWidth="Auto"/)
assert.match(detailFragmentSource.split(/\r?\n/).find(line => line.includes('i18n>actions')), /importance="High"/)
assert.match(detailFragmentSource, /workload>assigneeDisplayName/)
assert.match(detailFragmentSource, /workload>currentActionOwnerDisplayName/)
assert.match(detailFragmentSource, /class="sapUiSmallMargin"/)
assert.doesNotMatch(detailFragmentSource, /description|comments|attachments|identityIssuer|identitySubject|providerCorrelation|audit/i)
for (const locale of ['i18n.properties', 'i18n_en.properties', 'i18n_vi.properties']) {
  const localeText = fs.readFileSync(path.join(webapp, 'i18n', locale), 'utf8')
  for (const key of [
    'developerWorkloadTab', 'developerWorkloadTabTooltip', 'developerWorkloadOwnershipNote',
    'developerWorkloadSearchPlaceholder', 'refreshDeveloperWorkload', 'developerWorkloadLoadFailed',
    'noDeveloperWorkloads', 'openLimit', 'needsDeveloperAction', 'overdue', 'estimatedEffort', 'workloadStatus',
    'developerActionUnit', 'hoursShort', 'overloadedText', 'overdueText', 'withinLimitText',
    'viewWorkload', 'loadMoreDeveloperWorkloads', 'developerWorkloadDetailsTitle', 'openAssignedBugs',
    'developerWorkloadDetailsNote', 'developerWorkloadBugsLoadFailed', 'noDeveloperWorkloadBugs',
    'bugNumber', 'title', 'priority', 'severity', 'dueDate', 'technicalAssignee', 'currentActionOwner', 'openBug',
    'accessReadinessLabel', 'accessReadinessReadyText', 'accessReadinessAttentionText'
  ]) assert.match(localeText, new RegExp(`^${key}=`, 'm'), `${key} must exist in ${locale}`)
}

assert.match(controllerSource, /getView\(\)\.getModel\("bugApi"\)/)
assert.match(controllerSource, /bindList\("\/DeveloperWorkloads"/)
assert.match(controllerSource, /isOverloaded desc,overdueOwnedBugCount desc,developerName asc,developerProfileID asc/)
assert.match(controllerSource, /bindList\("\/Bugs"/)
assert.match(controllerSource, /status_code ne 'CLOSED'/)
assert.match(controllerSource, /dueDate asc,bugNumber asc/)
assert.match(controllerSource, /estimatedEffortHours,assigneeDisplayName,currentActionOwnerDisplayName/)
assert.match(controllerSource, /window\.location\.assign\(sUrl\)/)
assert.match(controllerSource, /const WORKLOAD_SELECT = "[^"]*identityAccessReady/)
assert.match(serviceSource, /identityAccessReady\s*:\s*Boolean/)
assert.match(serviceSource, /@readonly[\s\S]{0,500}entity DeveloperWorkloads[\s\S]{0,900}identityAccessReady\s*:\s*Boolean/)
assert.match(monitoringSource, /const identityAccessByUser = await readActiveIdentityAccessByUser\([\s\S]{0,160}profiles\.map\(profile => profile\.user_ID\)/)
assert.match(monitoringSource, /hasActiveIdentityAccess/)
assert.match(monitoringSource, /identityAccessReady/)
assert.doesNotMatch(monitoringSource, /for\s*\([^)]*profiles[\s\S]{0,200}readActiveIdentityAccessByUser/)
assert.match(controllerSource, /identityAccessReady: oSource\.identityAccessReady === true/)
assert.doesNotMatch(controllerSource, /accessReady|oSource\.active === true && !!oSource\.developerUserID/)
assert.match(workloadSectionSource, /workload>identityAccessReady/)
assert.match(workloadSectionSource, /i18n>accessReadinessLabel/)
assert.doesNotMatch(workloadSectionSource, /workload>accessReady|i18n>developerReady/)
assert.doesNotMatch(controllerSource, /bugApi[\s\S]{0,800}\.(create|update|delete)\s*\(/i)
assert.doesNotMatch(controllerSource, /description|comments|attachments|identityIssuer|identitySubject|providerCorrelation/i)

function loadController (source, oWindow) {
  let definition
  const BaseController = { extend: (_name, value) => { definition = value; return { prototype: value } } }
  const sandbox = {
    window: oWindow,
    sap: {
      ui: {
        define: (_dependencies, factory) => factory(
          BaseController,
          { load: async () => ({ open: () => {}, close: () => {} }) },
          function JSONModel () {},
          { error: () => {}, warning: () => {} },
          { show: () => {} }
        )
      }
    }
  }
  const vm = require('node:vm')
  vm.runInNewContext(source, sandbox, { filename: 'Main.controller.js' })
  return definition
}

const controller = loadController(controllerSource)
assert.equal(typeof controller._loadDeveloperWorkloads, 'function')
assert.equal(typeof controller._loadDeveloperWorkloadBugs, 'function')
assert.equal(typeof controller._normalizeDeveloperWorkloadRow, 'function')
assert.equal(typeof controller._normalizeDeveloperWorkloadBug, 'function')
assert.equal(typeof controller._bugObjectPageUrl, 'function')
assert.equal(typeof controller.openBugInManagement, 'function')

assert.equal(controller._bugObjectPageUrl(VALID_UUID), `/idtsbugmanagementui/index.html#/Bugs(ID=${VALID_UUID},IsActiveEntity=true)`)
assert.equal(controller._bugObjectPageUrl('not-a-uuid'), null)
assert.equal(controller._bugObjectPageUrl(''), null)
assert.equal(controller._bugObjectPageUrl(null), null)

const normalized = controller._normalizeDeveloperWorkloadRow({
  developerProfileID: VALID_UUID,
  developerUserID: '10000000-0000-0000-0000-000000000001',
  developerName: 'SangVN',
  developerEmail: 'sang@example.invalid',
  openOwnedBugCount: '4',
  overdueOwnedBugCount: '2',
  currentActionItemCount: '3',
  workloadLimit: null,
  estimatedEffortHoursTotal: '19.50',
  isOverloaded: true,
  active: true
})
assert.equal(normalized.openOwnedBugCount, 4)
assert.equal(normalized.overdueOwnedBugCount, 2)
assert.equal(normalized.currentActionItemCount, 3)
assert.equal(normalized.estimatedEffortHoursTotal, 19.5)
assert.equal(normalized.workloadLimit, null)
assert.equal(normalized.identityAccessReady, false)
assert.equal(controller._normalizeDeveloperWorkloadRow({
  developerProfileID: VALID_UUID,
  developerUserID: '10000000-0000-0000-0000-000000000001',
  active: true,
  identityAccessReady: true
}).identityAccessReady, true)
assert.equal(normalized.developerProfileID, VALID_UUID)
assert.equal(normalized.developerUserID, '10000000-0000-0000-0000-000000000001')

const today = new Date().toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
const normalizedBug = controller._normalizeDeveloperWorkloadBug({
  ID: VALID_UUID,
  bugNumber: 'BUG-0001',
  title: 'Assigned workload check',
  status_code: 'IN_PROGRESS',
  priority_code: 'HIGH',
  severity_code: 'MEDIUM',
  dueDate: yesterday,
  estimatedEffortHours: '2.50',
  assigneeDisplayName: 'Technical Developer',
  currentActionOwnerDisplayName: 'Current Action Owner'
})
assert.equal(normalizedBug.overdue, true)
assert.equal(normalizedBug.estimatedEffortHours, 2.5)
assert.equal(normalizedBug.assigneeDisplayName, 'Technical Developer')
assert.equal(normalizedBug.currentActionOwnerDisplayName, 'Current Action Owner')
assert.equal(normalizedBug.objectPageUrl, `/idtsbugmanagementui/index.html#/Bugs(ID=${VALID_UUID},IsActiveEntity=true)`)
assert.equal(Object.hasOwn(normalizedBug, 'description'), false)
assert.equal(Object.hasOwn(normalizedBug, 'comments'), false)
assert.equal(Object.hasOwn(normalizedBug, 'attachments'), false)
assert.equal(controller._normalizeDeveloperWorkloadBug({ ...normalizedBug, dueDate: today }).overdue, false)
assert.equal(controller._normalizeDeveloperWorkloadBug({ ...normalizedBug, status_code: 'CLOSED' }).overdue, false)
assert.equal(controller._normalizeDeveloperWorkloadBug({ ...normalizedBug, ID: 'broken' }).objectPageUrl, null)

function loadFormatter (source) {
  let formatter
  const vm = require('node:vm')
  vm.runInNewContext(source, {
    sap: {
      ui: {
        define: (_dependencies, factory) => {
          formatter = factory({ getDateTimeInstance: () => ({ format: value => new Date(value).toISOString() }) })
        }
      }
    }
  }, { filename: 'formatter.js' })
  return formatter
}

const formatter = loadFormatter(formatterSource)
assert.equal(formatter.workloadOpenLimit(4, 3), '4 / 3')
assert.equal(formatter.workloadOpenLimit('4', null), '4 / —')
assert.equal(formatter.workloadReadinessText(true, 'Ready', 'Needs attention', 'Access readiness'), 'Access readiness: Ready')
assert.equal(formatter.workloadState(true, 0, true), 'Error')
assert.equal(formatter.workloadState(false, 1, true), 'Warning')
assert.equal(formatter.workloadState(false, 0, true), 'Success')
assert.equal(formatter.workloadState(false, 0, false), 'None')

let navigatedUrl = null
const navigationController = loadController(controllerSource, { location: { assign: url => { navigatedUrl = url } } })
navigationController.openBugInManagement({
  getSource: () => ({ getBindingContext: () => ({ getObject: () => ({ bugID: VALID_UUID }) }) })
})
assert.equal(navigatedUrl, `/idtsbugmanagementui/index.html#/Bugs(ID=${VALID_UUID},IsActiveEntity=true)`)
navigatedUrl = null
navigationController.openBugInManagement({
  getSource: () => ({ getBindingContext: () => ({ getObject: () => ({ bugID: 'broken' }) }) })
})
assert.equal(navigatedUrl, null)

function modelFor (data) {
  return {
    getProperty: key => data[key.slice(1)],
    setProperty: (key, value) => { data[key.slice(1)] = value },
    setData: value => Object.assign(data, value)
  }
}

async function verifyPagingAndReadContracts () {
  const workloadData = {
    items: [{ ...normalized, developerProfileID: VALID_UUID, developerName: 'First' }],
    query: '',
    nextSkip: 100,
    pageSize: 100,
    hasMore: true,
    loaded: true,
    busy: false,
    error: false,
    selectedDeveloper: null,
    bugs: [],
    bugsBusy: false,
    bugsError: false
  }
  const workloadModel = modelFor(workloadData)
  const workloadBindingCalls = []
  const workloadApi = {
    bindList: (entitySet, _context, _sorters, _filters, parameters) => {
      workloadBindingCalls.push({ entitySet, parameters })
      return {
        requestContexts: async (skip, length) => {
          assert.equal(skip, 100)
          assert.equal(length, 100)
          return [
            { requestObject: async () => ({ ...normalized, developerProfileID: SECOND_UUID, developerName: 'Second', isOverloaded: false }) },
            { requestObject: async () => ({ ...normalized, developerProfileID: SECOND_UUID, developerName: 'Duplicate second', isOverloaded: false }) },
            { requestObject: async () => ({ ...normalized, developerProfileID: VALID_UUID, developerName: 'Duplicate', isOverloaded: true }) }
          ]
        }
      }
    }
  }
  const workloadInstance = Object.assign(Object.create(controller), {
    getModel: name => name === 'workload' ? workloadModel : undefined,
    getView: () => ({ getModel: name => name === 'bugApi' ? workloadApi : undefined })
  })
  await workloadInstance._loadDeveloperWorkloads(undefined, true)
  assert.deepEqual(workloadData.items.map(row => row.developerName), ['First', 'Second'])
  assert.equal(workloadData.nextSkip, 103)
  assert.equal(workloadData.error, false)
  assert.equal(workloadBindingCalls[0].entitySet, '/DeveloperWorkloads')
  assert.equal(workloadBindingCalls[0].parameters.$orderby, 'isOverloaded desc,overdueOwnedBugCount desc,developerName asc,developerProfileID asc')
  assert.equal(workloadBindingCalls[0].parameters.$top, undefined)

  const bugData = { ...workloadData, selectedDeveloper: { developerProfileID: VALID_UUID }, bugs: [], bugsBusy: false, bugsError: false }
  const bugModel = modelFor(bugData)
  const bugBindingCalls = []
  const bugApi = {
    bindList: (entitySet, _context, _sorters, _filters, parameters) => {
      bugBindingCalls.push({ entitySet, parameters })
      return {
        requestContexts: async (skip, length) => {
          assert.equal(skip, 0)
          assert.equal(length, 100)
          return [
            { requestObject: async () => ({ ...normalizedBug, ID: VALID_UUID }) },
            { requestObject: async () => ({ ...normalizedBug, ID: SECOND_UUID, status_code: 'CLOSED' }) }
          ]
        }
      }
    }
  }
  const bugInstance = Object.assign(Object.create(controller), {
    getModel: name => name === 'workload' ? bugModel : undefined,
    getView: () => ({ getModel: name => name === 'bugApi' ? bugApi : undefined })
  })
  await bugInstance._loadDeveloperWorkloadBugs(bugData.selectedDeveloper)
  assert.equal(bugData.bugs.length, 1)
  assert.equal(bugData.bugs[0].ID, VALID_UUID)
  assert.equal(bugData.bugsBusy, false)
  assert.equal(bugData.bugsError, false)
  assert.equal(bugBindingCalls[0].entitySet, '/Bugs')
  assert.equal(bugBindingCalls[0].parameters.$filter, `assignee_ID eq ${VALID_UUID} and status_code ne 'CLOSED'`)
  assert.equal(bugBindingCalls[0].parameters.$orderby, 'dueDate asc,bugNumber asc')
  assert.equal(bugBindingCalls[0].parameters.$select, 'ID,bugNumber,title,status_code,priority_code,severity_code,dueDate,estimatedEffortHours,assigneeDisplayName,currentActionOwnerDisplayName')
  assert.equal(bugBindingCalls[0].parameters.$top, undefined)
}

verifyPagingAndReadContracts().then(() => {
  console.log('IDTS User Administration Developer Workload contract: PASS')
}).catch(error => {
  console.error(error.stack || error)
  process.exitCode = 1
})
