const cds = require('@sap/cds')
const express = require('express')
const path = require('path')

const LEGACY_APP_PREFIX = '/bug-management-ui/webapp'
const CANONICAL_APP_PREFIX = '/idts.bugmanagementui'
const UI5_CDN_BASE = 'https://sapui5.hana.ondemand.com/1.148.0'
const WEBAPP_ROOT = path.join(__dirname, 'app', 'bug-management-ui', 'webapp')
const READINESS_TIMEOUT_MS = 12000
const { sanitizeLoginContractError } = require('./srv/auth')

// OData parameter validation happens before AuthService.login is dispatched.
// Insert the narrowly scoped sanitizer before CAP's final error serializer.
cds.middlewares.after.unshift(sanitizeLoginContractError)

function timeoutAfter (milliseconds) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Database readiness timed out')), milliseconds)
    timer.unref?.()
  })
}

async function verifyDatabaseReadiness () {
  const db = await cds.connect.to('db')
  const query = cds.ql.SELECT.from('idts.cap.Users').columns('ID').limit(1)
  await Promise.race([db.run(query), timeoutAfter(READINESS_TIMEOUT_MS)])
}

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
  // `/health` proves that the Node process is alive. `/ready` additionally
  // touches the configured CAP database so operators do not mistake a stopped
  // HANA instance for a healthy application.
  app.get('/ready', async (_req, res) => {
    try {
      await verifyDatabaseReadiness()
      return res.status(200).json({ status: 'UP', checks: { database: 'UP' } })
    } catch (_error) {
      return res.status(503).json({ status: 'DOWN', checks: { database: 'DOWN' } })
    }
  })

  app.use(`${CANONICAL_APP_PREFIX}/resources`, (req, res) => {
    return res.redirect(302, `${UI5_CDN_BASE}/resources${req.url}`)
  })

  app.use(`${CANONICAL_APP_PREFIX}/test-resources`, (req, res) => {
    return res.redirect(302, `${UI5_CDN_BASE}/test-resources${req.url}`)
  })

  app.use(CANONICAL_APP_PREFIX, express.static(WEBAPP_ROOT, { index: 'index.html' }))

  app.use((req, res, next) => {
    const { path, query } = splitPathAndQuery(req.originalUrl)
    const targetPath = canonicalAppPathFor(path)

    if (!targetPath) return next()
    return res.redirect(308, `${targetPath}${query}`)
  })
})

module.exports = cds.server
