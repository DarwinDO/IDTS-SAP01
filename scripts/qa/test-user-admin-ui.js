'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const YAML = require('yaml')

const root = path.resolve(__dirname, '../..')
const app = path.join(root, 'app/user-administration-ui')
const webapp = path.join(app, 'webapp')

const manifest = JSON.parse(fs.readFileSync(path.join(webapp, 'manifest.json'), 'utf8'))
assert.equal(manifest['sap.app'].id, 'idts.useradministrationui')
assert.equal(manifest['sap.app'].dataSources.mainService.uri, '/odata/v4/user-administration/')
assert.equal(manifest['sap.app'].dataSources.mainService.settings.odataVersion, '4.0')

const xsApp = JSON.parse(fs.readFileSync(path.join(app, 'xs-app.json'), 'utf8'))
const protectedRoutes = xsApp.routes.filter(route => route.authenticationType === 'xsuaa')
assert.equal(protectedRoutes.length, 2)
for (const route of protectedRoutes) {
  assert.equal(route.scope, '$XSAPPNAME.UserAdmin')
}
assert.ok(protectedRoutes.some(route => route.source === '^/odata/(.*)$' && route.destination === 'srv-api'))
assert.ok(protectedRoutes.some(route => route.source === '^(.*)$' && route.service === 'html5-apps-repo-rt'))

const mta = YAML.parse(fs.readFileSync(path.join(root, 'mta.yaml'), 'utf8'))
const uiModule = mta.modules.find(module => module.name === 'idts-sap01-user-admin-ui')
assert.equal(uiModule.type, 'html5')
assert.equal(uiModule.path, 'app/user-administration-ui')
assert.deepEqual(uiModule['build-parameters'].commands, ['npm ci --workspaces=false', 'npm run build'])
const contentModule = mta.modules.find(module => module.name === 'idts-sap01-app-content')
const contentRequirement = contentModule['build-parameters'].requires.find(requirement => requirement.name === 'idts-sap01-user-admin-ui')
assert.deepEqual(contentRequirement.artifacts, ['user-administration-ui.zip'])
assert.equal(contentRequirement['target-path'], 'app/')

const appPackage = JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8'))
const appPackageLock = JSON.parse(fs.readFileSync(path.join(app, 'package-lock.json'), 'utf8'))
assert.equal(manifest['sap.app'].applicationVersion.version, appPackage.version, 'HTML5 manifest and package versions stay aligned')
assert.equal(appPackageLock.version, appPackage.version, 'HTML5 package and lockfile versions stay aligned')
assert.equal(appPackageLock.packages[''].version, appPackage.version, 'HTML5 lockfile root version stays aligned')
const [majorVersion, minorVersion, patchVersion] = appPackage.version.split('.').map(Number)
assert.ok(
  majorVersion > 1 || minorVersion > 0 || patchVersion >= 10,
  'Developer responsibility administration content must advance beyond deployed UI 1.0.9'
)
assert.notEqual(appPackage.version, '1.0.0', 'changed HTML5 content must use a new application version')
assert.match(appPackage.scripts.build, /ui5 build preload/)
assert.match(appPackage.scripts.build, /--include-task generateCachebusterInfo/)
assert.equal(appPackage.devDependencies['ui5-task-zipper'], '^3.4.2')
assert.ok(fs.existsSync(path.join(app, 'package-lock.json')))

const ui5Config = YAML.parse(fs.readFileSync(path.join(app, 'ui5.yaml'), 'utf8'))
const zipperTask = ui5Config.builder.customTasks.find(task => task.name === 'ui5-task-zipper')
assert.equal(zipperTask.afterTask, 'generateCachebusterInfo', 'the deployable ZIP must be created after cache-buster metadata')

const indexHtml = fs.readFileSync(path.join(webapp, 'index.html'), 'utf8')
assert.match(indexHtml, /data-sap-ui-app-cache-buster="\.\/"/)

