// Học nhanh (DonHV): chặn client ghi thẳng vào read model/audit entity. Debug 405/403 ở đây trước khi nghi ngờ Fiori.
const { READ_ONLY_ENTITY_NAMES } = require('./constants')

function registerReadOnlyEntityGuards (service, entities) {
  // `service.js` gọi một lần lúc init. Mỗi entity tính toán/audit chỉ đọc được gắn handler reject
  // cho CREATE/UPDATE/PATCH/DELETE để direct OData không thể giả workload, history hay AI audit.
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
