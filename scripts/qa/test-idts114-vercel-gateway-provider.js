#!/usr/bin/env node
'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const Module = require('module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const { createAiProvider, normalizeAiConfig } = require('../../srv/ai')
const { API_BASE_URL } = require('../../srv/ai/vercel-gateway-provider')
const { containsUnsafeDiagnosticText } = require('../../srv/ai/safety')

let pass = 0
let fail = 0

function check (label, condition) {
  if (condition) pass++; else fail++
  console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${label}`)
}

function jsonResponse (status, payload) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload }
}

function gatewayConfig (overrides = {}) {
  return normalizeAiConfig({
    enabled: true,
    provider: 'vercel',
    gatewayApiKey: 'test-only-gateway-key-not-for-network',
    modelAlias: 'alibaba/qwen3.7-flash',
    embeddingModelAlias: 'alibaba/qwen3-embedding-0.6b',
    ...overrides
  })
}

async function main () {
  console.log('\nIDTS-114 Vercel AI Gateway provider verification')

  const incomplete = normalizeAiConfig({ enabled: true, provider: 'vercel', modelAlias: 'inclusionai/ling-3.0-flash-free' })
  check('Vercel config requires the private gateway key', incomplete.ready === false && incomplete.missing.includes('gatewayApiKey'))

  const lingConfig = gatewayConfig({ modelAlias: 'inclusionai/ling-3.0-flash-free', embeddingModelAlias: null })
  const lingRequests = []
  const lingProvider = createAiProvider(lingConfig, {
    fetchImpl: async (url, options) => {
      lingRequests.push({ url, body: JSON.parse(options.body), headers: options.headers })
      return jsonResponse(200, { choices: [{ message: { content: '{"ok":true,"confidence":0.8}' } }] })
    }
  })
  const lingResult = await lingProvider.structured({
    featureType: 'classification',
    schemaName: 'IdtsLingContract',
    instruction: 'Return a JSON object only.',
    input: { title: 'Synthetic safe test' }
  })
  check('Ling model ID keeps its provider/model slash', lingConfig.modelAlias === 'inclusionai/ling-3.0-flash-free')
  check('Ling phase can intentionally disable embedding calls', lingConfig.embeddingModelAlias === null)
  check('Ling structured call succeeds through the safe envelope', lingResult.ok && lingResult.data.json.ok === true)
  check('Ling call uses fixed Vercel chat-completions endpoint', lingRequests[0]?.url === `${API_BASE_URL}/chat/completions`)
  check('Ling call requests JSON Schema output', lingRequests[0]?.body?.response_format?.type === 'json_schema')
  check('Ling result does not expose the gateway key', !JSON.stringify(lingResult).includes('test-only-gateway-key-not-for-network'))

  const fallbackRequests = []
  const fallbackProvider = createAiProvider(gatewayConfig({
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano',
    fallbackEmbeddingModelAlias: 'openai/text-embedding-3-small'
  }), {
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body)
      fallbackRequests.push({ url, model: body.model })
      if (body.model === 'alibaba/qwen3.7-flash') return jsonResponse(503, { error: { message: 'temporary upstream outage' } })
      return jsonResponse(200, { choices: [{ message: { content: '{"fallback":true}' } }] })
    }
  })
  const fallbackResult = await fallbackProvider.structured({
    featureType: 'handoff_summary',
    schemaName: 'IdtsFallbackContract',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic fallback test' }
  })
  check('retryable Qwen 5xx uses exactly one GPT fallback', fallbackRequests.length === 2 && fallbackRequests[0].model === 'alibaba/qwen3.7-flash' && fallbackRequests[1].model === 'openai/gpt-5.4-nano')
  check('fallback result records the actual model', fallbackResult.modelAlias === 'openai/gpt-5.4-nano' && fallbackResult.fallbackUsed === true)

  const deniedRequests = []
  const deniedProvider = createAiProvider(gatewayConfig({
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano'
  }), {
    fetchImpl: async (url, options) => {
      deniedRequests.push(JSON.parse(options.body).model)
      return jsonResponse(403, { error: { message: 'forbidden' } })
    }
  })
  const deniedResult = await deniedProvider.chat({ featureType: 'summary', messages: [{ role: 'user', content: 'Synthetic denial test' }] })
  check('403 does not attempt fallback', deniedRequests.length === 1)
  check('403 is returned as a sanitized provider failure', deniedResult.ok === false && deniedResult.status === 'AI_PROVIDER_ERROR' && !containsUnsafeDiagnosticText(deniedResult))

  const budgetRequests = []
  const budgetProvider = createAiProvider(gatewayConfig({
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano'
  }), {
    fetchImpl: async (url, options) => {
      budgetRequests.push(JSON.parse(options.body).model)
      return jsonResponse(429, { error: { message: 'spend quota exceeded' } })
    }
  })
  const budgetResult = await budgetProvider.chat({ featureType: 'summary', messages: [{ role: 'user', content: 'Synthetic budget test' }] })
  check('budget exhaustion does not attempt fallback', budgetRequests.length === 1)
  check('budget exhaustion remains a sanitized failure', budgetResult.ok === false && !containsUnsafeDiagnosticText(budgetResult))

  const embeddingRequests = []
  const embeddingProvider = createAiProvider(gatewayConfig({
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano',
    fallbackEmbeddingModelAlias: 'openai/text-embedding-3-small'
  }), {
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body)
      embeddingRequests.push(body.model)
      if (body.model === 'alibaba/qwen3-embedding-0.6b') return jsonResponse(503, { error: { message: 'temporary upstream outage' } })
      return jsonResponse(200, { data: [{ embedding: [0.1, 0.2, -0.3] }] })
    }
  })
  const embeddingResult = await embeddingProvider.embedding({ featureType: 'duplicate_detection', text: 'Synthetic duplicate check' })
  check('retryable embedding failure uses the configured embedding fallback once', embeddingRequests.join(',') === 'alibaba/qwen3-embedding-0.6b,openai/text-embedding-3-small')
  check('embedding fallback returns vector and actual model metadata', embeddingResult.ok && embeddingResult.data.embedding.length === 3 && embeddingResult.modelAlias === 'openai/text-embedding-3-small' && embeddingResult.fallbackUsed)

  console.log(`\nTOTAL: ${pass} PASS | ${fail} FAIL`)
  if (fail) process.exit(1)
}

main().catch(() => {
  console.error('FATAL: IDTS-114 provider verification could not start')
  process.exit(1)
})
