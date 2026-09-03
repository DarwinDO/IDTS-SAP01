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
assert.equal(manifest['sap.app'].dataSources.bugService?.uri, '/odata/v4/bug/')
assert.equal(manifest['sap.app'].dataSources.bugService?.settings?.odataVersion, '4.0')
assert.equal(manifest['sap.ui5'].models.bugApi?.dataSource, 'bugService')
assert.equal(manifest['sap.ui5'].models.bugApi?.type, 'sap.ui.model.odata.v4.ODataModel')
assert.equal(manifest['sap.ui5'].models.bugApi?.settings?.operationMode, 'Server')
assert.equal(manifest['sap.ui5'].models.bugApi?.settings?.autoExpandSelect, true)
assert.equal(manifest['sap.ui5'].models.bugApi?.settings?.earlyRequests, false)

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
assert.equal(appPackage.version, '1.0.20', 'Gate 7 must advance the User Administration HTML5 cache identity')
assert.equal(appPackageLock.packages[''].version, appPackage.version, 'HTML5 lockfile root version stays aligned')
assert.equal(appPackageLock.packages[''].name, appPackage.name, 'HTML5 lockfile root keeps package identity')
assert.equal(appPackageLock.packages[''].license, appPackage.license, 'HTML5 lockfile root keeps package license')
assert.deepEqual(appPackageLock.packages[''].devDependencies, appPackage.devDependencies, 'HTML5 lockfile root keeps dependency semantics')
const bugPackage = JSON.parse(fs.readFileSync(path.join(root, 'app/bug-management-ui/package.json'), 'utf8'))
assert.equal(bugPackage.version, '0.0.9', 'My Notifications metadata spacing fix must advance the Bug Management HTML5 cache identity')
const [majorVersion, minorVersion, patchVersion] = appPackage.version.split('.').map(Number)
assert.ok(
  majorVersion > 1 || minorVersion > 0 || patchVersion >= 13,
  'Gate 6.2 dialog follow-up must advance beyond deployed UI 1.0.12'
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

const controller = fs.readFileSync(path.join(webapp, 'controller/Main.controller.js'), 'utf8')
const view = fs.readFileSync(path.join(webapp, 'view/Main.view.xml'), 'utf8')

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

function tableBlockById (source, id) {
  const start = source.indexOf(`id="${id}"`)
  assert.ok(start >= 0, `${id} must exist`)
  const end = source.indexOf('</Table>', start)
  assert.ok(end > start, `${id} must have a closing Table tag`)
  return source.slice(start, end)
}

function assertHighImportanceColumn (tableSource, headerKey, tableId) {
  const line = tableSource.split(/\r?\n/).find(candidate => candidate.includes(`i18n>${headerKey}`))
  assert.ok(line, `${tableId} must contain ${headerKey}`)
  assert.match(line, /<Column\b[^>]*importance="High"/, `${tableId} must keep ${headerKey} in the main row`)
}
assert.match(controller, /setModel\(new JSONModel\([\s\S]*?\), "developerCatalogs"\)/)
assert.match(controller, /setModel\(new JSONModel\([\s\S]*?\), "businessCatalogs"\)/)
assert.match(controller, /_ensureDeveloperCatalogs[\s\S]*?getModel\("developerCatalogs"\)/)
assert.match(controller, /_loadCatalogs[\s\S]*?getModel\("businessCatalogs"\)/)
assert.doesNotMatch(controller, /getModel\("catalogs"\)/)
assert.match(view, /<SearchField/)
assert.match(view, /<Table/)
assert.match(view, /items="\{requests>\/items\}"/)
assert.match(view, /press="\.onOpenInvite"/)
const headerActionsMatch = view.match(/<f:actions>[\s\S]*?<\/f:actions>/)
assert.ok(headerActionsMatch, 'dynamic page header actions must be present')
const headerButtons = [...headerActionsMatch[0].matchAll(/<Button\b[\s\S]*?\/>/g)].map(match => match[0])
assert.equal(headerButtons.length, 2, 'header must keep the navigation and Invite User actions')
const bugManagementAction = headerButtons[0]
assert.match(bugManagementAction, /text="\{i18n>bugManagementOpenAction\}"/)
assert.match(bugManagementAction, /tooltip="\{i18n>bugManagementOpenActionTooltip\}"/)
assert.match(bugManagementAction, /type="Transparent"/)
assert.match(bugManagementAction, /icon="sap-icon:\/\/nav-back"/)
assert.match(bugManagementAction, /press="\.onOpenBugManagement"/)
assert.match(headerButtons[1], /text="\{i18n>inviteUser\}"/)
assert.match(headerButtons[1], /type="Emphasized"/)
assert.match(view, /press="\.onApproveProvisioning"/)
assert.match(view, /press="\.onRetryAccessOperation"/)
assert.match(view, /press="\.onReconcileAccessOperation"/)
assert.match(view, /press="\.onCancelExistingLinkInvitation"/)
assert.match(view, /requests>cancelEligible/)
assert.match(view, /status_code\} === 'RETRYABLE_FAILURE'[\s\S]+lastErrorCode\} === 'PROVIDER_REQUEST_INVALID'[\s\S]+latestOperationAttemptCount\} === 4/)
assert.match(view, /status_code\} === 'BLOCKED_MANUAL_REVIEW'[\s\S]+lastErrorCode\} === 'AMBIGUOUS_PROVIDER_OUTCOME'/)
assert.doesNotMatch(view, /type="Password"|tokenHash|tokenNonce|identityIssuer/)
assert.match(view, /<IconTabBar/)
assert.match(view, /key="access"/)
assert.match(view, /key="developers"/)
assert.match(view, /key="businessCatalogs"/)
assert.match(view, /key="operations"/)
assert.match(view, /key="deliveries"/)
assert.match(view, /key="provisioning"/)
assert.match(view, /key="audit"/)
assert.doesNotMatch(view, /sap-icon:\/\/skills/, 'skills is not a valid SAPUI5 icon for this UI')
assert.equal((view.match(/icon="sap-icon:\/\/activity-individual"/g) || []).length, 1)
assert.equal((view.match(/icon="sap-icon:\/\/action-settings"/g) || []).length, 2)
const mainIconTabBarOpenMatch = view.match(/<IconTabBar[\s\S]*?id="administrationTabs"[\s\S]*?tabsOverflowMode="End">/)
assert.ok(mainIconTabBarOpenMatch, 'main administration IconTabBar opening tag is complete')
const mainIconTabBarOpen = mainIconTabBarOpenMatch[0]
assert.match(mainIconTabBarOpen, /id="administrationTabs"/)
assert.match(mainIconTabBarOpen, /headerMode="Inline"/)
assert.match(mainIconTabBarOpen, /tabDensityMode="Compact"/)
assert.match(mainIconTabBarOpen, /tabsOverflowMode="End"/)
const mainTabTooltips = {
  access: 'accessTabTooltip',
  developers: 'developersTabTooltip',
  operations: 'operationsTabTooltip',
  audit: 'auditTabTooltip',
  businessCatalogs: 'businessCatalogsTabTooltip'
}
for (const [tabKey, tooltipKey] of Object.entries(mainTabTooltips)) {
  const tab = view.match(new RegExp(`<IconTabFilter\\b[\\s\\S]*?\\bkey="${tabKey}"[\\s\\S]*?tooltip="\\{i18n>${tooltipKey}\\}">`))
  assert.ok(tab, `main tab is present: ${tabKey}`)
}
assert.match(view, /id="accessSubtabs"[\s\S]*?selectedKey="\{view>\/selectedAccessTab\}"[\s\S]*?select="\.onAccessTabSelect"/)
assert.match(view, /id="developerSubtabs"[\s\S]*?selectedKey="\{view>\/selectedDeveloperTab\}"[\s\S]*?select="\.onDeveloperTabSelect"/)
assert.match(view, /key="requests"/)
assert.match(view, /key="activeUsers"/)
assert.match(view, /key="developerResponsibilities"/)
assert.match(view, /key="developerWorkload"/)
assert.ok(view.indexOf('key="developerWorkload"') < view.indexOf('key="developerResponsibilities"'), 'Workload must precede Responsibilities')
const requestTableStart = view.indexOf('id="onboardingTable"')
const requestTable = view.slice(requestTableStart, view.indexOf('</Table>', requestTableStart))
const requestButtons = [...requestTable.matchAll(/<Button[\s\S]*?\/>/g)].map(match => match[0])
assert.doesNotMatch(requestTable, /onOpenRoleChange|onOpenDeveloperProfile|onOpenRevoke/)
assert.equal(requestButtons.some(button => button.includes('onApproveProvisioning')), true)
assert.equal(requestButtons.some(button => button.includes('onRetryAccessOperation')), true)
assert.equal(requestButtons.some(button => button.includes('onReconcileAccessOperation')), true)
assert.equal(requestButtons.some(button => button.includes('onCancelExistingLinkInvitation')), true)
assert.match(view, /items="\{deliveries>\/items\}"/)
assert.match(view, /selectedKey="\{deliveries>\/deliveryType\}"/)
assert.match(view, /deliveryTypeFilter/)
assert.match(view, /allDeliveryTypes/)
assert.match(view, /invitationDeliveryType/)
assert.match(view, /accessChangeDeliveryType/)
assert.match(view, /digestDeliveryType/)
assert.match(view, /deliveries>deliveryTypeLabel/)
assert.match(view, /deliveries>eventTypeLabel/)
assert.equal((view.match(/id="deliveryOperationsTable"/g) || []).length, 1, 'Delivery remains one unified table')
assert.match(view, /items="\{operations>\/items\}"/)
assert.match(view, /items="\{audit>\/items\}"/)
for (const readinessPath of ['emailDeliveryState', 'provisioningBrokerState', 'lastSuccessfulReconciliationAt']) {
  assert.match(view, new RegExp(`adminReadiness>/${readinessPath}`), `readiness binding must use an absolute named-model path: ${readinessPath}`)
  assert.doesNotMatch(view, new RegExp(`adminReadiness>${readinessPath}`), `readiness binding must not use a relative named-model path: ${readinessPath}`)
}
assert.match(view, /press="\.onRetryOnboardingDelivery"/)
assert.match(view, /press="\.onOpenOperationDetails"/)
assert.match(view, /press="\.onOpenAuditDetails"/)
assert.match(view, /visible="\{deliveries>canRetry\}" enabled="\{= !\$\{view>\/busy\} \}" press="\.onRetryOnboardingDelivery"/)
assert.match(view, /visible="\{operations>canRetry\}" enabled="\{= !\$\{view>\/busy\} \}" press="\.onRetryAccessOperation"/)
assert.match(view, /visible="\{operations>canReconcile\}" enabled="\{= !\$\{view>\/busy\} \}" press="\.onReconcileAccessOperation"/)
assert.match(view, /selectedKey="\{audit>\/action\}"/)
assert.match(view, /formatter: 'formatter\.operationTypeText'/)
assert.match(view, /formatter: 'formatter\.auditActionText'/)
assert.match(view, /formatter: 'formatter\.resultText'/)
assert.ok(fs.existsSync(path.join(webapp, 'fragment/OperationDetails.fragment.xml')), 'operations detail fragment is missing')
assert.ok(fs.existsSync(path.join(webapp, 'fragment/AuditDetails.fragment.xml')), 'audit detail fragment is missing')
assert.match(view, /id="catalogTypeTabs"/)
for (const catalogType of ['SAP_MODULE', 'APPLICATION_COMPONENT', 'DEFECT_CATEGORY', 'COMPONENT_CATEGORY']) {
  assert.match(view, new RegExp(`key="${catalogType}"`))
}
assert.match(view, /items="\{businessCatalogs>\/items\}"/)
assert.match(view, /press="\.onOpenCatalogCreate"/)
assert.match(view, /press="\.onOpenCatalogEdit"/)
assert.match(view, /press="\.onToggleCatalogActive"/)
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