const view = fs.readFileSync(path.join(webapp, 'view/Main.view.xml'), 'utf8')
assert.match(view, /<SearchField/)
assert.match(view, /<Table/)
assert.match(view, /items="\{requests>\/items\}"/)
assert.match(view, /press="\.onOpenInvite"/)
assert.match(view, /press="\.onApproveProvisioning"/)
assert.match(view, /press="\.onOpenRoleChange"/)
assert.match(view, /press="\.onOpenRevoke"/)
assert.match(view, /press="\.onRetryAccessOperation"/)
assert.match(view, /press="\.onReconcileAccessOperation"/)
assert.match(view, /press="\.onCancelExistingLinkInvitation"/)
assert.match(view, /requests>cancelEligible/)
assert.match(view, /status_code\} === 'RETRYABLE_FAILURE'[\s\S]+lastErrorCode\} === 'PROVIDER_REQUEST_INVALID'[\s\S]+latestOperationAttemptCount\} === 4/)
assert.match(view, /status_code\} === 'BLOCKED_MANUAL_REVIEW'[\s\S]+lastErrorCode\} === 'AMBIGUOUS_PROVIDER_OUTCOME'/)
assert.match(view, /press="\.onOpenDeveloperProfile"/)
assert.doesNotMatch(view, /type="Password"|tokenHash|tokenNonce|identityIssuer/)
assert.match(view, /<IconTabBar/)
assert.match(view, /key="requests"/)
assert.match(view, /key="activeUsers"/)
assert.match(view, /key="developerResponsibilities"/)
assert.match(view, /items="\{activeUsers>\/items\}"/)
assert.match(view, /items="\{activeUsers>\/developerItems\}"/)
assert.match(view, /search="\.onActiveUsersSearch"/)
assert.match(view, /press="\.onOpenActiveUserDetails"/)
assert.match(view, /press="\.onRetryActiveUsers"/)
assert.match(view, /text="\{i18n>includeRevoked\}"/)
assert.match(view, /press="\.onLoadMoreActiveUsers"/)
assert.doesNotMatch(view, /identityOrigin|identityIssuer|identitySubject|identityKeyHash|identityPlatformUserId/)
const activeUsersTableStart = view.indexOf('id="activeUsersTable"')
const activeUsersTable = view.slice(activeUsersTableStart, view.indexOf('</Table>', activeUsersTableStart))
assert.match(activeUsersTable, /i18n>userAdminCapability/)
assert.match(activeUsersTable, /activeUsers>userAdminCapability/)

const activeUserDetailsFragment = fs.readFileSync(path.join(webapp, 'fragment/ActiveUserDetails.fragment.xml'), 'utf8')
assert.match(activeUserDetailsFragment, /<Dialog/)
assert.match(activeUserDetailsFragment, /activeUsers>\/details/)
assert.match(activeUserDetailsFragment, /press="\.onCloseActiveUserDetails"/)
assert.doesNotMatch(activeUserDetailsFragment, /requestRoleChange|requestRevoke|updateDeveloperProfile|onConfirmAccessChange|onConfirmDeveloperProfile|onOpenRevoke|onRevoke/i)
assert.match(activeUserDetailsFragment, /press="\.onOpenActiveUserRoleChange"/)
assert.match(activeUserDetailsFragment, /press="\.onOpenActiveUserSuspend"/)
assert.match(activeUserDetailsFragment, /press="\.onOpenActiveUserReactivate"/)
assert.match(activeUserDetailsFragment, /press="\.onOpenActiveUserRevoke"/)
assert.match(activeUserDetailsFragment, /linkEligible/)
assert.match(activeUserDetailsFragment, /press="\.onOpenExistingIdentityLink"/)

