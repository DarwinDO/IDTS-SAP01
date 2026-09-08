'use strict'

// Local-only UI fixture: real NotificationService + in-memory DB; never load private env/provider bindings.
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'
const path = require('node:path')
const cds = require('@sap/cds')
const express = require('express')
const root = path.resolve(__dirname, '../..')
const actor = 'e1000000-0000-4000-8000-000000000001'
const bug = 'e2000000-0000-4000-8000-000000000001'
const appRoot = path.join(root, 'app/bug-management-ui/webapp')
const userAdminRoot = path.join(root, 'app/user-administration-ui/webapp')

const VISUAL_SCENARIOS = Object.freeze({
  'IDTS110-F237': 'populated-bug',
  'IDTS110-F238': 'empty',
  'IDTS110-F238E': 'error-retry',
  'IDTS110-F238L': 'loading',
  'IDTS110-F239': 'visible-signal',
  'IDTS110-F239P': 'visible-poll',
  'IDTS110-F239H': 'hidden-stop',
  'IDTS110-F239D': 'destroy'
})

function notificationBootScript (scenario) {
  const safeScenario = JSON.stringify(scenario)
  return `sap.ui.define("idts/bugmanagementui/ext/notification/NotificationClient",[],function(){
"use strict";
var requestedCase=(new URLSearchParams(window.location.search)).get("idts110-case")||"";
var scenarioMap={"IDTS110-F237":"populated-bug","IDTS110-F238":"empty","IDTS110-F238E":"error-retry","IDTS110-F238L":"loading","IDTS110-F239":"visible-signal","IDTS110-F239P":"visible-poll","IDTS110-F239H":"hidden-stop","IDTS110-F239D":"destroy"};
var scenario=scenarioMap[requestedCase]||${safeScenario};
var metrics={scenario:scenario,unreadCalls:0,searchCalls:0,timerDelay:0,timerCallbacks:0,clearCalls:0,listenersAdded:0,listenersRemoved:0,intervalCallback:null};
var bugRow={notificationID:"11111111-1111-4111-8111-000000000017",category:"BUG",eventType:"ASSIGNED",title:"Bug notification",summary:"Safe notification summary",bugNumber:"BUG-0017",bugTitle:"Compact notification title",priority:"HIGH",actionRequired:true,occurredAt:"2026-09-05T01:02:03.000Z",readAt:null,targetPath:"/idtsbugmanagementui/index.html#/Bugs(ID=11111111-1111-4111-8111-000000000017,IsActiveEntity=true)",modifiedAt:"2026-09-05T01:02:03.123Z"};
var rows=scenario==="empty"||scenario==="error-retry"||scenario==="loading"?[]:[bugRow];
var searchAttempts=0;
var nativeSetInterval=window.setInterval.bind(window),nativeClearInterval=window.clearInterval.bind(window);
window.setInterval=function(fn,delay){metrics.timerDelay=delay;metrics.timerCallbacks+=1;metrics.intervalCallback=fn;return nativeSetInterval(fn,delay);};
window.clearInterval=function(id){metrics.clearCalls+=1;return nativeClearInterval(id);};
var nativeDocumentAdd=document.addEventListener.bind(document),nativeDocumentRemove=document.removeEventListener.bind(document);
document.addEventListener=function(name,fn,opts){if(name==="visibilitychange")metrics.listenersAdded+=1;return nativeDocumentAdd(name,fn,opts);};
document.removeEventListener=function(name,fn,opts){if(name==="visibilitychange")metrics.listenersRemoved+=1;return nativeDocumentRemove(name,fn,opts);};
var nativeWindowAdd=window.addEventListener.bind(window),nativeWindowRemove=window.removeEventListener.bind(window);
window.addEventListener=function(name,fn,opts){if(name==="focus"||name==="idts:notification-change")metrics.listenersAdded+=1;return nativeWindowAdd(name,fn,opts);};
window.removeEventListener=function(name,fn,opts){if(name==="focus"||name==="idts:notification-change")metrics.listenersRemoved+=1;return nativeWindowRemove(name,fn,opts);};
window.__IDTS110_VISIBILITY__="visible";
try{Object.defineProperty(document,"visibilityState",{configurable:true,get:function(){return window.__IDTS110_VISIBILITY__||"visible";}});}catch(_e){}
window.__IDTS110_METRICS__=metrics;
window.__IDTS110_FIXTURE_SHELL__=null;
return{
search:function(_model,options){metrics.searchCalls+=1;searchAttempts+=1;if(scenario==="error-retry"&&searchAttempts===1)return Promise.reject(new Error("fixture search unavailable"));if(scenario==="loading")return new Promise(function(){});return Promise.resolve(rows.slice(options.skip,options.skip+options.top));},
unreadCount:function(){metrics.unreadCalls+=1;var count=rows.filter(function(row){return!row.readAt;}).length;if(scenario==="visible-signal"&&metrics.unreadCalls>1)count=2;if(scenario==="visible-poll"&&metrics.unreadCalls>1)count=3;return Promise.resolve(count);},
markRead:function(_model,row){row.readAt=new Date().toISOString();return Promise.resolve(row);},
markAllRead:function(_model,through){var count=0;rows.forEach(function(row){if(row.occurredAt<=through&&!row.readAt){row.readAt=new Date().toISOString();count+=1;}});return Promise.resolve(count);},
safeTargetPath:function(value){return typeof value==="string"&&/^\\/idtsbugmanagementui\\/index\\.html(?:#\\/Bugs\\(ID=[0-9a-f-]{36},IsActiveEntity=true\\))?$/i.test(value)?value:null;}
};
});
sap.ui.require(["sap/ui/core/UIComponent","sap/ui/model/json/JSONModel","sap/ui/model/resource/ResourceModel","idts/bugmanagementui/ext/notification/NotificationShell"],function(UIComponent,JSONModel,ResourceModel,Shell){
"use strict";
var component=new UIComponent();
component.setModel(new JSONModel({}),"notifications");
component.setModel(new ResourceModel({bundleUrl:"/idtsbugmanagementui/i18n/i18n.properties"}),"i18n");
window.__IDTS110_FIXTURE_SHELL__=Shell.init(component);
});`
}