for (const tableId of [
  'activeUsersTable',
  'developerWorkloadTable',
  'deliveryOperationsTable',
  'provisioningOperationsTable',
  'administrationAuditTable'
]) {
  const openingTag = openingTagById(view, 'Table', tableId)
  assert.match(openingTag, /autoPopinMode="true"/, `${tableId} must use native automatic pop-in`)
  assert.match(openingTag, /contextualWidth="Auto"/, `${tableId} must calculate breakpoints from its container`)
  assertHighImportanceColumn(tableBlockById(view, tableId), 'actions', tableId)
}
assertHighImportanceColumn(activeUsersTable, 'user', 'activeUsersTable')
assertHighImportanceColumn(tableBlockById(view, 'developerWorkloadTable'), 'user', 'developerWorkloadTable')

const developerWorkloadDetailsFragment = fs.readFileSync(path.join(webapp, 'fragment/DeveloperWorkloadDetails.fragment.xml'), 'utf8')
const workloadBugsOpeningTag = openingTagById(developerWorkloadDetailsFragment, 'Table', 'developerWorkloadBugsTable')
assert.match(workloadBugsOpeningTag, /autoPopinMode="true"/)
assert.match(workloadBugsOpeningTag, /contextualWidth="Auto"/)
const workloadBugsTable = tableBlockById(developerWorkloadDetailsFragment, 'developerWorkloadBugsTable')
assertHighImportanceColumn(workloadBugsTable, 'bugNumber', 'developerWorkloadBugsTable')
assertHighImportanceColumn(workloadBugsTable, 'title', 'developerWorkloadBugsTable')
assertHighImportanceColumn(workloadBugsTable, 'actions', 'developerWorkloadBugsTable')

const activeUserDetailsFragment = fs.readFileSync(path.join(webapp, 'fragment/ActiveUserDetails.fragment.xml'), 'utf8')
const editUserInformationFragment = fs.readFileSync(path.join(webapp, 'fragment/EditUserInformation.fragment.xml'), 'utf8')
assert.match(activeUserDetailsFragment, /<Dialog/)
assert.match(activeUserDetailsFragment, /activeUsers>\/details/)
assert.match(activeUserDetailsFragment, /press="\.onCloseActiveUserDetails"/)
assert.match(activeUserDetailsFragment, /press="\.onOpenEditUserInformation"/)
assert.match(editUserInformationFragment, /activeUsers>\/editProfile\/displayName/)
assert.match(editUserInformationFragment, /activeUsers>\/editProfile\/reason/)
assert.match(editUserInformationFragment, /press="\.onConfirmEditUserInformation"/)
assert.match(editUserInformationFragment, /press="\.onCancelEditUserInformation"/)
assert.doesNotMatch(activeUserDetailsFragment, /requestRoleChange|requestRevoke|updateDeveloperProfile|onConfirmAccessChange|onConfirmDeveloperProfile|onOpenRevoke|onRevoke/i)
assert.match(activeUserDetailsFragment, /press="\.onOpenActiveUserRoleChange"/)
assert.match(activeUserDetailsFragment, /press="\.onOpenActiveUserSuspend"/)
assert.match(activeUserDetailsFragment, /press="\.onOpenActiveUserReactivate"/)
assert.match(activeUserDetailsFragment, /press="\.onOpenActiveUserRevoke"/)
assert.match(activeUserDetailsFragment, /linkEligible/)
assert.match(activeUserDetailsFragment, /press="\.onOpenExistingIdentityLink"/)
assert.match(activeUserDetailsFragment, /<HBox width="100%" wrap="Wrap" class="sapUiSmallMarginTop">/)
assert.doesNotMatch(activeUserDetailsFragment, /<Toolbar/)
assert.doesNotMatch(activeUserDetailsFragment, /press="\.onOpenDeveloperProfile"/)
assert.match(controller, /accessRequestVersion/, 'Active User details must build actions from the authoritative details DTO')
assert.doesNotMatch(controller, /_requestForActiveUser/, 'Active User actions must not depend on the filtered Access Requests model')

