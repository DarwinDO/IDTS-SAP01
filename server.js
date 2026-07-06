const cds = require('@sap/cds')

const LEGACY_APP_PREFIX = '/bug-management-ui/webapp'
const CANONICAL_APP_PREFIX = '/idts.bugmanagementui'

function splitPathAndQuery(originalUrl) {
  const queryIndex = originalUrl.indexOf('?')
  if (queryIndex === -1) return { path: originalUrl, query: '' }
  return {
    path: originalUrl.slice(0, queryIndex),
    query: originalUrl.slice(queryIndex)
  }
}

function canonicalAppPathFor(legacyPath) {
  if (legacyPath === LEGACY_APP_PREFIX || legacyPath === `${LEGACY_APP_PREFIX}/`) {
    return `${CANONICAL_APP_PREFIX}/index.html`
  }

  if (!legacyPath.startsWith(`${LEGACY_APP_PREFIX}/`)) return null
  return `${CANONICAL_APP_PREFIX}${legacyPath.slice(LEGACY_APP_PREFIX.length)}`
}

cds.on('bootstrap', app => {
  app.use((req, res, next) => {
    const { path, query } = splitPathAndQuery(req.originalUrl)
    const targetPath = canonicalAppPathFor(path)

    if (!targetPath) return next()
    return res.redirect(308, `${targetPath}${query}`)
  })
})

module.exports = cds.server