function workloadBootScript () {
  return `sap.ui.require(["sap/ui/model/json/JSONModel","sap/ui/model/resource/ResourceModel","sap/ui/core/Fragment","idts/useradministrationui/controller/Main.controller"],function(JSONModel,ResourceModel,Fragment,MainController){
"use strict";
var profileID="20000000-0000-0000-0000-000000000001";
var bugID="30000000-0000-0000-0000-000000000001";
var selectedDeveloper={developerProfileID:profileID,developerName:"Demo Developer",openOwnedBugCount:1,currentActionItemCount:1,overdueOwnedBugCount:0,workloadLimit:3};
var workloadModel=new JSONModel({selectedDeveloper:selectedDeveloper,bugs:[],bugsBusy:false,bugsError:false,pageSize:100});
var i18nModel=new ResourceModel({bundleUrl:"/idtsuseradministrationui/i18n/i18n.properties"});
var sourceClosedRows=1;
var openBug={ID:bugID,bugNumber:"BUG-4001",title:"Workload follow-up required",status_code:"IN_PROGRESS",priority_code:"HIGH",severity_code:"MEDIUM",dueDate:"2026-09-20",estimatedEffortHours:2.5,assigneeDisplayName:"Technical Developer",currentActionOwnerDisplayName:"Current Action Owner"};
var requestCapture={entitySet:null,parameters:null,skip:null,length:null};
var bugApi={bindList:function(entitySet,_context,_sorters,_filters,parameters){requestCapture.entitySet=entitySet;requestCapture.parameters=parameters||{};return{requestContexts:function(skip,length){requestCapture.skip=skip;requestCapture.length=length;return Promise.resolve([{getObject:function(){return openBug;}}]);}};}};
var fixtureView={getId:function(){return "idts110-workload-view";},getModel:function(name){return name==="bugApi"?bugApi:null;}};
var controller=new MainController();
controller.getModel=function(name){return name==="workload"?workloadModel:null;};
controller.getView=function(){return fixtureView;};
var productionMethodNames=["_loadDeveloperWorkloadBugs","_bugObjectPageUrl","openBugInManagement"];
var missingMethods=productionMethodNames.filter(function(name){return typeof controller[name]!=="function";});
if(missingMethods.length){window.__IDTS110_WORKLOAD_BOOT_ERROR__="Production User Administration controller methods unavailable: "+missingMethods.join(",");return;}
Promise.resolve(controller._loadDeveloperWorkloadBugs(selectedDeveloper)).then(function(){
  var bugs=workloadModel.getProperty("/bugs")||[];
  var helperUrl=controller._bugObjectPageUrl(bugID);
  if(!bugs.length||!bugs[0].objectPageUrl||helperUrl!==bugs[0].objectPageUrl)throw new Error("Production workload normalization did not produce a Bug object-page URL");
  var request={entitySet:requestCapture.entitySet,filter:requestCapture.parameters&&requestCapture.parameters.$filter,orderby:requestCapture.parameters&&requestCapture.parameters.$orderby,select:requestCapture.parameters&&requestCapture.parameters.$select,groupId:requestCapture.parameters&&requestCapture.parameters.$$groupId,skip:requestCapture.skip,length:requestCapture.length};
  window.__IDTS110_WORKLOAD_PRODUCTION__={loaded:true,module:"idts/useradministrationui/controller/Main.controller",controller:controller,methods:productionMethodNames.slice(),methodEvidence:{loadDeveloperWorkloadBugs:true,bugObjectPageUrl:true,navigationPending:true},request:request,normalizedBug:bugs[0],sourceClosedRows:sourceClosedRows,returnedRows:bugs.length};
  window.__IDTS110_WORKLOAD_FIXTURE__={selectedProfile:profileID,sourceClosedRows:sourceClosedRows,renderedBugRows:bugs.length,requestFilter:request.filter,requestOrderBy:request.orderby,requestSelect:request.select};
  window.__IDTS110_WORKLOAD_LINKS__=bugs.map(function(row){return row.objectPageUrl;}).filter(Boolean);
  return Fragment.load({id:"idts110-workload",name:"idts.useradministrationui.fragment.DeveloperWorkloadDetails",controller:controller});
}).then(function(dialog){
  dialog.setModel(workloadModel,"workload");
  dialog.setModel(i18nModel,"i18n");
  dialog.placeAt("idtsWorkloadFixtureHost");
  dialog.open();
  window.__IDTS110_WORKLOAD_READY__=true;
}).catch(function(error){window.__IDTS110_WORKLOAD_BOOT_ERROR__=String(error&&error.stack||error);});
});`
}

