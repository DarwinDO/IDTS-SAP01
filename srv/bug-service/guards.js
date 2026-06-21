const { READ_ONLY_ENTITY_NAMES } = require('./constants')

function registerReadOnlyEntityGuards (service, entities) {
  const targets = READ_ONLY_ENTITY_NAMES
    .flatMap(name => [entities[name], entities[name]?.drafts])
    .filter(Boolean)

  for (const target of targets) {
    for (const event of ['CREATE', 'UPDATE', 'PATCH', 'DELETE']) {
      service.before(event, target, req => {
        req.reject(405, `${target.name} is read-only in BugService.`)
      })
    }
  }
}

module.exports = {
  registerReadOnlyEntityGuards
}