const linkExistingIdentityFragment = fs.readFileSync(path.join(webapp, 'fragment/LinkExistingIdentity.fragment.xml'), 'utf8')
assert.match(linkExistingIdentityFragment, /<Dialog/)
assert.match(linkExistingIdentityFragment, /existingLink>\/row\/displayName/)
assert.match(linkExistingIdentityFragment, /existingLink>\/row\/businessRole/)
assert.match(linkExistingIdentityFragment, /existingIdentityLinkRole/)
assert.match(linkExistingIdentityFragment, /state="None"/)
assert.match(linkExistingIdentityFragment, /type="Email"/)
assert.match(linkExistingIdentityFragment, /existingLink>\/email/)
assert.match(linkExistingIdentityFragment, /press="\.onConfirmExistingIdentityLink"/)
assert.match(linkExistingIdentityFragment, /press="\.onCancelExistingIdentityLink"/)
assert.match(linkExistingIdentityFragment, /existingIdentityLinkNotice/)
assert.doesNotMatch(linkExistingIdentityFragment, /Role Collection|IdP|subaccount|endpoint|externalIdentity|platformUser|provider/i)

const fragment = fs.readFileSync(path.join(webapp, 'fragment/InviteUser.fragment.xml'), 'utf8')
assert.match(fragment, /<Input[^>]+type="Email"/)
assert.match(fragment, /<Select/)
assert.match(fragment, /<CheckBox/)
assert.match(fragment, /press="\.onConfirmInvite"/)
assert.match(fragment, /invite>\/developerProfile\/responsibilities/)
assert.match(fragment, /press="\.onAddInviteResponsibility"/)
assert.match(fragment, /valueState="\{=/)
assert.match(fragment, /valueLiveUpdate="true"/)
assert.match(fragment, /!\$\{invite>\/submitting\}/)
assert.doesNotMatch(fragment, /Password|OTP|passkey|token/i)

const controller = fs.readFileSync(path.join(webapp, 'controller/Main.controller.js'), 'utf8')
assert.match(controller, /^sap\.ui\.define\(/)
assert.doesNotMatch(controller, /normalizeCurrentBootstrapPm|bootstrapPmNormalize/, 'temporary PM normalization UI must be removed')
assert.doesNotMatch(activeUserDetailsFragment, /bootstrapPmNormalize|onNormalizeCurrentBootstrapPm/, 'temporary PM normalization button must be removed')
assert.match(controller, /bindContext\("\/requestOnboarding\(\.\.\.\)"\)/)
assert.match(controller, /setParameter\("email"/)
assert.match(controller, /setParameter\("requestedRole"/)
assert.match(controller, /setParameter\("userAdminRequested"/)
assert.match(controller, /setParameter\("developerProfile"/)
assert.match(controller, /await oOperation\.invoke\("\$direct"\)/)
assert.match(controller, /bindContext\("\/searchOnboarding\(\.\.\.\)"\)/)
assert.match(controller, /"approveProvisioning"/)
assert.match(controller, /"requestRoleChange"/)
assert.match(controller, /"cancelExistingUserIdentityLink"/)
assert.match(controller, /cancelExistingLinkConfirmation/)
assert.match(controller, /"requestRevoke"/)
assert.match(controller, /"requestSuspend"/)
assert.match(controller, /"requestReactivate"/)
assert.match(controller, /"retryAccessOperation"/)
assert.match(controller, /"reconcileAccessOperation"/)
assert.match(controller, /onConfirmAccessLifecycle/)
assert.match(controller, /ConfirmAccessLifecycle/)
assert.match(controller, /readDeveloperProfile/)
assert.match(controller, /"updateDeveloperProfile"/)
assert.match(controller, /sapModules:\s*\[\{ ID: "", name: sAnySapModule \}, \.\.\.aModules\]/)
assert.match(controller, /_confirm\("retryConfirmation"\)/)
assert.match(controller, /_confirm\("reconcileConfirmation"\)/)
assert.match(controller, /bindContext\(`\/\$\{sAction\}\(\.\.\.\)`\)/)
assert.doesNotMatch(controller, /new Filter\("targetEmailNormalized"/)
assert.match(controller, /if \(sRole !== "PM"\)[\s\S]+setProperty\("\/userAdminRequested", false\)/)
assert.doesNotMatch(controller, /console\.|responseText|api[_-]?key|client[_-]?secret/i)
assert.match(controller, /activeUsers/)
assert.match(controller, /bindContext\("\/searchActiveUsers\(\.\.\.\)"\)/)
assert.match(controller, /setParameter\("query"/)
assert.match(controller, /setParameter\("includeNonActive"/)
assert.match(controller, /setParameter\("skip"/)
assert.match(controller, /setParameter\("top"/)
assert.match(controller, /bindContext\("\/readActiveUserDetails\(\.\.\.\)"\)/)
assert.match(controller, /onTabSelect/)
assert.match(controller, /_ensureActiveUsersLoaded/)
assert.match(controller, /onLoadMoreActiveUsers/)
assert.match(controller, /requestExistingUserIdentityLink/)
assert.match(controller, /setParameter\("userID"/)
assert.match(controller, /setParameter\("email"/)
assert.match(controller, /businessRole: oDetails\.businessRole/)
assert.match(controller, /sEmail\.toLowerCase\(\)/)
assert.match(controller, /onConfirmExistingIdentityLink/)
assert.match(controller, /onExistingIdentityLinkFieldChange/)
assert.match(controller, /onCancelExistingIdentityLink/)
assert.match(controller, /linkEligible/)
assert.match(controller, /sessionStorage/)
assert.doesNotMatch(controller, /identityOrigin|identityIssuer|identitySubject|identityKeyHash|identityPlatformUserId/)

const formatter = fs.readFileSync(path.join(webapp, 'model/formatter.js'), 'utf8')
assert.match(formatter, /accessStateText/)
assert.match(formatter, /accessStateState/)

const manageFragment = fs.readFileSync(path.join(webapp, 'fragment/ManageAccess.fragment.xml'), 'utf8')
assert.match(manageFragment, /<Select/)
assert.match(manageFragment, /<CheckBox/)
assert.match(manageFragment, /<TextArea/)
assert.match(manageFragment, /valueLiveUpdate="true"/)
assert.match(manageFragment, /type="\{= \$\{access>\/mode\} === 'REVOKE' \? 'Negative' : 'Emphasized' \}"/)
assert.match(manageFragment, /press="\.onConfirmAccessChange"/)
assert.doesNotMatch(manageFragment, /stretchOnPhone=/)
assert.doesNotMatch(manageFragment, /Password|OTP|passkey|token/i)

const lifecycleFragment = fs.readFileSync(path.join(webapp, 'fragment/ConfirmAccessLifecycle.fragment.xml'), 'utf8')
assert.match(lifecycleFragment, /<Dialog/)
assert.match(lifecycleFragment, /lifecycle>\/reason/)
assert.match(lifecycleFragment, /press="\.onConfirmAccessLifecycle"/)
assert.match(lifecycleFragment, /enabled="\{= !!\$\{lifecycle>\/reason\}/)
assert.doesNotMatch(lifecycleFragment, /Role Collection|IdP|subaccount|endpoint|externalUser|provider/i)

const developerFragment = fs.readFileSync(path.join(webapp, 'fragment/ManageDeveloperProfile.fragment.xml'), 'utf8')
assert.match(developerFragment, /developer>\/developerProfile\/responsibilities/)
assert.match(developerFragment, /press="\.onConfirmDeveloperProfile"/)
assert.match(developerFragment, /press="\.onAddDeveloperResponsibility"/)
assert.match(developerFragment, /busy="\{developer>\/submitting\}"/)
assert.match(developerFragment, /existingBugsKeepAssignee/)
assert.match(developerFragment, /enabled="\{= !!\$\{developer>\/reason\} &amp;&amp; !\$\{developer>\/submitting\} \}"/)
assert.doesNotMatch(developerFragment, /Password|OTP|passkey|token/i)
assert.match(controller, /_confirm\("developerProfileConfirmation"\)/)

const controllerDefinition = loadController(controller)
assert.equal(typeof controllerDefinition.onConfirmInvite, 'function')
assert.equal(typeof controllerDefinition._loadRequests, 'function')
assert.equal(typeof controllerDefinition._loadInitialRequests, 'function')
assert.equal(typeof controllerDefinition.onAfterRendering, 'function')
assert.equal(typeof controllerDefinition.onTabSelect, 'function')
assert.equal(typeof controllerDefinition._loadActiveUsers, 'function')
assert.equal(typeof controllerDefinition._ensureActiveUsersLoaded, 'function')
assert.equal(typeof controllerDefinition.onLoadMoreActiveUsers, 'function')
assert.equal(typeof controllerDefinition.onOpenActiveUserDetails, 'function')
assert.equal(typeof controllerDefinition.onConfirmExistingIdentityLink, 'function')
assert.equal(typeof controllerDefinition.onExistingIdentityLinkFieldChange, 'function')
assert.match(controller, /this\.getResourceBundle\(\)/)

async function verifyRuntimeBehavior () {
  let initialLoadCount = 0
  const initialLoadInstance = Object.assign(Object.create(controllerDefinition), {
    _loadInitialRequests: async () => { initialLoadCount += 1 },
    _initialRequestsStarted: false
  })
  initialLoadInstance.onAfterRendering()
  initialLoadInstance.onAfterRendering()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(initialLoadCount, 1, 'initial search starts once after the view is rendered')

  let loadQuery
  const directInitialLoadInstance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => name === 'view' ? { getProperty: () => 'requests' } : { getProperty: () => false },
    _loadRequests: async query => {
      loadQuery = query
    }
  })
  await directInitialLoadInstance._loadInitialRequests()
  assert.equal(loadQuery, '')

  let inviteData = {
    email: 'controlled.test@example.invalid',
    role: 'PM',
    userAdminRequested: true,
    emailValid: true,
    canSubmit: true,
    submitting: false
  }
  let actionInvocations = 0
  let releaseInvite
  const inviteDone = new Promise(resolve => { releaseInvite = resolve })
  const operation = {
    setParameter: () => operation,
    invoke: async () => {
      actionInvocations += 1
      await inviteDone
    }
  }
  const instance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => {
      if (name === 'invite') {
        return {
          getData: () => inviteData,
          setData: data => { inviteData = data },
          setProperty: (key, value) => { inviteData[key.slice(1)] = value }
        }
      }
      if (name === 'view') return { setProperty: () => {} }
      if (name === 'requests') return { setProperty: () => {} }
      if (name === 'i18n') return { getResourceBundle: async () => ({ getText: key => key }) }
      throw new Error(`Unexpected model ${name}`)
    },
    getResourceBundle: async () => ({ getText: key => key }),
    getView: () => ({
      getModel: () => ({ bindContext: () => operation })
    }),
    byId: () => ({ getBinding: () => ({ refresh: () => {} }) }),
    _inviteDialog: { close: () => {} },
    _loadRequests: async () => {}
  })

  inviteData.email = ''
  inviteData.emailValid = false
  inviteData.canSubmit = false
  instance.onInviteFieldChange({ getParameter: name => name === 'value' ? 'new.user@example.invalid' : undefined })
  assert.equal(inviteData.email, 'new.user@example.invalid')
  assert.equal(inviteData.emailValid, true)
  assert.equal(inviteData.canSubmit, true)

  const first = instance.onConfirmInvite()
  const second = instance.onConfirmInvite()
  assert.equal(actionInvocations, 1)
  releaseInvite()
  await Promise.all([first, second])

  let searchParameter
  let searchInvocations = 0
  const searchOperation = {
    setParameter: (_name, value) => { searchParameter = value },
    invoke: async () => { searchInvocations += 1 },
    getBoundContext: () => ({ requestObject: async () => ({ value: [] }) })
  }
  instance._loadRequests = controllerDefinition._loadRequests
  instance.getView = () => ({ getModel: () => ({ bindContext: () => searchOperation }) })
  await instance._loadRequests('Mixed.Case@Example.Invalid')
  assert.equal(searchParameter, 'mixed.case@example.invalid')
  assert.equal(searchInvocations, 1)

  const activeUsersData = { items: [], developerItems: [], query: '', includeNonActive: false, pageSize: 100, nextSkip: 0, hasMore: false, loaded: false, busy: false, error: false }
  const activeUsersModel = {
    getProperty: key => activeUsersData[key.slice(1)],
    setProperty: (key, value) => { activeUsersData[key.slice(1)] = value }
  }
  const activeParameters = {}
  const activeOperation = {
    setParameter: (name, value) => { activeParameters[name] = value },
    invoke: async () => {},
    getBoundContext: () => ({ requestObject: async () => ({ value: [
      { userID: 'active-1', businessRole: 'DEVELOPER' },
      { userID: 'active-2', businessRole: 'TESTER' }
    ] }) })
  }
  const activeInstance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => {
      if (name === 'activeUsers') return activeUsersModel
      if (name === 'view') return { getProperty: key => key === '/selectedTab' ? 'activeUsers' : undefined, setProperty: () => {} }
      throw new Error(`Unexpected active model ${name}`)
    },
    getView: () => ({ getModel: () => ({ bindContext: () => activeOperation }) })
  })
  await activeInstance._loadActiveUsers(' Mixed Query ')
  assert.equal(activeParameters.query, 'mixed query')
  assert.equal(activeParameters.includeNonActive, false)
  assert.equal(activeParameters.skip, 0)
  assert.equal(activeParameters.top, 100)
  assert.equal(activeUsersData.items.length, 2)
  assert.equal(activeUsersData.developerItems.length, 1)
  assert.equal(activeUsersData.loaded, true)
  activeUsersData.hasMore = true
  activeUsersData.nextSkip = 2
  await activeInstance.onLoadMoreActiveUsers()
  assert.equal(activeParameters.skip, 2)
  assert.equal(activeUsersData.items.length, 2)

  const restoredData = { selectedTab: 'activeUsers' }
  const restoredActiveUsersData = { loaded: false, busy: false }
  let restoredRequestLoads = 0
  let restoredActiveLoads = 0
  const restoredModel = {
    getProperty: key => restoredData[key.slice(1)],
    setProperty: (key, value) => { restoredData[key.slice(1)] = value }
  }
  const restoredActiveModel = {
    getProperty: key => restoredActiveUsersData[key.slice(1)],
    setProperty: (key, value) => { restoredActiveUsersData[key.slice(1)] = value }
  }
  const restoredInstance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => name === 'view' ? restoredModel : restoredActiveModel,
    _loadRequests: async () => { restoredRequestLoads += 1 },
    _loadActiveUsers: async () => {
      restoredActiveLoads += 1
      restoredActiveUsersData.loaded = true
    }
  })
  await restoredInstance._loadInitialRequests()
  assert.equal(restoredRequestLoads, 1)
  assert.equal(restoredActiveLoads, 1)
  await restoredInstance.onTabSelect({ getParameter: name => name === 'key' ? 'activeUsers' : undefined, getSource: () => ({ getSelectedKey: () => 'activeUsers' }) })
  assert.equal(restoredActiveLoads, 1)

  let lifecycleInvocation
  let lifecycleData = {
    mode: 'SUSPEND',
    row: { activeUser_ID: 'active-1', provisioningVersion: 7 },
    reason: 'Controlled lifecycle review.',
    submitting: false
  }
  const lifecycleModel = {
    getData: () => lifecycleData,
    setProperty: (key, value) => { lifecycleData[key.slice(1)] = value },
    setData: data => { lifecycleData = data }
  }
  const lifecycleInstance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => name === 'lifecycle' ? lifecycleModel : { setProperty: () => {} },
    _confirm: async key => {
      assert.equal(key, 'suspendConfirmation')
      return true
    },
    _invokeAction: async (action, parameters, successKey, reloadActiveUsers) => {
      lifecycleInvocation = { action, parameters, successKey, reloadActiveUsers }
      return true
    },
    _emptyAccessLifecycle: controllerDefinition._emptyAccessLifecycle,
    _accessLifecycleDialog: { close: () => {} }
  })
  await lifecycleInstance.onConfirmAccessLifecycle()
  assert.deepEqual(JSON.parse(JSON.stringify(lifecycleInvocation)), {
    action: 'requestSuspend',
    parameters: { userID: 'active-1', reason: 'Controlled lifecycle review.', expectedVersion: 7 },
    successKey: 'suspendQueued',
    reloadActiveUsers: true
  })

  let existingLinkData = {
    row: { userID: 'legacy-1', linkEligible: true },
    email: 'new.identity@example.invalid',
    emailTouched: false,
    emailValid: true,
    submitting: false
  }
  let existingLinkInvocation
  let existingLinkClosed = 0
  const existingLinkModel = {
    getData: () => existingLinkData,
    setProperty: (key, value) => { existingLinkData[key.slice(1)] = value },
    setData: data => { existingLinkData = data }
  }
  const existingLinkInstance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => name === 'existingLink' ? existingLinkModel : { setProperty: () => {} },
    _invokeAction: async (action, parameters, successKey, reloadActiveUsers) => {
      existingLinkInvocation = { action, parameters, successKey, reloadActiveUsers }
      return true
    },
    _emptyExistingIdentityLink: controllerDefinition._emptyExistingIdentityLink,
    _existingIdentityLinkDialog: { close: () => { existingLinkClosed += 1 } }
  })
  existingLinkInstance.onExistingIdentityLinkFieldChange({ getParameter: name => name === 'value' ? 'New.Identity@Example.INVALID' : undefined })
  assert.equal(existingLinkData.emailValid, true)
  await existingLinkInstance.onConfirmExistingIdentityLink()
  assert.deepEqual(JSON.parse(JSON.stringify(existingLinkInvocation)), {
    action: 'requestExistingUserIdentityLink',
    parameters: { userID: 'legacy-1', email: 'new.identity@example.invalid' },
    successKey: 'identityLinkQueued',
    reloadActiveUsers: true
  })
  assert.equal(existingLinkClosed, 1)
  assert.equal(existingLinkData.row, null)

  existingLinkData = {
    row: { userID: 'legacy-1', linkEligible: true },
    email: 'new.identity@example.invalid',
    emailValid: true,
    submitting: true
  }
  await existingLinkInstance.onConfirmExistingIdentityLink()
  assert.equal(existingLinkClosed, 1, 'double submit must be ignored while submitting')

  let cancelInvocation
  let confirmCount = 0
  const cancelRow = { ID: 'request-1', provisioningVersion: 3, cancelEligible: true }
  const cancelInstance = Object.assign(Object.create(controllerDefinition), {
    _rowFromEvent: () => cancelRow,
    _confirm: async key => {
      confirmCount += 1
      assert.equal(key, 'cancelExistingLinkConfirmation')
      return true
    },
    _invokeAction: async (action, parameters, successKey, reloadActiveUsers) => {
      cancelInvocation = { action, parameters, successKey, reloadActiveUsers }
      return true
    }
  })
  await cancelInstance.onCancelExistingLinkInvitation({})
  assert.equal(confirmCount, 1)
  assert.deepEqual(JSON.parse(JSON.stringify(cancelInvocation)), {
    action: 'cancelExistingUserIdentityLink',
    parameters: { requestID: 'request-1', expectedVersion: 3 },
    successKey: 'existingLinkCancelled',
    reloadActiveUsers: true
  })

  cancelInvocation = null
  cancelInstance._confirm = async () => false
  await cancelInstance.onCancelExistingLinkInvitation({})
  assert.equal(cancelInvocation, null, 'dismissed confirmation must not invoke cancellation')

  let developerData = {
    userID: 'developer-user-1',
    expectedVersion: 4,
    reason: 'Adjust responsibility coverage without reassigning existing Bugs.',
    submitting: false,
    developerProfile: {
      availabilityStatusCode: 'AVAILABLE',
      workloadLimit: 3,
      responsibilities: [{ componentCategoryID: 'component-category-1', sapModuleID: null, responsibilityLevelCode: 'PRIMARY', active: true }]
    }
  }
  let developerInvocationCount = 0
  let developerConfirmCount = 0
  let developerClosedCount = 0
  let releaseDeveloperInvocation
  const developerInvocationDone = new Promise(resolve => { releaseDeveloperInvocation = resolve })
  const developerModel = {
    getData: () => developerData,
    setProperty: (key, value) => { developerData[key.slice(1)] = value }
  }
  const developerInstance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => name === 'developer' ? developerModel : { setProperty: () => {} },
    _confirm: async key => {
      developerConfirmCount += 1
      assert.equal(key, 'developerProfileConfirmation')
      return true
    },
    _invokeAction: async () => {
      developerInvocationCount += 1
      await developerInvocationDone
      return true
    },
    _developerDialog: { close: () => { developerClosedCount += 1 } }
  })
  const developerFirst = developerInstance.onConfirmDeveloperProfile()
  const developerSecond = developerInstance.onConfirmDeveloperProfile()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(developerConfirmCount, 1, 'Developer profile confirmation must be state-bound')
  assert.equal(developerInvocationCount, 1, 'Developer profile double submit must be ignored')
  assert.equal(developerData.submitting, true)
  releaseDeveloperInvocation()
  await Promise.all([developerFirst, developerSecond])
  assert.equal(developerData.submitting, false)
  assert.equal(developerClosedCount, 1)
}