const developerResponsibilitiesTableStart = view.indexOf('id="developerResponsibilitiesTable"')
const developerResponsibilitiesTable = view.slice(developerResponsibilitiesTableStart, view.indexOf('</Table>', developerResponsibilitiesTableStart))
assert.match(developerResponsibilitiesTable, /press="\.onOpenDeveloperProfile"/)
assert.match(developerResponsibilitiesTable, /visible="\{= \$\{activeUsers>accessState\} === 'ACTIVE' \}"/)

for (const [fragmentName, firstLabel] of [
  ['DeliveryDetails.fragment.xml', 'recipient'],
  ['OperationDetails.fragment.xml', 'operation'],
  ['AuditDetails.fragment.xml', 'auditAction']
]) {
  const detailsFragment = fs.readFileSync(path.join(webapp, 'fragment', fragmentName), 'utf8')
  assert.match(detailsFragment, /<VBox class="sapUiSmallMargin">/)
  assert.doesNotMatch(detailsFragment, /<VBox class="sapUiResponsiveContentPadding">/)
  const labels = [...detailsFragment.matchAll(/<Label\b[\s\S]*?\/>/g)].map(match => match[0])
  assert.ok(labels.length > 1, `${fragmentName} must contain multiple detail labels`)
  assert.match(labels[0], new RegExp(`text="\\{i18n>${firstLabel}\\}"`))
  assert.doesNotMatch(labels[0], /class="sapUiSmallMarginTop"/)
  assert.ok(
    labels.slice(1).every(label => label.includes('class="sapUiSmallMarginTop"')),
    `${fragmentName} must space every label after the first with sapUiSmallMarginTop`
  )
}

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
assert.match(fragment, /invite>\/displayName/)
assert.match(fragment, /onInviteDisplayNameChange/)
assert.match(fragment, /<Select/)
assert.match(fragment, /<CheckBox/)
assert.match(fragment, /press="\.onConfirmInvite"/)
assert.match(fragment, /invite>\/developerProfile\/responsibilities/)
assert.match(fragment, /press="\.onAddInviteResponsibility"/)
assert.match(fragment, /valueState="\{=/)
assert.match(fragment, /valueLiveUpdate="true"/)
assert.match(fragment, /!\$\{invite>\/submitting\}/)
assert.doesNotMatch(fragment, /Password|OTP|passkey|token/i)

assert.match(controller, /searchAdministrationDeliveries/)
assert.match(controller, /searchAccessOperations/)
assert.match(controller, /searchAccessAuditEvents/)
assert.match(controller, /readAdministrationReadiness/)
assert.match(controller, /retryOnboardingDelivery/)
assert.match(controller, /retryUserAccessDelivery/)
assert.match(controller, /onDeliveryTypeChange/)
assert.match(controller, /deliveryTypeLabel/)
assert.match(controller, /eventTypeLabel/)
assert.match(controller, /_ensureOperationsLoaded/)
assert.match(controller, /^sap\.ui\.define\(/)
assert.doesNotMatch(controller, /normalizeCurrentBootstrapPm|bootstrapPmNormalize/, 'temporary PM normalization UI must be removed')
assert.doesNotMatch(activeUserDetailsFragment, /bootstrapPmNormalize|onNormalizeCurrentBootstrapPm/, 'temporary PM normalization button must be removed')
assert.match(controller, /bindContext\("\/requestOnboarding\(\.\.\.\)"\)/)
assert.match(controller, /setParameter\("displayName"/)
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
assert.match(controller, /bindContext\("\/updateActiveUserDisplayName\(\.\.\.\)"\)/)
assert.match(controller, /setParameter\("expectedModifiedAt"/)
assert.match(controller, /onTabSelect/)
assert.match(controller, /_ensureActiveUsersLoaded/)
assert.match(controller, /onLoadMoreActiveUsers/)
assert.match(controller, /_deliveriesRequest/)
assert.match(controller, /_operationsRequest/)
assert.match(controller, /_auditRequest/)
assert.match(controller, /_normalizeAuditDate/)
assert.match(controller, /setParameter\("from", this\._normalizeAuditDate/)
assert.match(controller, /setParameter\("to", this\._normalizeAuditDate/)
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
assert.match(formatter, /operationStateText/)
assert.match(formatter, /operationTypeText/)
assert.match(formatter, /auditActionText/)
assert.match(formatter, /resultText/)
assert.match(formatter, /sAvailable, sUnavailable, sRecentSuccess, sStale, sUnknown/)
assert.match(formatter, /sPending, sFailed, sSent, sSkipped, sUnknown/)
assert.match(formatter, /readinessText/)
assert.match(formatter, /readinessState/)

const manageFragment = fs.readFileSync(path.join(webapp, 'fragment/ManageAccess.fragment.xml'), 'utf8')
assert.match(manageFragment, /<Select/)
assert.match(manageFragment, /<CheckBox/)
assert.match(manageFragment, /<TextArea/)
assert.match(manageFragment, /valueLiveUpdate="true"/)
assert.match(manageFragment, /type="\{= \$\{access>\/mode\} === 'REVOKE' \? 'Negative' : 'Emphasized' \}"/)
assert.match(manageFragment, /press="\.onConfirmAccessChange"/)
assert.match(manageFragment, /text="\{i18n>changeRoleResponsibilitiesHint\}"/)
assert.match(manageFragment, /visible="\{= \$\{access>\/mode\} === 'CHANGE_ROLE' \}"/)
assert.match(manageFragment, /\$\{access>\/currentRole\} !== 'DEVELOPER'/)
assert.match(manageFragment, /\$\{access>\/role\} === 'DEVELOPER'/)
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

const editCatalogFragment = fs.readFileSync(path.join(webapp, 'fragment/EditCatalogItem.fragment.xml'), 'utf8')
assert.match(editCatalogFragment, /<Dialog/)
assert.match(editCatalogFragment, /businessCatalogs>\/edit/)
assert.match(editCatalogFragment, /press="\.onConfirmCatalogEdit"/)
assert.match(editCatalogFragment, /edit\/componentType/)
assert.match(editCatalogFragment, /edit\/categoryType/)
assert.match(editCatalogFragment, /valueState="/)
assert.match(editCatalogFragment, /valueStateText="/)
assert.doesNotMatch(editCatalogFragment, /Delete|Hard delete|HANA|Role Collection|token|credential/i)

const catalogImpactFragment = fs.readFileSync(path.join(webapp, 'fragment/CatalogImpact.fragment.xml'), 'utf8')
assert.match(catalogImpactFragment, /<Dialog/)
assert.match(catalogImpactFragment, /businessCatalogs>\/impact/)
assert.match(catalogImpactFragment, /press="\.onConfirmCatalogDeactivation"/)
assert.doesNotMatch(catalogImpactFragment, /Delete|HANA|Role Collection|token|credential/i)

const deliveryDetailsFragment = fs.readFileSync(path.join(webapp, 'fragment/DeliveryDetails.fragment.xml'), 'utf8')
assert.match(deliveryDetailsFragment, /i18n>sentAt/)
assert.match(deliveryDetailsFragment, /deliveries>\/selected\/sentAt/)
assert.match(deliveryDetailsFragment, /i18n>lastAttempt/)
assert.match(deliveryDetailsFragment, /deliveries>\/selected\/lastAttemptAt/)
for (const detailTimestamp of ['sentAt', 'lastAttemptAt', 'nextAttemptAt']) {
  assert.match(deliveryDetailsFragment, new RegExp(`deliveries>\\/selected\\/${detailTimestamp}Display`), `${detailTimestamp} must have a safe empty-detail display`)
}

const controllerDefinition = loadController(controller)
assert.equal(typeof controllerDefinition.onConfirmInvite, 'function')
assert.equal(typeof controllerDefinition.onOpenBugManagement, 'function')
assert.equal(typeof controllerDefinition._loadRequests, 'function')
assert.equal(typeof controllerDefinition._loadInitialRequests, 'function')
assert.equal(typeof controllerDefinition.onAfterRendering, 'function')
assert.equal(typeof controllerDefinition.onTabSelect, 'function')
assert.equal(typeof controllerDefinition._loadActiveUsers, 'function')
assert.equal(typeof controllerDefinition._ensureActiveUsersLoaded, 'function')
assert.equal(typeof controllerDefinition.onLoadMoreActiveUsers, 'function')
assert.equal(typeof controllerDefinition.onOpenActiveUserDetails, 'function')
assert.equal(typeof controllerDefinition.onOpenEditUserInformation, 'function')
assert.equal(typeof controllerDefinition.onConfirmEditUserInformation, 'function')
assert.equal(typeof controllerDefinition.onCancelEditUserInformation, 'function')
assert.equal(typeof controllerDefinition.onConfirmExistingIdentityLink, 'function')
assert.equal(typeof controllerDefinition.onExistingIdentityLinkFieldChange, 'function')
assert.equal(typeof controllerDefinition._loadCatalogs, 'function')
assert.equal(typeof controllerDefinition.onOpenCatalogCreate, 'function')
assert.equal(typeof controllerDefinition.onOpenCatalogEdit, 'function')
assert.equal(typeof controllerDefinition.onConfirmCatalogEdit, 'function')
assert.equal(typeof controllerDefinition.onToggleCatalogActive, 'function')
assert.equal(typeof controllerDefinition.onConfirmCatalogDeactivation, 'function')
  assert.equal(typeof controllerDefinition.onOperationsTabSelect, 'function')
  assert.equal(typeof controllerDefinition.onDeliveryTypeChange, 'function')
  assert.equal(typeof controllerDefinition.onRetryDelivery, 'function')
  assert.equal(typeof controllerDefinition.onRetryOnboardingDelivery, 'function')
assert.equal(typeof controllerDefinition.onOpenDeliveryDetails, 'function')
assert.equal(typeof controllerDefinition.onOpenOperationDetails, 'function')
assert.equal(typeof controllerDefinition.onOpenAuditDetails, 'function')
  assert.equal(typeof controllerDefinition._loadDeliveries, 'function')
  assert.equal(typeof controllerDefinition._normalizeDeliveryRow, 'function')
assert.equal(typeof controllerDefinition._loadOperations, 'function')
assert.equal(typeof controllerDefinition._loadAudit, 'function')
assert.equal(typeof controllerDefinition._loadReadiness, 'function')
assert.equal(typeof controllerDefinition._normalizeAuditDate, 'function')
assert.match(controller, /this\.getResourceBundle\(\)/)

async function verifyRuntimeBehavior () {
  const navigationCalls = []
  const navigationDefinition = loadController(controller, {
    location: { assign: url => navigationCalls.push(url) }
  })
  Object.create(navigationDefinition).onOpenBugManagement()
  assert.deepEqual(navigationCalls, ['/idtsbugmanagementui/index.html'])
  assert(!/[?#]|returnTo|:\/\//.test(navigationCalls[0]))
  const unavailableNavigation = Object.create(loadController(controller, { location: {} }))
  assert.doesNotThrow(() => unavailableNavigation.onOpenBugManagement())
  assert.deepEqual(navigationCalls, ['/idtsbugmanagementui/index.html'])

  const dateNormalizer = Object.create(controllerDefinition)
  assert.equal(dateNormalizer._normalizeAuditDate('2026-08-24', false), '2026-08-24T00:00:00.000Z')
  assert.equal(dateNormalizer._normalizeAuditDate('2026-08-24', true), '2026-08-24T23:59:59.999Z')
  assert.equal(dateNormalizer._normalizeAuditDate('', false), null)
  assert.equal(dateNormalizer._normalizeAuditDate(null, true), null)
  assert.equal(dateNormalizer._normalizeAuditDate('not-a-date', false), null)

  const readinessCases = [
    {
      name: 'direct structured action result',
      invokeResult: { emailDeliveryState: 'AVAILABLE', provisioningBrokerState: 'RECENT_SUCCESS', lastSuccessfulReconciliationAt: '2026-08-24T10:00:00.000Z' },
      contextResult: null,
      expected: { emailDeliveryState: 'AVAILABLE', provisioningBrokerState: 'RECENT_SUCCESS', lastSuccessfulReconciliationAt: '2026-08-24T10:00:00.000Z' }
    },
    {
      name: 'direct structured UI5 context result',
      invokeResult: undefined,
      contextResult: { emailDeliveryState: 'AVAILABLE', provisioningBrokerState: 'RECENT_SUCCESS', lastSuccessfulReconciliationAt: '2026-08-24T10:00:00.000Z' },
      expected: { emailDeliveryState: 'AVAILABLE', provisioningBrokerState: 'RECENT_SUCCESS', lastSuccessfulReconciliationAt: '2026-08-24T10:00:00.000Z' }
    },
    {
      name: 'UI5 value-wrapped action result',
      invokeResult: undefined,
      contextResult: { value: { emailDeliveryState: 'UNAVAILABLE', provisioningBrokerState: 'UNKNOWN', lastSuccessfulReconciliationAt: null } },
      expected: { emailDeliveryState: 'UNAVAILABLE', provisioningBrokerState: 'UNKNOWN', lastSuccessfulReconciliationAt: null }
    },
    {
      name: 'UI5 invoke Context with direct result',
      invokeResult: { requestObject: async () => ({ emailDeliveryState: 'AVAILABLE', provisioningBrokerState: 'RECENT_SUCCESS', lastSuccessfulReconciliationAt: '2026-08-24T10:00:00.000Z' }) },
      contextResult: null,
      expected: { emailDeliveryState: 'AVAILABLE', provisioningBrokerState: 'RECENT_SUCCESS', lastSuccessfulReconciliationAt: '2026-08-24T10:00:00.000Z' }
    },
    {
      name: 'UI5 invoke Context with value-wrapped result',
      invokeResult: { requestObject: async () => ({ value: { emailDeliveryState: 'UNAVAILABLE', provisioningBrokerState: 'UNKNOWN', lastSuccessfulReconciliationAt: null } }) },
      contextResult: null,
      expected: { emailDeliveryState: 'UNAVAILABLE', provisioningBrokerState: 'UNKNOWN', lastSuccessfulReconciliationAt: null }
    }
  ]
  for (const readinessCase of readinessCases) {
    const readinessData = { emailDeliveryState: 'UNKNOWN', provisioningBrokerState: 'UNKNOWN', lastSuccessfulReconciliationAt: null, loaded: false, busy: false, error: true }
    const readinessModel = {
      setData: data => Object.assign(readinessData, data),
      setProperty: (key, value) => { readinessData[key.slice(1)] = value }
    }
    const readinessOperation = {
      invoke: async () => readinessCase.invokeResult,
      getBoundContext: () => readinessCase.contextResult ? { requestObject: async () => readinessCase.contextResult } : null
    }
    const readinessInstance = Object.assign(Object.create(controllerDefinition), {
      getModel: name => name === 'adminReadiness' ? readinessModel : undefined,
      getView: () => ({ getModel: () => ({ bindContext: () => readinessOperation }) })
    })
    await readinessInstance._loadReadiness()
    assert.deepEqual({
      emailDeliveryState: readinessData.emailDeliveryState,
      provisioningBrokerState: readinessData.provisioningBrokerState,
      lastSuccessfulReconciliationAt: readinessData.lastSuccessfulReconciliationAt
    }, readinessCase.expected, `${readinessCase.name} must expose readiness fields at model top level`)
    assert.equal(readinessData.loaded, true, `${readinessCase.name} must mark readiness loaded`)
    assert.equal(readinessData.busy, false, `${readinessCase.name} must clear busy`)
    assert.equal(readinessData.error, false, `${readinessCase.name} must clear error`)
    assert.equal(Object.hasOwn(readinessData, 'value'), false, `${readinessCase.name} must not retain a value wrapper`)
  }

  const failedReadinessData = { emailDeliveryState: 'UNKNOWN', provisioningBrokerState: 'UNKNOWN', lastSuccessfulReconciliationAt: null, loaded: false, busy: false, error: false }
  const failedReadinessModel = {
    setData: data => Object.assign(failedReadinessData, data),
    setProperty: (key, value) => { failedReadinessData[key.slice(1)] = value }
  }
  const failedReadinessInstance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => name === 'adminReadiness' ? failedReadinessModel : undefined,
    getView: () => ({ getModel: () => ({ bindContext: () => ({ invoke: async () => { throw new Error('readiness unavailable') } }) }) })
  })
  await failedReadinessInstance._loadReadiness()
  assert.equal(failedReadinessData.busy, false, 'failed readiness must clear busy')
  assert.equal(failedReadinessData.error, true, 'failed readiness must retain error state')

  const deliveryNormalizer = Object.assign(Object.create(controllerDefinition), {
    _text: async key => `label:${key}`
  })
  const normalizedAccessDelivery = await deliveryNormalizer._normalizeDeliveryRow({
    deliveryID: 'access-delivery-1',
    deliveryType: 'ACCESS_CHANGE',
    eventType: 'ACCESS_SUSPENDED',
    recipientDisplay: 'd***@example.invalid',
    status: 'FAILED',
    attemptCount: 1,
    errorCode: 'SMTP_TIMEOUT',
    errorSummary: 'A safe delivery failure.',
    canRetry: true,
    modifiedAt: '2026-08-26T08:00:00.000Z'
  })
  assert.equal(normalizedAccessDelivery.deliveryTypeLabel, 'label:accessChangeDeliveryType')
  assert.equal(normalizedAccessDelivery.eventTypeLabel, 'label:suspendedEvent')
  assert.equal(normalizedAccessDelivery.recipientDisplay, 'd***@example.invalid')
  assert.equal(normalizedAccessDelivery.safeErrorSummary, 'A safe delivery failure.')
  for (const forbidden of ['recipientEmail', 'subject', 'textBody', 'htmlBody', 'providerMessageId', 'sourceAuditEvent_ID', 'targetUser_ID', 'lockToken', 'lockedUntil']) {
    assert.equal(forbidden in normalizedAccessDelivery, false, `UI delivery row forbids ${forbidden}`)
  }
  const normalizedDigestDelivery = await deliveryNormalizer._normalizeDeliveryRow({
    deliveryID: 'digest-delivery-1',
    deliveryType: 'DIGEST',
    eventType: 'DIGEST',
    recipientDisplay: 'd***@example.invalid',
    status: 'FAILED',
    attemptCount: 1,
    errorSummary: 'Email provider request failed.',
    canRetry: false
  })
  assert.equal(normalizedDigestDelivery.deliveryTypeLabel, 'label:digestDeliveryType')
  assert.equal(normalizedDigestDelivery.eventTypeLabel, 'label:dailyDigestEvent')
  assert.equal(normalizedDigestDelivery.canRetry, false)
  const normalizedEmptyDelivery = await deliveryNormalizer._normalizeDeliveryRow({
    deliveryID: 'empty-delivery', deliveryType: 'ACCESS_CHANGE', eventType: 'UNKNOWN_EVENT'
  })
  assert.equal(normalizedEmptyDelivery.recipientDisplay, 'label:emptyDetail')
  assert.equal(normalizedEmptyDelivery.eventTypeLabel, 'label:emptyDetail')
  assert.equal(normalizedEmptyDelivery.safeErrorSummary, 'label:emptyDetail')
  for (const detailTimestamp of ['sentAt', 'lastAttemptAt', 'nextAttemptAt']) {
    assert.equal(normalizedEmptyDelivery[`${detailTimestamp}Display`], 'label:emptyDetail', `${detailTimestamp} empty value uses the em-dash display fallback`)
  }

  const deliveryData = {
    items: [], query: 'masked', status: 'FAILED', deliveryType: 'ACCESS_CHANGE', nextSkip: 0,
    pageSize: 25, hasMore: false, loaded: false, busy: false, error: false, selected: null, detailsBusy: false
  }
  const deliveryParameters = {}
  const deliveryOperation = {
    setParameter: (name, value) => { deliveryParameters[name] = value },
    invoke: async () => {},
    getBoundContext: () => ({ requestObject: async () => ({ value: [{
      deliveryID: 'access-delivery-2', deliveryType: 'ACCESS_CHANGE', eventType: 'ACCESS_REVOKED',
      recipientDisplay: 'r***@example.invalid', status: 'FAILED', attemptCount: 2, canRetry: false
    }] }) })
  }
  const deliveryModel = {
    getProperty: key => deliveryData[key.slice(1)],
    setProperty: (key, value) => { deliveryData[key.slice(1)] = value }
  }
  const deliveryInstance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => name === 'deliveries' ? deliveryModel : undefined,
    getView: () => ({ getModel: () => ({ bindContext: () => deliveryOperation }) }),
    _text: async key => `label:${key}`
  })
  await deliveryInstance._loadDeliveries()
  assert.deepEqual(deliveryParameters, { deliveryType: 'ACCESS_CHANGE', status: 'FAILED', query: 'masked', skip: 0, top: 25 })
  assert.equal(deliveryData.items[0].eventTypeLabel, 'label:revokedEvent')
  assert.equal(deliveryData.loaded, true)
  assert.equal(deliveryData.busy, false)
  assert.equal(deliveryData.error, false)

  let typeChangeLoadCount = 0
  const typeChangeData = { deliveryType: 'ALL' }
  const typeChangeInstance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => name === 'deliveries' ? {
      setProperty: (key, value) => { typeChangeData[key.slice(1)] = value },
      getProperty: key => typeChangeData[key.slice(1)]
    } : undefined,
    _saveActiveUsersSessionState: () => {},
    _loadDeliveries: async () => { typeChangeLoadCount += 1 }
  })
  await typeChangeInstance.onDeliveryTypeChange({ getParameter: name => name === 'selectedItem' ? { getKey: () => 'INVITATION' } : undefined })
  assert.equal(typeChangeData.deliveryType, 'INVITATION')
  assert.equal(typeChangeLoadCount, 1)

  const typedRetryCalls = []
  const typedRetryInstance = Object.assign(Object.create(controllerDefinition), {
    _operationsRowFromEvent: () => ({ deliveryID: 'access-delivery-3', deliveryType: 'ACCESS_CHANGE', modifiedAt: 'access-version' }),
    _confirm: async key => { assert.equal(key, 'retryDeliveryConfirmation'); return true },
    _invokeOperationsAction: async (...args) => { typedRetryCalls.push(args) },
    _text: async key => key
  })
  await typedRetryInstance.onRetryDelivery({})
  assert.deepEqual(JSON.parse(JSON.stringify(typedRetryCalls[0])), ['retryUserAccessDelivery', { deliveryID: 'access-delivery-3', expectedModifiedAt: 'access-version' }, 'deliveryRetryQueued', 'deliveries'])
  typedRetryInstance._operationsRowFromEvent = () => ({ deliveryID: 'invitation-delivery-1', deliveryType: 'INVITATION', modifiedAt: 'invitation-version' })
  await typedRetryInstance.onRetryDelivery({})
  assert.deepEqual(JSON.parse(JSON.stringify(typedRetryCalls[1])), ['retryOnboardingDelivery', { deliveryID: 'invitation-delivery-1', expectedModifiedAt: 'invitation-version' }, 'deliveryRetryQueued', 'deliveries'])
  for (const invalidDeliveryType of ['UNKNOWN', undefined]) {
    typedRetryInstance._operationsRowFromEvent = () => ({ deliveryID: 'invalid-delivery', deliveryType: invalidDeliveryType, modifiedAt: 'invalid-version' })
    const invalidRetryResult = await typedRetryInstance.onRetryDelivery({})
    assert.equal(invalidRetryResult, false, 'unknown delivery types fail closed with a safe result')
  }
  assert.equal(typedRetryCalls.length, 2, 'unknown or missing delivery types must not invoke an OData retry action')

  const auditData = { items: [], action: '', result: '', from: '2026-08-24', to: '2026-08-25', nextSkip: 0, pageSize: 25, hasMore: false, loaded: false, busy: false, error: false }
  const auditParameters = {}
  const auditOperation = {
    setParameter: (name, value) => { auditParameters[name] = value },
    invoke: async () => {},
    getBoundContext: () => ({ requestObject: async () => ({ value: [] }) })
  }
  const auditModel = {
    getProperty: key => auditData[key.slice(1)],
    setProperty: (key, value) => { auditData[key.slice(1)] = value }
  }
  const auditInstance = Object.assign(Object.create(controllerDefinition), {
    _auditRequest: 0,
    getModel: name => name === 'audit' ? auditModel : undefined,
    getView: () => ({ getModel: () => ({ bindContext: () => auditOperation }) })
  })
  await auditInstance._loadAudit()
  assert.equal(auditParameters.from, '2026-08-24T00:00:00.000Z')
  assert.equal(auditParameters.to, '2026-08-25T23:59:59.999Z')
  auditData.from = 'not-a-date'
  auditData.to = ''
  await auditInstance._loadAudit()
  assert.equal(auditParameters.from, null)
  assert.equal(auditParameters.to, null)

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
    displayName: 'Controlled Test User',
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

  inviteData.displayName = ''
  instance.onInviteDisplayNameChange({ getParameter: name => name === 'value' ? '  New Person  ' : undefined })
  assert.equal(inviteData.displayName, '  New Person  ')
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

  const detailsData = { details: null, detailsBusy: false }
  const detailsModel = {
    getProperty: key => detailsData[key.slice(1)],
    setProperty: (key, value) => { detailsData[key.slice(1)] = value }
  }
  const detailsOperation = {
    setParameter: () => {},
    invoke: async () => {},
    getBoundContext: () => ({ requestObject: async () => ({
      userID: 'active-2',
      businessRole: 'TESTER',
      userAdminCapability: false,
      accessState: 'ACTIVE',
      accessRequestVersion: 9
    }) })
  }
  const detailsInstance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => {
      if (name === 'activeUsers') return detailsModel
      if (name === 'requests') return { getProperty: () => [{ activeUser_ID: 'filtered-out-user' }] }
      throw new Error(`Unexpected details model ${name}`)
    },
    getView: () => ({ getModel: () => ({ bindContext: () => detailsOperation }) }),
    _activeUserDetailsDialog: { open: () => {} }
  })
  await detailsInstance.onOpenActiveUserDetails({
    getSource: () => ({ getBindingContext: name => name === 'activeUsers' ? { getObject: () => ({ userID: 'active-2' }) } : null })
  })
  assert.equal(JSON.stringify(detailsData.details._request), JSON.stringify({
    activeUser_ID: 'active-2',
    requestedRole_code: 'TESTER',
    userAdminRequested: false,
    provisioningVersion: 9
  }), 'details lifecycle actions must not depend on the filtered Requests model')

  activeUsersData.hasMore = true
  activeUsersData.nextSkip = 2
  await activeInstance.onLoadMoreActiveUsers()
  assert.equal(activeParameters.skip, 2)
  assert.equal(activeUsersData.items.length, 2)

  const catalogData = {
    selectedType: 'SAP_MODULE', allItems: [], items: [], query: '', includeInactive: false,
    loaded: false, busy: false, error: false, componentOptions: [], defectOptions: [],
    edit: { mode: 'CREATE', code: 'NEW', name: 'New module', submitting: false, validation: {} }
  }
  const catalogModel = {
    getProperty: key => catalogData[key.slice(1)],
    setProperty: (key, value) => {
      const parts = key.slice(1).split('/')
      if (parts.length === 1) catalogData[parts[0]] = value
      else catalogData[parts[0]][parts[1]] = value
    }
  }
  const catalogRows = {
    CatalogApplicationComponents: Array.from({ length: 205 }, (_, index) => ({
      ID: `component-${index + 1}`,
      name: `Component ${index + 1}`,
      componentType: 'CAP',
      active: true
    })),
    CatalogDefectCategories: Array.from({ length: 205 }, (_, index) => ({
      ID: `defect-${index + 1}`,
      name: `Defect ${index + 1}`,
      categoryType: 'FUNCTIONAL',
      active: true
    })),
    CatalogSAPModules: Array.from({ length: 205 }, (_, index) => ({
      ID: `module-${index + 1}`,
      code: `MOD-${index + 1}`,
      name: `Module ${index + 1}`,
      active: index !== 199
    }))
  }
  let createCount = 0
  const submittedCatalogGroups = []
  const catalogBindingParameters = []
  const catalogRequestRanges = []
  let releaseCatalogCreate
  const catalogCreateDone = new Promise(resolve => { releaseCatalogCreate = resolve })
  const catalogODataModel = {
    bindList: (path, _sorters, _filters, _parameters, bindingParameters) => {
      const entity = path.slice(1)
      catalogBindingParameters.push(bindingParameters)
      return {
        requestContexts: async (start = 0, length) => {
          catalogRequestRanges.push({ entity, start, length })
          const rows = catalogRows[entity] || []
          const requestedLength = length === Infinity ? rows.length : Math.min(rows.length, Number(length || 0))
          return rows.slice(start, start + requestedLength).map(item => ({ requestObject: async () => item }))
        },
        create: () => ({ created: async () => { createCount += 1; await catalogCreateDone } })
      }
    },
    submitBatch: async group => { submittedCatalogGroups.push(group) }
  }
  const catalogInstance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => name === 'businessCatalogs' ? catalogModel : { setProperty: () => {} },
    getView: () => ({ getModel: () => catalogODataModel }),
    _catalogEditDialog: { close: () => {} },
    _text: async key => key
  })
  const developerCatalogData = { loaded: false, busy: false, error: false, availabilityStatuses: [], responsibilityLevels: [], sapModules: [], componentCategories: [] }
  const developerCatalogModel = {
    getProperty: key => developerCatalogData[key.slice(1)],
    setProperty: (key, value) => { developerCatalogData[key.slice(1)] = value },
    setData: data => Object.assign(developerCatalogData, data)
  }
  const developerRows = {
    '/AvailabilityStatuses': [{ code: 'AVAILABLE', name: 'Available' }],
    '/ResponsibilityLevels': [{ code: 'PRIMARY', name: 'Primary' }],
    '/SAPModules': [{ ID: 'module-1', name: 'Module 1' }],
    '/ComponentCategories': [{ ID: 'category-1', component: { name: 'Component' }, defectCategory: { name: 'Defect' } }]
  }
  const developerCatalogInstance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => name === 'developerCatalogs' ? developerCatalogModel : catalogModel,
    getView: () => ({ getModel: () => ({
      bindList: path => ({ requestContexts: async () => (developerRows[path] || []).map(row => ({ getObject: () => row })) })
    }) }),
    _text: async key => key
  })
  catalogData.query = 'business sentinel'
  await developerCatalogInstance._ensureDeveloperCatalogs()
  assert.equal(developerCatalogData.loaded, true)
  assert.equal(developerCatalogData.componentCategories[0].label, 'Component — Defect')
  assert.equal(catalogData.query, 'business sentinel', 'Developer catalog loading must not alter Business Catalog state')
  const failedDeveloperData = { loaded: false, busy: false, error: false }
  const failedDeveloperModel = {
    getProperty: key => failedDeveloperData[key.slice(1)],
    setProperty: (key, value) => { failedDeveloperData[key.slice(1)] = value },
    setData: data => Object.assign(failedDeveloperData, data)
  }
  const failedDeveloperInstance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => name === 'developerCatalogs' ? failedDeveloperModel : catalogModel,
    getView: () => ({ getModel: () => ({ bindList: () => ({ requestContexts: async () => { throw new Error('developer catalog unavailable') } }) }) })
  })
  await assert.rejects(failedDeveloperInstance._ensureDeveloperCatalogs(), /developer catalog unavailable/)
  assert.equal(failedDeveloperData.error, true)
  assert.equal(catalogData.query, 'business sentinel', 'Developer catalog failure must not alter Business Catalog state')
  catalogData.query = ''
  await catalogInstance._loadCatalogs()
  assert.equal(developerCatalogData.componentCategories[0].label, 'Component — Defect', 'Business Catalog loading must not alter Developer catalog state')
  const businessFailureInstance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => name === 'businessCatalogs' ? catalogModel : developerCatalogModel,
    _ensureCatalogLookups: async () => { throw new Error('business catalog unavailable') }
  })
  catalogData.error = false
  await businessFailureInstance._loadCatalogs()
  assert.equal(catalogData.error, true)
  assert.equal(developerCatalogData.componentCategories[0].label, 'Component — Defect', 'Business Catalog failure must not alter Developer catalog state')
  assert.equal(catalogData.loaded, true)
  assert.equal(catalogData.allItems.length, 205, 'catalog loading retrieves every page before local search')
  assert.equal(catalogData.items.length, 204, 'inactive catalog items are hidden by default')
  assert.equal(catalogRequestRanges.every(range => range.length === Infinity), true, 'catalog reads request a complete result set')
  assert.equal(catalogBindingParameters.every(parameters => !parameters || !Object.hasOwn(parameters, '$top')), true, 'catalog bindings do not pass disallowed OData V4 $top parameters')
  catalogData.includeInactive = true
  catalogInstance._applyCatalogFilters()
  assert.equal(catalogData.items.length, 205)
  catalogData.query = 'MOD-201'
  catalogInstance._applyCatalogFilters()
  assert.equal(catalogData.items.length, 1, 'local search narrows a complete result set')
  assert.equal(catalogData.items[0].code, 'MOD-201', 'local search can find rows beyond the first 100')
  catalogData.query = ''
  catalogData.includeInactive = false
  catalogData.edit = { mode: 'CREATE', code: '', name: '', componentType: '', categoryType: '', submitting: false, validation: {} }
  await catalogInstance.onConfirmCatalogEdit()
  assert.equal(catalogData.edit.validation.code, 'catalogCodeRequired', 'missing code is exposed through a value-state message')
  assert.equal(catalogData.edit.validation.name, 'catalogNameRequired', 'missing name is exposed through a value-state message')
  catalogData.edit = { mode: 'CREATE', code: 'NEW', name: 'New module', submitting: false, validation: {} }
  const firstCatalogCreate = catalogInstance.onConfirmCatalogEdit()
  const secondCatalogCreate = catalogInstance.onConfirmCatalogEdit()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(createCount, 1, 'catalog double submit must be ignored')
  assert.deepEqual(submittedCatalogGroups, ['catalogChanges'], 'catalog create uses one explicit update batch')
  releaseCatalogCreate()
  await Promise.all([firstCatalogCreate, secondCatalogCreate])

  let rejectPatch
  const patchPromise = new Promise((_resolve, reject) => { rejectPatch = reject })
  patchPromise.catch(() => {})
  let catalogReloads = 0
  const updateInstance = Object.assign(Object.create(controllerDefinition), {
    getView: () => ({ getModel: () => ({
      submitBatch: async group => {
        assert.equal(group, 'catalogChanges')
        rejectPatch(Object.assign(new Error('precondition failed'), { status: 412 }))
      }
    }) }),
    _loadCatalogs: async () => { catalogReloads += 1 },
    _text: async key => key
  })
  const updateResult = await updateInstance._updateCatalogRow({ _context: { setProperty: () => patchPromise } }, { active: false })
  assert.equal(updateResult, false, 'an inner PATCH rejection prevents false catalog success')
  assert.equal(catalogReloads, 0, 'a failed PATCH does not reload the catalog as if it succeeded')

  const restoredData = { selectedTab: 'access', selectedAccessTab: 'activeUsers' }
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
  await restoredInstance.onAccessTabSelect({ getParameter: name => name === 'key' ? 'activeUsers' : undefined, getSource: () => ({ getSelectedKey: () => 'activeUsers' }) })
  assert.equal(restoredActiveLoads, 1)

  let openedAccess
  let developerProfileReads = 0
  const roleOpenInstance = Object.assign(Object.create(controllerDefinition), {
    _text: async key => key,
    _readDeveloperProfile: async () => { developerProfileReads += 1 },
    _openAccessDialog: async data => { openedAccess = data }
  })
  await roleOpenInstance._openRoleChangeForRow({ activeUser_ID: 'developer-1', requestedRole_code: 'DEVELOPER', userAdminRequested: false })
  assert.equal(developerProfileReads, 0, 'opening Change Role for an existing Developer must not read the Developer profile')
  assert.equal(openedAccess.currentRole, 'DEVELOPER')
  assert.equal(openedAccess.role, 'DEVELOPER')
  assert.equal(openedAccess.developerProfile, null)

  const roleData = { currentRole: 'PM', role: 'PM', userAdminRequested: true, developerProfile: null }
  let developerCatalogLoads = 0
  const roleModel = {
    getData: () => roleData,
    getProperty: key => roleData[key.slice(1)],
    setProperty: (key, value) => { roleData[key.slice(1)] = value }
  }
  const roleChangeInstance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => name === 'access' ? roleModel : undefined,
    _ensureDeveloperCatalogs: async () => { developerCatalogLoads += 1 }
  })
  await roleChangeInstance.onAccessRoleChange({ getSource: () => ({ getSelectedKey: () => 'DEVELOPER' }) })
  assert.equal(developerCatalogLoads, 1)
  assert.equal(roleData.developerProfile.responsibilities.length, 1, 'transition into Developer creates one editable responsibility')
  roleData.currentRole = 'DEVELOPER'
  await roleChangeInstance.onAccessRoleChange({ getSource: () => ({ getSelectedKey: () => 'TESTER' }) })
  assert.equal(roleData.developerProfile, null, 'transition out of Developer does not carry a Developer profile payload')

  let sameRoleInvocations = 0
  Object.assign(roleData, { mode: 'CHANGE_ROLE', currentRole: 'TESTER', role: 'TESTER', reason: 'No actual transition.', row: { activeUser_ID: 'tester-1', provisioningVersion: 1 } })
  const sameRoleInstance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => name === 'access' ? roleModel : undefined,
    _text: async key => key,
    _invokeAction: async () => { sameRoleInvocations += 1 }
  })
  await sameRoleInstance.onConfirmAccessChange()
  assert.equal(sameRoleInvocations, 0, 'same-role confirmation must not invoke requestRoleChange')

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

