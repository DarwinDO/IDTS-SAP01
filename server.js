const cds = require('@sap/cds')
const express = require('express')
const path = require('path')

const LEGACY_APP_PREFIX = '/bug-management-ui/webapp'
const CANONICAL_APP_PREFIX = '/idts.bugmanagementui'
const UI5_CDN_BASE = 'https://sapui5.hana.ondemand.com/1.148.0'
const WEBAPP_ROOT = path.join(__dirname, 'app', 'bug-management-ui', 'webapp')

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
