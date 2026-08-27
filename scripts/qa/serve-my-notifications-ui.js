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
<title>N2 local synthetic UI verification</title>
<script id="sap-ui-bootstrap" src="https://ui5.sap.com/1.148.0/resources/sap-ui-core.js" data-sap-ui-theme="sap_horizon" data-sap-ui-language="${req.query.lang === 'vi' ? 'vi' : 'en'}" data-sap-ui-async="true" data-sap-ui-resource-roots='{"idts.bugmanagementui":"/idtsbugmanagementui/","fixture":"/fixture/"}' data-sap-ui-on-init="module:fixture/boot"></script>
</head><body class="sapUiBody"><div id="idtsNotificationShellHost"></div><main class="sapUiContentPadding"><h1>Local notification fixture</h1><p>Synthetic records only. This is not live BTP acceptance.</p></main></body></html>`))
  app.get('/fixture/boot.js', (req, res) => res.type('js').send(`sap.ui.define("idts/bugmanagementui/ext/notification/NotificationClient",[],function(){"use strict";var rows=Array.from({length:55},function(_,i){return{notificationID:"11111111-1111-4111-8111-"+String(i+1).padStart(12,"0"),category:i%2?"BUG":"ACCESS",eventType:"ASSIGNED",title:"Notification "+(i+1),summary:"A local test notification with a long safe summary to check wrapping at narrow widths and large text sizes.",priority:i===0?"CRITICAL":"NORMAL",actionRequired:i===0,occurredAt:new Date(Date.now()-i*1000).toISOString(),readAt:null,targetPath:"/idtsbugmanagementui/index.html",modifiedAt:"2026-08-27T01:02:03.1234567Z"}});return{search:function(m,o){return Promise.resolve(rows.slice(o.skip,o.skip+o.top))},unreadCount:function(){return Promise.resolve(rows.filter(function(r){return!r.readAt}).length)},markRead:function(m,r){r.readAt=new Date().toISOString();return Promise.resolve(r)},markAllRead:function(m,t){rows.forEach(function(r){if(r.occurredAt<=t)r.readAt=new Date().toISOString()});return Promise.resolve(rows.filter(function(r){return r.readAt}).length)},safeTargetPath:function(p){return p==="/idtsbugmanagementui/index.html"?p:null}}});sap.ui.require(["sap/ui/core/UIComponent","sap/ui/model/json/JSONModel","sap/ui/model/resource/ResourceModel","idts/bugmanagementui/ext/notification/NotificationShell"],function(UIComponent,JSONModel,ResourceModel,Shell){"use strict";var c=new UIComponent();c.setModel(new JSONModel({}),"notifications");c.setModel(new ResourceModel({bundleUrl:"/idtsbugmanagementui/i18n/i18n.properties"}),"i18n");window.__N2_FIXTURE_SHELL__=Shell.init(c);});`))
  app.use('/idtsbugmanagementui', express.static(appRoot))
  const server = app.listen(0, '127.0.0.1', () => console.log(`N2_LOCAL_FIXTURE=http://127.0.0.1:${server.address().port}/idtsbugmanagementui/index.html`))
  process.on('SIGINT', () => server.close(() => process.exit(0)))
}
main().catch(error => { console.error(error); process.exitCode = 1 })
