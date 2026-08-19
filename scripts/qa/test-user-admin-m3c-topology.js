'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const uiMta = fs.readFileSync('mta.user-admin-ui-r3c.yaml', 'utf8');
assert.match(uiMta, /ID: idts-user-admin-ui-r3c/);
assert.match(uiMta, /service-name: idts-sap01-html5-repo-host/);
assert.match(uiMta, /bug-management-ui\.zip/);
assert.match(uiMta, /path: app\/bug-management-ui/);
assert.match(uiMta, /user-administration-ui\.zip/);
assert.match(uiMta, /path: app\/user-administration-ui/);
assert.doesNotMatch(uiMta, /db-deployer|idts-sap01-db\b|xsuaa|approuter|destination|jobscheduler|external-services|ai-gateway/i);
assert.equal((uiMta.match(/type: org\.cloudfoundry\.existing-service/g) || []).length, 1);
assert.equal((uiMta.match(/type: com\.sap\.application\.content/g) || []).length, 1);
assert.equal((uiMta.match(/type: html5/g) || []).length, 2);

const mainMta = fs.readFileSync('mta.yaml', 'utf8');
assert.match(mainMta, /name: idts-sap01-srv/);
assert.match(mainMta, /name: idts-sap01-db-deployer/);

const forwardModules = ['idts-sap01-srv'];
assert.deepEqual(forwardModules, ['idts-sap01-srv']);
assert.equal(forwardModules.includes('idts-sap01-db-deployer'), false);
assert.equal(forwardModules.includes('idts-sap01-approuter'), false);
assert.equal(forwardModules.includes('idts-sap01-app-content'), false);

console.log('User Administration M3C selective topology: PASS');