async function main () {
  const db = await cds.deploy('db').to('sqlite::memory:')
  cds.db = db
  await db.run(cds.ql.INSERT.into('idts.cap.Users').entries({ ID: actor, displayName: 'Local UI fixture', email: 'n2.fixture@example.invalid', active: true, role_code: 'TESTER' }))
  const sources = Array.from({ length: 105 }, (_, index) => ({
    ID: `e3${String(index).padStart(6, '0')}-0000-4000-8000-000000000001`, recipient_ID: actor,
    bug_ID: bug, eventType_code: index % 2 ? 'ASSIGNED' : 'UPDATED', channel_code: 'IN_APP', deliveryStatus_code: 'SENT',
    message: 'A local test notification with a long safe summary to check wrapping at narrow widths and large text sizes.'
  }))
  await db.run(cds.ql.INSERT.into('idts.cap.Notifications').entries(sources))
  await db.run(cds.ql.INSERT.into('idts.cap.UserNotificationInboxEntries').entries(sources.map((source, index) => ({
    ID: `e4${String(index).padStart(6, '0')}-0000-4000-8000-000000000001`, recipient_ID: actor,
    bugNotification_ID: source.ID, occurredAt: new Date(Date.now() - index * 1000).toISOString(), readAt: null
  }))))
  const app = express()
  app.use((req, res, next) => { req.user = new cds.User({ id: 'n2.fixture@example.invalid', roles: ['authenticated-user', 'TESTER'] }); next() })
  await cds.serve('NotificationService').from('srv/notification.cds').in(app)
  app.get('/idtsbugmanagementui/index.html', (req, res) => res.type('html').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>My Notifications</title>
<script id="sap-ui-bootstrap" src="https://ui5.sap.com/1.148.0/resources/sap-ui-core.js" data-sap-ui-theme="sap_horizon" data-sap-ui-language="${req.query.lang === 'vi' ? 'vi' : 'en'}" data-sap-ui-async="true" data-sap-ui-resource-roots='{"idts.bugmanagementui":"/idtsbugmanagementui/","fixture":"/fixture/"}' data-sap-ui-on-init="module:fixture/boot"></script>
  </head><body class="sapUiBody"><div id="idtsNotificationShellHost"></div><main class="sapUiContentPadding" aria-hidden="true"></main></body></html>`))
  app.get('/fixture/boot.js', (req, res) => res.type('js').send(notificationBootScript(VISUAL_SCENARIOS[String(req.query['idts110-case'] || '')] || 'populated-bug')))
  app.get('/idtsuseradministrationui/index.html', (req, res) => res.type('html').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Developer Workload</title>
<script id="sap-ui-bootstrap" src="https://ui5.sap.com/1.148.0/resources/sap-ui-core.js" data-sap-ui-theme="sap_horizon" data-sap-ui-language="en" data-sap-ui-async="true" data-sap-ui-resource-roots='{"idts.useradministrationui":"/idtsuseradministrationui/","fixture":"/fixture/"}' data-sap-ui-on-init="module:fixture/workload-boot"></script>
</head><body class="sapUiBody"><div id="idtsWorkloadFixtureHost"></div></body></html>`))
  app.get('/fixture/workload-boot.js', (_req, res) => res.type('js').send(workloadBootScript()))
  app.use('/idtsbugmanagementui', express.static(appRoot))
  app.use('/idtsuseradministrationui', express.static(userAdminRoot))
  const server = app.listen(0, '127.0.0.1', () => console.log(`N2_LOCAL_FIXTURE=http://127.0.0.1:${server.address().port}/idtsbugmanagementui/index.html`))
  process.on('SIGINT', () => server.close(() => process.exit(0)))
}
main().catch(error => { console.error(error); process.exitCode = 1 })
