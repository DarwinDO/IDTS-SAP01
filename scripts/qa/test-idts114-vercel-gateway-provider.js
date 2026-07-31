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
const { runtimeOverrides } = require('../../srv/ai/config')
const {
  API_BASE_URL,
  activateGatewayCooldown,
  httpError,
  remainingCooldownSeconds,
  resetGatewayCooldownForTest,
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

  const routedConfig = gatewayConfig({
    classificationModelAlias: 'openai/gpt-5.6-luna',
    handoffModelAlias: 'deepseek/deepseek-v4-flash',
    assignmentModelAlias: 'zai/glm-4.7-flash',
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano',
    handoffFallbackModelAlias: 'xai/grok-4.1-fast-non-reasoning'
  })
  check('classification keeps its dedicated model alias', routedConfig.classificationModelAlias === 'openai/gpt-5.6-luna')
  check('handoff keeps its dedicated primary model alias', routedConfig.handoffModelAlias === 'deepseek/deepseek-v4-flash')
  check('Smart Assign keeps its dedicated model alias', routedConfig.assignmentModelAlias === 'zai/glm-4.7-flash')
  check('handoff keeps exactly one dedicated backup alias', routedConfig.handoffFallbackModelAlias === 'xai/grok-4.1-fast-non-reasoning')
  const routedEnvironment = runtimeOverrides({
    IDTS_AI_CLASSIFICATION_MODEL: 'openai/gpt-5.6-luna',
    IDTS_AI_HANDOFF_MODEL: 'deepseek/deepseek-v4-flash',
    IDTS_AI_ASSIGNMENT_MODEL: 'zai/glm-4.7-flash',
    IDTS_AI_HANDOFF_FALLBACK_MODEL: 'xai/grok-4.1-fast-non-reasoning'
  })
  check(
    'SAP BTP environment names map to every feature route',
    routedEnvironment.classificationModelAlias === 'openai/gpt-5.6-luna' &&
      routedEnvironment.handoffModelAlias === 'deepseek/deepseek-v4-flash' &&
      routedEnvironment.assignmentModelAlias === 'zai/glm-4.7-flash' &&
      routedEnvironment.handoffFallbackModelAlias === 'xai/grok-4.1-fast-non-reasoning'
  )

  const routedRequests = []
  const routedProvider = createAiProvider(routedConfig, {
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body)
      routedRequests.push(body.model)
      return jsonResponse(200, { choices: [{ message: { content: '{"ok":true}' } }] })
    }
  })
  await routedProvider.structured({
    featureType: 'CLASSIFICATION',
    schemaName: 'IdtsClassificationRouting',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic classification route' }
  })
  await routedProvider.structured({
    featureType: 'BUG_SUMMARY',
    schemaName: 'IdtsHandoffRouting',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic handoff route' }
  })
  await routedProvider.structured({
    featureType: 'ASSIGNMENT_EXPLANATION',
    schemaName: 'IdtsAssignmentRouting',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic assignment route' }
  })
  check(
    'structured features route to Luna, DeepSeek, and ZAI without changing their public contract',
    routedRequests.join(',') === 'openai/gpt-5.6-luna,deepseek/deepseek-v4-flash,zai/glm-4.7-flash'
  )

  const handoffDeniedModels = []
  const handoffDeniedProvider = createAiProvider(routedConfig, {
    fetchImpl: async (url, options) => {
      const model = JSON.parse(options.body).model
      handoffDeniedModels.push(model)
      if (model === 'deepseek/deepseek-v4-flash') {
        return jsonResponse(403, {
          error: {
            code: 'model_access_denied',
            message: 'The requested model is not available for this route.'
          }
        })
      }
      return jsonResponse(200, { choices: [{ message: { content: '{"backup":true}' } }] })
    }
  })
  const handoffDeniedResult = await handoffDeniedProvider.structured({
    featureType: 'BUG_SUMMARY',
    schemaName: 'IdtsHandoffModelDenied',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic model access denial' }
  })
  check(
    'model-specific DeepSeek denial uses Grok exactly once',
    handoffDeniedModels.join(',') === 'deepseek/deepseek-v4-flash,xai/grok-4.1-fast-non-reasoning'
  )
  check(
    'handoff backup records the actual Grok model',
    handoffDeniedResult.ok === true &&
      handoffDeniedResult.modelAlias === 'xai/grok-4.1-fast-non-reasoning' &&
      handoffDeniedResult.fallbackUsed === true
  )

  const handoffUnavailableModels = []
  const handoffUnavailableProvider = createAiProvider(routedConfig, {
    fetchImpl: async (url, options) => {
      const model = JSON.parse(options.body).model
      handoffUnavailableModels.push(model)
      if (model === 'deepseek/deepseek-v4-flash') {
        return jsonResponse(503, { error: { code: 'upstream_unavailable', message: 'Temporary outage.' } })
      }
      return jsonResponse(200, { choices: [{ message: { content: '{"backup":true}' } }] })
    }
  })
  const handoffUnavailableResult = await handoffUnavailableProvider.structured({
    featureType: 'BUG_SUMMARY',
    schemaName: 'IdtsHandoffUnavailable',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic provider outage' }
  })
  check(
    'handoff 5xx uses the dedicated Grok backup exactly once',
    handoffUnavailableModels.join(',') === 'deepseek/deepseek-v4-flash,xai/grok-4.1-fast-non-reasoning'
  )
  check(
    'handoff 5xx backup reports the actual Grok model',
    handoffUnavailableResult.ok === true &&
      handoffUnavailableResult.modelAlias === 'xai/grok-4.1-fast-non-reasoning' &&
      handoffUnavailableResult.fallbackUsed === true
  )

  resetGatewayCooldownForTest()
  const handoffRateLimitedModels = []
  const handoffRateLimitedProvider = createAiProvider(routedConfig, {
    fetchImpl: async (url, options) => {
      handoffRateLimitedModels.push(JSON.parse(options.body).model)
      return jsonResponse(429, { error: { code: 'rate_limit_exceeded', message: 'Too many requests.' } }, { 'retry-after': '2' })
    }
  })
  const handoffRateLimitedResult = await handoffRateLimitedProvider.structured({
    featureType: 'BUG_SUMMARY',
    schemaName: 'IdtsHandoffRateLimited',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic rate limit' }
  })
  check('handoff 429 never spends the Grok backup', handoffRateLimitedModels.join(',') === 'deepseek/deepseek-v4-flash')
  check('handoff 429 returns the safe cooldown status', handoffRateLimitedResult.status === 'AI_RATE_LIMITED')
  resetGatewayCooldownForTest()

  const genericDeniedModels = []
  const genericDeniedProvider = createAiProvider(routedConfig, {
    fetchImpl: async (url, options) => {
      genericDeniedModels.push(JSON.parse(options.body).model)
      return jsonResponse(403, { error: { type: 'access_denied', message: 'Forbidden.' } })
    }
  })
  const genericDeniedResult = await genericDeniedProvider.structured({
    featureType: 'BUG_SUMMARY',
    schemaName: 'IdtsHandoffAccountDenied',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic account denial' }
  })
  check('generic account/key 403 does not hide the fault behind Grok', genericDeniedModels.length === 1)
  check('generic 403 remains sanitized', genericDeniedResult.ok === false && !containsUnsafeDiagnosticText(genericDeniedResult))

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
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: { catalogRef: { type: 'string', enum: ['SM1'] } },
      required: ['catalogRef']
    },
    instruction: 'Return a JSON object only.',
    input: { title: 'Synthetic safe test' }
  })
  check('Ling model ID keeps its provider/model slash', lingConfig.modelAlias === 'inclusionai/ling-3.0-flash-free')
  check('Ling phase can intentionally disable embedding calls', lingConfig.embeddingModelAlias === null)
  check('Ling structured call succeeds through the safe envelope', lingResult.ok && lingResult.data.json.ok === true)
  check('Ling call uses fixed Vercel chat-completions endpoint', lingRequests[0]?.url === `${API_BASE_URL}/chat/completions`)
  check('Ling call requests JSON Schema output', lingRequests[0]?.body?.response_format?.type === 'json_schema')
  check('feature-specific JSON Schema reaches the gateway unchanged', lingRequests[0]?.body?.response_format?.json_schema?.schema?.properties?.catalogRef?.enum?.[0] === 'SM1')
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
    'malformed prompt-only Qwen output stops after the bounded Qwen compatibility retry',
    malformedCompatibilityRequests.length === 2 &&
      malformedCompatibilityRequests[0].model === 'alibaba/qwen3.7-flash' &&
      malformedCompatibilityRequests[1].model === 'alibaba/qwen3.7-flash' &&
      malformedCompatibilityRequests[1].format === undefined
  )
  check(
    'malformed Qwen output is sanitized for deterministic feature fallback',
    malformedCompatibilityResult.ok === false &&
      malformedCompatibilityResult.status === 'AI_PROVIDER_ERROR' &&
      malformedCompatibilityResult.modelAlias === 'alibaba/qwen3.7-flash'
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

  resetGatewayCooldownForTest()
  let now = 1_000_000
  const transientRateLimitRequests = []
  const transientRateLimitProvider = createAiProvider(gatewayConfig({
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano'
  }), {
    now: () => now,
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body)
      transientRateLimitRequests.push(body.model)
      if (transientRateLimitRequests.length === 1) {
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
    'transient 429 does not call the configured fallback',
    transientRateLimitRequests.join(',') === 'alibaba/qwen3.7-flash'
  )
  check(
    'transient 429 returns the safe rate-limited status',
    transientRateLimitResult.ok === false &&
      transientRateLimitResult.status === 'AI_RATE_LIMITED' &&
      transientRateLimitResult.error?.retryable === true
  )
  const cooldownResult = await transientRateLimitProvider.structured({
    featureType: 'handoff_summary',
    schemaName: 'IdtsCooldownContract',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic cooldown test' }
  })
  check('request during cooldown does not call the network', transientRateLimitRequests.length === 1)
  check('request during cooldown returns AI_RATE_LIMITED', cooldownResult.status === 'AI_RATE_LIMITED')
  now += 31_000
  const afterCooldownResult = await transientRateLimitProvider.structured({
    featureType: 'handoff_summary',
    schemaName: 'IdtsCooldownRecovery',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic cooldown recovery' }
  })
  check('request after cooldown reaches Qwen again', transientRateLimitRequests.length === 2 && transientRateLimitRequests[1] === 'alibaba/qwen3.7-flash')
  check('request after cooldown can succeed without fallback', afterCooldownResult.ok === true && afterCooldownResult.fallbackUsed === false)
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

  resetGatewayCooldownForTest()
  let proactiveNow = 3_000_000
  const proactiveRequests = []
  const proactiveProvider = createAiProvider(gatewayConfig({
    modelAlias: 'zai/glm-4.7-flash',
    requestLimit: 2,
    requestWindowSeconds: 60
  }), {
    now: () => proactiveNow,
    fetchImpl: async (url, options) => {
      proactiveRequests.push(JSON.parse(options.body).model)
      return jsonResponse(200, { choices: [{ message: { content: '{"ok":true}' } }] })
    }
  })
  const proactiveCall = title => proactiveProvider.structured({
    featureType: 'classification',
    schemaName: 'IdtsProactiveRateLimit',
    instruction: 'Return JSON only.',
    input: { title }
  })
  await proactiveCall('Synthetic request one')
  await proactiveCall('Synthetic request two')
  const proactivelyLimited = await proactiveCall('Synthetic request three')
  check('configured request limit reaches the provider only twice', proactiveRequests.length === 2)
  check(
    'request beyond the local model budget returns safe AI_RATE_LIMITED',
    proactivelyLimited.ok === false && proactivelyLimited.status === 'AI_RATE_LIMITED'
  )

  const isolatedEmbeddingProvider = createAiProvider(gatewayConfig({
    modelAlias: 'zai/glm-4.7-flash',
    embeddingModelAlias: 'alibaba/qwen3-embedding-0.6b',
    requestLimit: 2,
    requestWindowSeconds: 60
  }), {
    now: () => proactiveNow,
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body)
      proactiveRequests.push(body.model)
      return jsonResponse(200, { data: [{ index: 0, embedding: [0.1, 0.2, 0.3] }] })
    }
  })
  const isolatedEmbedding = await isolatedEmbeddingProvider.embedding({
    featureType: 'duplicate_detection',
    text: 'Synthetic embedding remains isolated'
  })
  check(
    'Z.AI structured budget does not block the separate Qwen embedding model',
    isolatedEmbedding.ok === true && proactiveRequests.at(-1) === 'alibaba/qwen3-embedding-0.6b'
  )

  proactiveNow += 61_000
  const recoveredProactiveCall = await proactiveCall('Synthetic request after window')
  check('request budget recovers after its configured window', recoveredProactiveCall.ok === true && proactiveRequests.filter(model => model === 'zai/glm-4.7-flash').length === 3)

  resetGatewayCooldownForTest()
  activateGatewayCooldown(null, 2_000_000)
  check('missing Retry-After uses the safe 60-second default', remainingCooldownSeconds(2_000_000) === 60)
  resetGatewayCooldownForTest()
  activateGatewayCooldown(9999, 2_000_000)
  check('Retry-After cooldown is clamped to 900 seconds', remainingCooldownSeconds(2_000_000) === 900)

  resetGatewayCooldownForTest()
  const batchRequests = []
  const batchProvider = createAiProvider(gatewayConfig(), {
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body)
      batchRequests.push(body)
      return jsonResponse(200, {
        data: body.input.map((text, index) => ({ index, embedding: [index + 0.1, index + 0.2, index + 0.3] }))
      })
    }
  })
  const batchResult = await batchProvider.embeddingBatch({
    featureType: 'duplicate_detection',
    texts: ['Synthetic source', 'Synthetic candidate one', 'Synthetic candidate two']
  })
  check('embedding batch sends one HTTP request with three inputs', batchRequests.length === 1 && batchRequests[0].input.length === 3)
  check('embedding batch preserves input order and vector dimensions', batchResult.ok && batchResult.data.embeddings.length === 3 && batchResult.data.embeddings.every(vector => vector.length === 3))

  resetGatewayCooldownForTest()
  const malformedBatchProvider = createAiProvider(gatewayConfig(), {
    fetchImpl: async () => jsonResponse(200, {
      data: [
        { index: 0, embedding: [0.1, 0.2] },
        { index: 1, embedding: [0.3] }
      ]
    })
  })
  const malformedBatchResult = await malformedBatchProvider.embeddingBatch({
    featureType: 'duplicate_detection',
    texts: ['Synthetic source', 'Synthetic candidate']
  })
  check('embedding batch with mixed dimensions fails safely', malformedBatchResult.ok === false && malformedBatchResult.status === 'AI_PROVIDER_ERROR')

  resetGatewayCooldownForTest()
  const unsupportedBatchModels = []
  const unsupportedBatchProvider = createAiProvider(gatewayConfig({
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano',
    fallbackEmbeddingModelAlias: 'openai/text-embedding-3-small'
  }), {
    fetchImpl: async (url, options) => {
      unsupportedBatchModels.push(JSON.parse(options.body).model)
      return jsonResponse(400, { error: { code: 'invalid_input', message: 'Array input is not supported.' } })
    }
  })
  const unsupportedBatchResult = await unsupportedBatchProvider.embeddingBatch({
    featureType: 'duplicate_detection',
    texts: ['Synthetic source', 'Synthetic candidate']
  })
  check('batch HTTP 400 does not spend an embedding fallback request', unsupportedBatchModels.length === 1)
  check('batch HTTP 400 exposes only the compatibility status', unsupportedBatchResult.status === 'AI_EMBEDDING_BATCH_UNSUPPORTED')

  resetGatewayCooldownForTest()
  const genericBatchBadRequestModels = []
  const genericBatchBadRequestProvider = createAiProvider(gatewayConfig({
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano',
    fallbackEmbeddingModelAlias: 'openai/text-embedding-3-small'
  }), {
    fetchImpl: async (url, options) => {
      genericBatchBadRequestModels.push(JSON.parse(options.body).model)
      return jsonResponse(400, { error: { code: 'invalid_request', message: 'Malformed embedding payload.' } })
    }
  })
  const genericBatchBadRequestResult = await genericBatchBadRequestProvider.embeddingBatch({
    featureType: 'duplicate_detection',
    texts: ['Synthetic source', 'Synthetic candidate']
  })
  check('generic embedding batch HTTP 400 does not retry or use fallback', genericBatchBadRequestModels.length === 1)
  check('generic embedding batch HTTP 400 remains a sanitized provider error', genericBatchBadRequestResult.status === 'AI_PROVIDER_ERROR' && !containsUnsafeDiagnosticText(genericBatchBadRequestResult))

  resetGatewayCooldownForTest()
  const embeddingRateLimitModels = []
  const embeddingRateLimitProvider = createAiProvider(gatewayConfig({
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano',
    fallbackEmbeddingModelAlias: 'openai/text-embedding-3-small'
  }), {
    fetchImpl: async (url, options) => {
      embeddingRateLimitModels.push(JSON.parse(options.body).model)
      return jsonResponse(429, { error: { code: 'rate_limit_exceeded', message: 'Please retry later.' } }, { 'Retry-After': '5' })
    }
  })
  const embeddingRateLimitResult = await embeddingRateLimitProvider.embedding({
    featureType: 'duplicate_detection',
    text: 'Synthetic rate-limited embedding'
  })
  check('embedding 429 does not call OpenAI fallback', embeddingRateLimitModels.length === 1)
  check('embedding 429 returns AI_RATE_LIMITED', embeddingRateLimitResult.status === 'AI_RATE_LIMITED')

  resetGatewayCooldownForTest()
  const malformedStructuredModels = []
  const malformedStructuredProvider = createAiProvider(gatewayConfig({
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano'
  }), {
    fetchImpl: async (url, options) => {
      malformedStructuredModels.push(JSON.parse(options.body).model)
      return jsonResponse(200, { choices: [{ message: { content: 'not-json' } }] })
    }
  })
  const malformedStructuredResult = await malformedStructuredProvider.structured({
    featureType: 'classification',
    schemaName: 'IdtsMalformedContract',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic malformed response' }
  })
  check('malformed structured output does not call OpenAI fallback', malformedStructuredModels.length === 1)
  check('malformed structured output uses safe feature fallback status', malformedStructuredResult.ok === false && malformedStructuredResult.status === 'AI_PROVIDER_ERROR')

  const deadlineModels = []
  const deadlineProvider = createAiProvider(gatewayConfig({
    timeoutMs: 40,
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano'
  }), {
    fetchImpl: async (url, options) => {
      deadlineModels.push(JSON.parse(options.body).model)
      return new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          reject(Object.assign(new Error('Synthetic deadline abort'), { name: 'AbortError' }))
        }, { once: true })
      })
    }
  })
  const deadlineStarted = Date.now()
  const deadlineResult = await deadlineProvider.structured({
    featureType: 'assignment_explanation',
    schemaName: 'IdtsSmartAssignmentDeadline',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic deadline test' },
    deadlineMs: 10
  })
  check('feature deadline aborts only the primary request', deadlineModels.join(',') === 'alibaba/qwen3.7-flash')
  check('feature deadline returns a safe timeout envelope', deadlineResult.ok === false && deadlineResult.status === 'AI_TIMEOUT')
  check('feature deadline returns before the configured primary-plus-fallback window', Date.now() - deadlineStarted < 60)

  const boundedFallbackModels = []
  const boundedFallbackProvider = createAiProvider(gatewayConfig({
    timeoutMs: 100,
    fallbackEnabled: true,
    fallbackModelAlias: 'openai/gpt-5.4-nano'
  }), {
    fetchImpl: async (url, options) => {
      const model = JSON.parse(options.body).model
      boundedFallbackModels.push(model)
      if (model === 'alibaba/qwen3.7-flash') {
        return jsonResponse(503, { error: { message: 'Synthetic upstream outage' } })
      }
      return jsonResponse(200, { choices: [{ message: { content: '{"fallback":true}' } }] })
    }
  })
  const boundedFallbackResult = await boundedFallbackProvider.structured({
    featureType: 'assignment_explanation',
    schemaName: 'IdtsSmartAssignmentDeadlineFallback',
    instruction: 'Return JSON only.',
    input: { title: 'Synthetic bounded fallback test' },
    deadlineMs: 50
  })
  check('fast HTTP 5xx may still use one fallback inside the feature deadline', boundedFallbackModels.join(',') === 'alibaba/qwen3.7-flash,openai/gpt-5.4-nano')
  check('bounded fallback reports its actual model', boundedFallbackResult.ok === true && boundedFallbackResult.fallbackUsed === true && boundedFallbackResult.modelAlias === 'openai/gpt-5.4-nano')

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
