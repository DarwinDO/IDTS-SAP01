const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '../..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

const service = read('srv/service.cds')
const handlers = read('srv/service.js')
const annotations = read('app/bug-management-ui/annotations/actions.cds')
const smartAssign = read('app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js')
const i18n = read('app/bug-management-ui/webapp/i18n/i18n.properties')
const i18nEn = read('app/bug-management-ui/webapp/i18n/i18n_en.properties')

const directActions = ['markInReview', 'startProgress']
const confirmedActions = ['moveToPendingAssignment', 'sendToRetest', 'closeBug']
const requiredInputs = {
  requestMoreInformation: 'reason',
  resubmitToDeveloper: 'note',
  rejectBug: 'reason',
  resolveBug: 'note',
  reopenBug: 'reason'
}

for (const action of [...directActions, ...confirmedActions]) {
  assert.match(service, new RegExp(`action\\s+${action}\\(\\)\\s+returns\\s+Bugs`), `${action} must expose no input parameter`)
  assert.doesNotMatch(handlers, new RegExp(`${action}[\\s\\S]{0,180}req\\.data\\.(note|reason)`), `${action} must not read note or reason`)
}

for (const action of directActions) {
  assert.doesNotMatch(annotations, new RegExp(`@Common\\.IsActionCritical\\s+${action}\\(\\)`), `${action} must execute without a confirmation dialog`)
}

for (const action of confirmedActions) {
  assert.match(annotations, new RegExp(`@Common\\.IsActionCritical\\s+${action}\\(\\)`), `${action} must require confirmation`)
}

for (const [action, parameter] of Object.entries(requiredInputs)) {
  assert.match(service, new RegExp(`action\\s+${action}\\(${parameter}:\\s*String\\)`), `${action} must keep its required input`)
}

assert.match(service, /action\s+assignToDeveloper\([\s\S]*?note:\s*String[\s\S]*?\)\s+returns\s+Bugs/, 'Assign Developer must keep Developer Note')
assert.match(service, /action\s+addComment\(content:\s*LargeString\)/, 'Add Comment must keep comment content')
assert.match(service, /action\s+reassignRetestOwner\([\s\S]*?retestOwnerID:\s*UUID[\s\S]*?reason:\s*String[\s\S]*?\)\s+returns\s+Bugs/, 'Reassign Retest Owner must keep owner and reason')
assert.doesNotMatch(smartAssign, /setParameter\(["']note["']/, 'Smart Assign must not inject a synthetic note')
assert.doesNotMatch(i18n, /^smartAssignActionNote=/m, 'Removed Smart Assign note text must not remain in i18n')
assert.doesNotMatch(i18nEn, /^smartAssignActionNote=/m, 'Removed Smart Assign note text must not remain in English i18n')

console.log('PASS: Note action contract matches the approved dialog policy.')
