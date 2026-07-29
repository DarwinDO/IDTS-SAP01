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
const {
  API_BASE_URL,
  httpError,
  unwrapSchemaEnvelope
} = require('../../srv/ai/vercel-gateway-provider')
const { containsUnsafeDiagnosticText } = require('../../srv/ai/safety')

let pass = 0
let fail = 0

function check (label, condition) {
  if (condition) pass++; else fail++
  console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${label}`)
}

function jsonResponse (status, payload, headers = {}) {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), String(value)])
  )
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: name => normalizedHeaders[String(name).toLowerCase()] || null },
    json: async () => payload
  }
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

  const directCandidates = { candidates: [{ developerProfileID: 'candidate-1' }] }
  check(
    'direct structured payload remains unchanged',
    unwrapSchemaEnvelope(directCandidates, 'IdtsSmartAssignmentExplanation') === directCandidates
  )
  check(
    'exact object schema wrapper unwraps once',
    unwrapSchemaEnvelope(
      { IdtsSmartAssignmentExplanation: directCandidates },
      'IdtsSmartAssignmentExplanation'
    ) === directCandidates
  )
  const multiKeyEnvelope = {
    IdtsSmartAssignmentExplanation: directCandidates,
    metadata: { source: 'provider' }
  }
  check(
    'multi-key provider payload is not unwrapped',
    unwrapSchemaEnvelope(multiKeyEnvelope, 'IdtsSmartAssignmentExplanation') === multiKeyEnvelope
  )
  const arrayEnvelope = { IdtsSmartAssignmentExplanation: [] }
  check(
    'array schema wrapper is not unwrapped',
    unwrapSchemaEnvelope(arrayEnvelope, 'IdtsSmartAssignmentExplanation') === arrayEnvelope
  )
  const unrelatedEnvelope = { DifferentContract: directCandidates }
  check(
    'unrelated one-key provider payload is not unwrapped',
    unwrapSchemaEnvelope(unrelatedEnvelope, 'IdtsSmartAssignmentExplanation') === unrelatedEnvelope
  )

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

  const compatibilityRequests = []
  const compatibilityProvider = createAiProvider(gatewayConfig({
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano'
  }), {
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body)
      compatibilityRequests.push({
        model: body.model,
        format: body.response_format,
        systemInstruction: body.messages?.[0]?.content
      })
      if (body.response_format?.type === 'json_schema') {
        return jsonResponse(400, {
          error: {
            code: 'unsupported_response_format',
            message: 'The selected model does not support response_format json_schema.'
          }
        })
      }
      return jsonResponse(200, { choices: [{ message: { content: '{"compatible":true}' } }] })
    }
  })
  const compatibilityResult = await compatibilityProvider.structured({
    featureType: 'classification',
    schemaName: 'IdtsCompatibilityContract',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic compatibility test' }
  })
  check(
    'response-format 400 retries exactly once on the same Qwen model',
    compatibilityRequests.length === 2 &&
      compatibilityRequests.every(request => request.model === 'alibaba/qwen3.7-flash')
  )
  check(
    'compatibility retry omits response_format and adds a bounded JSON-only instruction',
    compatibilityRequests[0]?.format?.type === 'json_schema' &&
      compatibilityRequests[1]?.format === undefined &&
      compatibilityRequests[1]?.systemInstruction?.includes('IdtsCompatibilityContract') &&
      compatibilityRequests[1]?.systemInstruction?.includes('valid JSON object only') &&
      compatibilityRequests[1]?.systemInstruction?.includes('Do not use Markdown')
  )
  check(
    'successful compatibility retry remains primary Qwen without fallback',
    compatibilityResult.ok &&
      compatibilityResult.data.json.compatible === true &&
      compatibilityResult.modelAlias === 'alibaba/qwen3.7-flash' &&
      compatibilityResult.fallbackUsed === false
  )

  const wrappedCompatibilityProvider = createAiProvider(gatewayConfig(), {
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body)
      if (body.response_format?.type === 'json_schema') {
        return jsonResponse(400, {
          error: {
            code: 'unsupported_response_format',
            message: 'The selected model does not support response_format json_schema.'
          }
        })
      }
      return jsonResponse(200, {
        choices: [{
          message: {
            content: JSON.stringify({
              IdtsSmartAssignmentExplanation: {
                candidates: [{ developerProfileID: '11111111-1111-1111-1111-111111111111', explanation: 'Synthetic fit.' }]
              }
            })
          }
        }]
      })
    }
  })
  const wrappedCompatibilityResult = await wrappedCompatibilityProvider.structured({
    featureType: 'assignment_explanation',
    schemaName: 'IdtsSmartAssignmentExplanation',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic wrapped compatibility test' }
  })
  check(
    'exact schema-name wrapper is removed before feature validation',
    wrappedCompatibilityResult.ok &&
      Array.isArray(wrappedCompatibilityResult.data.json.candidates) &&
      wrappedCompatibilityResult.data.json.candidates.length === 1 &&
      wrappedCompatibilityResult.data.json.IdtsSmartAssignmentExplanation === undefined
  )

  const malformedCompatibilityRequests = []
  const malformedCompatibilityProvider = createAiProvider(gatewayConfig({
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano'
  }), {
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body)
      malformedCompatibilityRequests.push({ model: body.model, format: body.response_format })
      if (body.model === 'openai/gpt-5.4-nano') {
        return jsonResponse(200, { choices: [{ message: { content: '{"safeFallback":true}' } }] })
      }
      if (body.response_format?.type === 'json_schema') {
        return jsonResponse(400, {
          error: {
            code: 'unsupported_response_format',
            message: 'The selected model does not support response_format json_schema.'
          }
        })
      }
      return jsonResponse(200, { choices: [{ message: { content: 'not-json' } }] })
    }
  })
  const malformedCompatibilityResult = await malformedCompatibilityProvider.structured({
    featureType: 'classification',
    schemaName: 'IdtsMalformedCompatibilityContract',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic malformed compatibility test' }
  })
  check(
    'malformed prompt-only Qwen output uses only the existing bounded fallback',
    malformedCompatibilityRequests.length === 3 &&
      malformedCompatibilityRequests[0].model === 'alibaba/qwen3.7-flash' &&
      malformedCompatibilityRequests[1].model === 'alibaba/qwen3.7-flash' &&
      malformedCompatibilityRequests[1].format === undefined &&
      malformedCompatibilityRequests[2].model === 'openai/gpt-5.4-nano'
  )
  check(
    'fallback after malformed Qwen output remains sanitized and parseable',
    malformedCompatibilityResult.ok &&
      malformedCompatibilityResult.data.json.safeFallback === true &&
      malformedCompatibilityResult.modelAlias === 'openai/gpt-5.4-nano' &&
      malformedCompatibilityResult.fallbackUsed === true
  )

  const repeatedCompatibilityFailureRequests = []
  const repeatedCompatibilityFailureProvider = createAiProvider(gatewayConfig({
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano'
  }), {
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body)
      repeatedCompatibilityFailureRequests.push(body.model)
      return jsonResponse(400, {
        error: {
          code: body.response_format ? 'unsupported_response_format' : 'invalid_request',
          message: body.response_format
            ? 'The selected model does not support response_format json_schema.'
            : 'The prompt-only request is invalid.'
        }
      })
    }
  })
  const repeatedCompatibilityFailureResult = await repeatedCompatibilityFailureProvider.structured({
    featureType: 'classification',
    schemaName: 'IdtsRepeatedCompatibilityFailure',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic repeated compatibility failure' }
  })
  check(
    'prompt-only compatibility failure does not cause a third request or fallback',
    repeatedCompatibilityFailureRequests.length === 2 &&
      repeatedCompatibilityFailureRequests.every(model => model === 'alibaba/qwen3.7-flash')
  )
  check(
    'prompt-only compatibility failure remains sanitized',
    repeatedCompatibilityFailureResult.ok === false &&
      repeatedCompatibilityFailureResult.status === 'AI_PROVIDER_ERROR' &&
      !containsUnsafeDiagnosticText(repeatedCompatibilityFailureResult)
  )

  const fallbackCompatibilityRequests = []
  const fallbackCompatibilityProvider = createAiProvider(gatewayConfig({
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano'
  }), {
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body)
      fallbackCompatibilityRequests.push({ model: body.model, format: body.response_format })
      if (body.model === 'alibaba/qwen3.7-flash') {
        return jsonResponse(503, { error: { message: 'temporary upstream outage' } })
      }
      return jsonResponse(400, {
        error: {
          code: 'unsupported_response_format',
          message: 'The fallback model rejected response_format json_schema.'
        }
      })
    }
  })
  const fallbackCompatibilityResult = await fallbackCompatibilityProvider.structured({
    featureType: 'classification',
    schemaName: 'IdtsFallbackCompatibilityContract',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic fallback compatibility test' }
  })
  check(
    'fallback model never enters the Qwen prompt-only compatibility path',
    fallbackCompatibilityRequests.length === 2 &&
      fallbackCompatibilityRequests[0].model === 'alibaba/qwen3.7-flash' &&
      fallbackCompatibilityRequests[1].model === 'openai/gpt-5.4-nano' &&
      fallbackCompatibilityRequests[1].format?.type === 'json_schema'
  )
  check(
    'fallback response-format failure remains sanitized',
    fallbackCompatibilityResult.ok === false &&
      fallbackCompatibilityResult.status === 'AI_PROVIDER_ERROR' &&
      !containsUnsafeDiagnosticText(fallbackCompatibilityResult)
  )

  const genericBadRequestModels = []
  const genericBadRequestProvider = createAiProvider(gatewayConfig({
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano'
  }), {
    fetchImpl: async (url, options) => {
      genericBadRequestModels.push(JSON.parse(options.body).model)
      return jsonResponse(400, { error: { code: 'invalid_request', message: 'Malformed input payload.' } })
    }
  })
  const genericBadRequestResult = await genericBadRequestProvider.structured({
    featureType: 'handoff_summary',
    schemaName: 'IdtsGenericBadRequest',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic invalid request' }
  })
  check('generic HTTP 400 does not compatibility-retry or use fallback', genericBadRequestModels.length === 1)
  check('generic HTTP 400 remains sanitized', genericBadRequestResult.ok === false && !containsUnsafeDiagnosticText(genericBadRequestResult))

  const transientRateLimitRequests = []
  const transientRateLimitProvider = createAiProvider(gatewayConfig({
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano'
  }), {
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body)
      transientRateLimitRequests.push(body.model)
      if (body.model === 'alibaba/qwen3.7-flash') {
        return jsonResponse(
          429,
          { error: { code: 'rate_limit_exceeded', message: 'Please retry later.' } },
          { 'Retry-After': '30' }
        )
      }
      return jsonResponse(200, { choices: [{ message: { content: '{"fallback":true}' } }] })
    }
  })
  const transientRateLimitResult = await transientRateLimitProvider.structured({
    featureType: 'smart_assignment',
    schemaName: 'IdtsRateLimitContract',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic rate limit test' }
  })
  check(
    'transient 429 remains eligible for exactly one configured fallback',
    transientRateLimitRequests.join(',') === 'alibaba/qwen3.7-flash,openai/gpt-5.4-nano'
  )
  check(
    'transient 429 fallback result records the fallback model safely',
    transientRateLimitResult.ok &&
      transientRateLimitResult.modelAlias === 'openai/gpt-5.4-nano' &&
      transientRateLimitResult.fallbackUsed === true
  )
  const transientRateLimitError = httpError(
    429,
    { error: { code: 'rate_limit_exceeded', message: 'Please retry later.' } },
    '30'
  )
  check(
    'transient 429 carries only bounded safe retry metadata',
    transientRateLimitError.gatewayReason === 'rate_limited' &&
      transientRateLimitError.providerErrorCode === 'rate_limit_exceeded' &&
      transientRateLimitError.retryAfterSeconds === 30 &&
      !containsUnsafeDiagnosticText(transientRateLimitError)
  )
  const budgetError = httpError(429, { error: { code: 'quota_exceeded', message: 'Spend quota exceeded.' } }, '120')
  check(
    'budget 429 is distinguished from a transient rate limit',
    budgetError.gatewayReason === 'budget_exhausted' &&
      budgetError.retryable === false &&
      budgetError.fallbackEligible === false
  )

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
