#!/usr/bin/env node
'use strict'

// Opt-in live smoke: a single synthetic request through Vercel AI Gateway.
// It never prints the gateway key, request body, or provider response text.
const { createAiProvider, normalizeAiConfig } = require('../../srv/ai')
const { containsUnsafeDiagnosticText } = require('../../srv/ai/safety')

const EXECUTE = process.argv.includes('--execute')
const LING_MODEL = 'inclusionai/ling-3.0-flash-free'

function check (label, passed, detail = '') {
  console.log(`  ${passed ? 'PASS' : 'FAIL'}  ${label}${detail ? ` | ${detail}` : ''}`)
  return passed
}

async function main () {
  console.log('IDTS-114 Ling live smoke through Vercel AI Gateway')
  if (!EXECUTE) {
    console.log('SKIP: use --execute only after AI_GATEWAY_API_KEY is supplied through a private environment binding.')
    return
  }

  const config = normalizeAiConfig({
    enabled: true,
    provider: 'vercel',
    modelAlias: process.env.IDTS_AI_MODEL || LING_MODEL,
    embeddingModelAlias: null,
    fallbackEnabled: false,
    timeoutMs: process.env.IDTS_AI_TIMEOUT_MS || 15000
  })
  if (!config.ready) {
    console.log(`SKIP: private Vercel configuration is incomplete (${config.missing.join(', ')}).`)
    return
  }

  const provider = createAiProvider(config)
  const startedAt = Date.now()
  const result = await provider.structured({
    featureType: 'classification',
    schemaName: 'IdtsLingLiveSmoke',
    instruction: 'Return only a JSON object with one boolean field named ok set to true.',
    input: { test: 'synthetic-ling-live-smoke' }
  })
  const checks = [
    check('provider result is successful', result.ok === true),
    check('provider response follows the synthetic JSON contract', result?.data?.json?.ok === true),
    check('audit metadata identifies the configured Ling model', result.modelAlias === config.modelAlias),
    check('safe result contains no unsafe diagnostic text', !containsUnsafeDiagnosticText(result))
  ]
  console.log(`Elapsed: ${Date.now() - startedAt} ms`)
  if (!checks.every(Boolean)) process.exitCode = 1
}

main().catch(() => {
  console.error('FAIL  Ling live smoke could not complete safely')
  process.exit(1)
})