function loadController (source) {
  let definition
  const BaseController = { extend: (_name, value) => { definition = value; return { prototype: value } } }
  const sandbox = {
    sap: {
      ui: {
        define: (_dependencies, factory) => factory(
          BaseController,
          { load: async () => ({}) },
          function JSONModel () {},
          { error: () => {}, warning: () => {} },
          { show: () => {} }
        )
      }
    }
  }
  vm.runInNewContext(source, sandbox, { filename: 'Main.controller.js' })
  return definition
}

for (const locale of ['i18n.properties', 'i18n_en.properties']) {
  const text = fs.readFileSync(path.join(webapp, 'i18n', locale), 'utf8')
  for (const key of ['appTitle', 'inviteUser', 'targetEmail', 'businessRole', 'userAdminCapability', 'sendInvitation', 'retryConfirmation', 'reconcileConfirmation', 'changeRoleConfirmation', 'revokeConfirmation', 'manageResponsibilities', 'developerProfileConfirmation', 'existingBugsKeepAssignee', 'accessRequestsTab', 'activeUsersTab', 'developerResponsibilitiesTab', 'activeUserSearchPlaceholder', 'includeNonActive', 'includeRevoked', 'noActiveUsers', 'activeUsersLoadFailed', 'retryActiveUsers', 'loadMoreActiveUsers', 'viewDetails', 'activeUserDetails', 'linkExistingIdentity', 'existingIdentityLinkRole', 'existingIdentityLinkNotice', 'existingIdentityLinkEmail', 'sendIdentityLink', 'identityLinkQueued', 'cancelExistingLinkInvitation', 'cancelExistingLinkConfirmation', 'existingLinkCancelled', 'accessState', 'identityLinked', 'developerReady', 'activeResponsibilityCount', 'pendingOperation', 'lastReconciled', 'developerProfile', 'close', 'activeUsersNoDeveloper', 'suspendAccess', 'reactivateAccess', 'suspendWarning', 'reactivateWarning', 'suspendQueued', 'reactivateQueued']) {
    assert.match(text, new RegExp(`^${key}=`, 'm'))
  }
  assert.match(text, /^cancelExistingLinkInvitation=Cancel invitation$/m)
  assert.match(text, /^cancelExistingLinkConfirmation=Cancel this invitation\? Its link will stop working and a new invitation can be sent\.$/m)
  assert.match(text, /^existingLinkCancelled=Invitation cancelled\.$/m)
  assert.match(text, /^existingIdentityLinkNotice=.*same Users\.ID.*Developer Profile.*Bug assignments.*comments.*history/m)
}

verifyRuntimeBehavior().then(() => {
  console.log('IDTS User Administration UI contract: PASS')
}).catch(error => {
  process.nextTick(() => { throw error })
})
