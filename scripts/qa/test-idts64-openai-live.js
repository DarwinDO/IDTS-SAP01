#!/usr/bin/env node
'use strict'

// This test is intentionally opt-in because it makes a paid external request.
// It uses a synthetic prompt and prints neither key nor provider text.
const { normalizeAiConfig } = require('../../srv/ai/config')
const { OpenAiProvider } = require('../../srv/ai/openai-provider')
const { containsUnsafeDiagnosticText } = require('../../srv/ai/safety')

const EXECUTE = process.argv.includes('--execute')
const modelAlias = process.env.IDTS_OPENAI_MODEL || null

function result (label, pass, detail) {
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label}${detail ? ` | ${detail}` : ''}`)
  return pass
}

async function main () {
  console.log('IDTS-64 OpenAI live smoke')
  if (!EXECUTE) {
    console.log('SKIP: run with --execute after setting OPENAI_API_KEY and IDTS_OPENAI_MODEL privately.')
    return
  }

  const config = normalizeAiConfig({
    enabled: true,
    provider: 'openai',
    modelAlias
  })
  if (!config.ready) {
    console.log(`SKIP: private live configuration is incomplete (${config.missing.join(', ')}).`)
    return
  }

  const provider = new OpenAiProvider(config)
  const startedAt = Date.now()
  try {
    const response = await provider.structured({
      schemaName: 'IdtsLiveSmoke',
      instruction: 'Return a JSON object with exactly one boolean field named ok set to true.',
      input: { test: 'synthetic-live-smoke' }
    })
    const checks = [
      result('live structured response is JSON', response && typeof response.json === 'object', 'synthetic prompt only'),
      result('live structured response has ok=true', response?.json?.ok === true, 'provider response content not printed'),
      result('live response has no unsafe diagnostic', !containsUnsafeDiagnosticText(response), 'sanitized result')
    ]
    console.log(`Elapsed: ${Date.now() - startedAt} ms`)
    if (checks.every(Boolean)) return
    process.exitCode = 1
  } catch (error) {
    const safe = { code: error?.code || 'OPENAI_LIVE_SMOKE_FAILED', retryable: Boolean(error?.retryable) }
    result('live provider call', false, JSON.stringify(safe))
    process.exitCode = 1
  }
}

main().catch(() => {
  console.error('FAIL  live smoke could not start')
  process.exit(1)
})