function loadController (source, oWindow = { location: { assign: () => {} } }) {
  let definition
  const BaseController = { extend: (_name, value) => { definition = value; return { prototype: value } } }
  const sandbox = {
    window: oWindow,
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
  for (const key of ['appTitle', 'inviteUser', 'bugManagementOpenAction', 'bugManagementOpenActionTooltip', 'targetEmail', 'displayName', 'invalidDisplayName', 'editUserInformation', 'editUserInformationReason', 'saveUserInformation', 'userInformationUpdated', 'userInformationUpdateFailed', 'businessRole', 'userAdminCapability', 'sendInvitation', 'retryConfirmation', 'reconcileConfirmation', 'changeRoleConfirmation', 'revokeConfirmation', 'manageResponsibilities', 'developerProfileConfirmation', 'existingBugsKeepAssignee', 'accessRequestsTab', 'activeUsersTab', 'developerResponsibilitiesTab', 'businessCatalogsTab', 'catalogType', 'catalogSearchPlaceholder', 'includeInactiveCatalogs', 'addCatalogItem', 'editCatalogItem', 'deactivateCatalogItem', 'activateCatalogItem', 'catalogImpactTitle', 'catalogReason', 'saveCatalogItem', 'confirmCatalogDeactivation', 'activeUserSearchPlaceholder', 'includeNonActive', 'includeRevoked', 'noActiveUsers', 'activeUsersLoadFailed', 'retryActiveUsers', 'loadMoreActiveUsers', 'viewDetails', 'activeUserDetails', 'linkExistingIdentity', 'existingIdentityLinkRole', 'existingIdentityLinkNotice', 'existingIdentityLinkEmail', 'sendIdentityLink', 'identityLinkQueued', 'cancelExistingLinkInvitation', 'cancelExistingLinkConfirmation', 'existingLinkCancelled', 'accessState', 'identityLinked', 'developerReady', 'activeResponsibilityCount', 'pendingOperation', 'lastReconciled', 'developerProfile', 'close', 'activeUsersNoDeveloper', 'suspendAccess', 'reactivateAccess', 'suspendWarning', 'reactivateWarning', 'suspendQueued', 'reactivateQueued']) {
    assert.match(text, new RegExp(`^${key}=`, 'm'))
  }
  assert.match(text, /^cancelExistingLinkInvitation=Cancel invitation$/m)
  assert.match(text, /^cancelExistingLinkConfirmation=Cancel this invitation\? Its link will stop working and a new invitation can be sent\.$/m)
  assert.match(text, /^existingLinkCancelled=Invitation cancelled\.$/m)
  assert.match(text, /^existingIdentityLinkNotice=.*same Users\.ID.*Developer Profile.*Bug assignments.*comments.*history/m)
}

const operationsI18nKeys = [
  'operationsTab', 'deliveryOperationsTab', 'provisioningOperationsTab', 'auditTab', 'deliverySearchPlaceholder',
  'deliveryStatusFilter', 'availableText', 'unavailableText', 'recentSuccessText', 'staleText', 'unknownText', 'skippedText',
  'noDeliveries', 'retryDelivery', 'retryDeliveryConfirmation', 'deliveryRetryQueued',
  'operationStateFilter', 'operationTypeFilter', 'linkExistingOperation', 'noOperations', 'operationsLoadFailed', 'auditActionFilter',
  'allActions', 'auditResultFilter', 'appliedText', 'retryNeededText', 'rejectedText', 'suspendAccess', 'reactivateAccess',
  'noAuditEvents', 'auditLoadFailed', 'operationDetails', 'auditDetails', 'deliveryDetails', 'safeDetails', 'sentAt', 'lastAttempt',
  'deliveryTypeFilter', 'allDeliveryTypes', 'invitationDeliveryType', 'accessChangeDeliveryType', 'roleChangedEvent', 'suspendedEvent', 'reactivatedEvent', 'revokedEvent', 'emptyDetail'
]
for (const locale of ['i18n.properties', 'i18n_en.properties', 'i18n_vi.properties']) {
  const text = fs.readFileSync(path.join(webapp, 'i18n', locale), 'utf8')
  for (const key of operationsI18nKeys) assert.match(text, new RegExp(`^${key}=`, 'm'))
  assert.match(text, /^deliverySearchPlaceholder=(?!.*(?:request|onboarding)).+$/im, `${locale} delivery search copy must be neutral`)
  assert.match(text, /^noDeliveries=(?!.*(?:request|onboarding)).+$/im, `${locale} empty delivery copy must be neutral`)
  if (locale === 'i18n_vi.properties') {
    assert.match(text, /^deliverySearchPlaceholder=Tìm delivery theo người nhận đã che hoặc mã delivery$/m)
    assert.match(text, /^noDeliveries=Không có delivery phù hợp với bộ lọc này$/m)
  } else {
    assert.match(text, /^deliverySearchPlaceholder=Search deliveries by masked recipient or delivery ID$/m)
    assert.match(text, /^noDeliveries=No deliveries match this filter$/m)
  }
  assert.match(text, /^emptyDetail=—$/m, `${locale} empty detail must use an em dash`)
  for (const key of [
    ...Object.values(mainTabTooltips),
    'bugManagementOpenAction',
    'bugManagementOpenActionTooltip',
    'changeRoleActionTooltip',
    'manageResponsibilitiesActionTooltip',
    'revokeAccessActionTooltip',
    'changeRoleResponsibilitiesHint'
  ]) assert.match(text, new RegExp(`^${key}=`, 'm'), `${key} must exist in ${locale}`)
}

verifyRuntimeBehavior().then(() => {
  console.log('IDTS User Administration UI contract: PASS')
}).catch(error => {
  process.nextTick(() => { throw error })
})
