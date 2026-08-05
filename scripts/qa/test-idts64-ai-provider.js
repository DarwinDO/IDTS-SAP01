#!/usr/bin/env node
'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const Module = require('module')
const _originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return _originalResolve.call(this, request, parent, isMain, options)
}

const {
  createAiProvider,
  normalizeAiConfig,
  readGatewayApiKeyFromVcap,
  redactSensitiveText
} = require('../../srv/ai')
const { containsUnsafeDiagnosticText } = require('../../srv/ai/safety')
const { OpenAiProvider } = require('../../srv/ai/openai-provider')
const { safeFailureCode } = require('../../srv/ai/provider')

const RESULTS = []
let PASS = 0
let FAIL = 0

function rec (label, pass, detail = '') {
  const icon = pass ? 'PASS' : 'FAIL'
  if (pass) PASS++; else FAIL++
  console.log(`  ${icon}  ${label}${detail ? ' | ' + detail : ''}`)
  RESULTS.push({ label, pass, detail })
}

function expectEqual (label, actual, expected) {
  rec(label, actual === expected, `actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`)
}

function expectTruthy (label, actual) {
  rec(label, Boolean(actual), `actual=${JSON.stringify(actual)}`)
}

function expectNoUnsafeDiagnostic (label, value) {
  rec(label, !containsUnsafeDiagnosticText(value), containsUnsafeDiagnosticText(value) ? JSON.stringify(value) : 'no unsafe detail detected')
}

async function main () {
  console.log('')
  console.log('==============================================')
  console.log(' IDTS-64 AI Provider Abstraction Verification')
  console.log(' ' + new Date().toISOString())
  console.log('==============================================')

  const disabledConfig = normalizeAiConfig({})
  expectEqual('AI is disabled by default', disabledConfig.enabled, false)
  expectEqual('default provider is mock', disabledConfig.provider, 'mock')
  expectEqual(
    'ordinary assignment wording containing select remains safe',
    containsUnsafeDiagnosticText({ explanation: 'Review fit and select this candidate manually.' }),
    false
  )
  expectEqual(
    'actual SQL SELECT diagnostic remains unsafe',
    containsUnsafeDiagnosticText({ explanation: 'SELECT passwordHash FROM Users WHERE ID = 1' }),
    true
  )

  const vcapGatewayKey = readGatewayApiKeyFromVcap({
    VCAP_SERVICES: JSON.stringify({
      'user-provided': [
        { name: 'idts-sap01-external-services', credentials: { gatewayApiKey: 'must-not-be-read' } },
        { name: 'idts-sap01-ai-gateway', credentials: { gatewayApiKey: 'test-only-vcap-gateway-key' } }
      ]
    })
  })
  expectEqual('dedicated VCAP binding supplies the gateway key', vcapGatewayKey, 'test-only-vcap-gateway-key')
  expectEqual('invalid VCAP input does not throw or invent a key', readGatewayApiKeyFromVcap({ VCAP_SERVICES: '{not-json' }), null)

  const disabledProvider = createAiProvider(disabledConfig)
  const disabledResult = await disabledProvider.chat({
    featureType: 'duplicate_detection',
    messages: [{ role: 'user', content: 'Find similar bugs' }]
  })
  expectEqual('disabled chat returns safe no-op failure', disabledResult.status, 'AI_DISABLED')
  expectEqual('disabled chat does not throw', disabledResult.ok, false)
  expectNoUnsafeDiagnostic('disabled response excludes unsafe diagnostic text', disabledResult)

  const mockConfig = normalizeAiConfig({
    enabled: true,
    provider: 'mock',
    modelAlias: 'qa-mock-chat',
    embeddingModelAlias: 'qa-mock-embedding',
    mockResponseText: 'Safe mock response.',
    mockStructuredOutput: { suggestion: 'P1', confidence: 0.8 },
    mockEmbeddingDimensions: 6
  })
  const mockProvider = createAiProvider(mockConfig)

  const chatResult = await mockProvider.chat({
    featureType: 'summary',
    messages: [
      { role: 'system', content: 'Summarize only.' },
      { role: 'user', content: 'Bug mentions xkeysib-123456789012345678901234567890 and postgresql://user:pass@host/db' }
    ]
  })
  expectEqual('mock chat succeeds', chatResult.ok, true)
  expectEqual('mock chat maps model alias', chatResult.modelAlias, 'qa-mock-chat')
  expectEqual('mock chat returns configured text', chatResult.data.text, 'Safe mock response.')
  expectNoUnsafeDiagnostic('mock chat result excludes redacted secret source text', chatResult)

  const structuredResult = await mockProvider.structured({
    featureType: 'classification',
    schemaName: 'ClassificationSuggestion',
    instruction: 'Suggest catalog values',
    input: {
      title: 'Login fails',
      password: 'super-secret-password-value',
      nested: {
        token: 'Bearer ' + 'a'.repeat(40)
      }
    }
  })
  expectEqual('mock structured succeeds', structuredResult.ok, true)
  expectEqual('mock structured returns schema name', structuredResult.data.json.schemaName, 'ClassificationSuggestion')
  expectNoUnsafeDiagnostic('structured result excludes unsafe prompt data', structuredResult)

  const embeddingResult = await mockProvider.embedding({
    featureType: 'duplicate_detection',
    text: 'Login fails after reset'
  })
  expectEqual('mock embedding succeeds', embeddingResult.ok, true)
  expectEqual('embedding dimensions are configured', embeddingResult.data.dimensions, 6)
  expectEqual('embedding vector length matches dimensions', embeddingResult.data.embedding.length, 6)
  expectEqual('embedding model alias is separate', embeddingResult.modelAlias, 'qa-mock-embedding')

  const errorProvider = createAiProvider(normalizeAiConfig({
    enabled: true,
    provider: 'mock',
    mockMode: 'error'
  }))
  const errorResult = await errorProvider.chat({
    featureType: 'summary',
    messages: [{ role: 'user', content: 'Trigger mock failure' }]
  })
  expectEqual('provider error returns safe failure result', errorResult.ok, false)
  expectEqual('provider error status is generic', errorResult.status, 'AI_PROVIDER_ERROR')
  expectEqual('provider error is retryable when provider marks it retryable', errorResult.error.retryable, true)
  expectNoUnsafeDiagnostic('provider error excludes raw SQL, token, key, and stack detail', errorResult)

  const timeoutProvider = createAiProvider(normalizeAiConfig({
    enabled: true,
    provider: 'mock',
    mockMode: 'timeout',
    timeoutMs: 5
  }))
  const timeoutResult = await timeoutProvider.embedding({
    featureType: 'duplicate_detection',
    text: 'Timeout path'
  })
  expectEqual('timeout returns safe failure result', timeoutResult.ok, false)
  expectEqual('timeout status is AI_TIMEOUT', timeoutResult.status, 'AI_TIMEOUT')
  expectEqual('timeout is retryable', timeoutResult.error.retryable, true)
  expectNoUnsafeDiagnostic('timeout response excludes unsafe diagnostic text', timeoutResult)

  expectEqual('Gateway HTTP 400 maps to semantic bad-request outcome', safeFailureCode({ code: 'VERCEL_GATEWAY_HTTP_400' }), 'AI_BAD_REQUEST')
  expectEqual('Gateway HTTP 503 maps to semantic provider-5xx outcome', safeFailureCode({ code: 'VERCEL_GATEWAY_HTTP_503' }), 'AI_PROVIDER_5XX')
  expectEqual('Gateway network failure maps to semantic unavailable outcome', safeFailureCode({ code: 'VERCEL_GATEWAY_NETWORK_ERROR' }), 'AI_UNAVAILABLE')
  expectEqual('Gateway HTTP 403 remains a generic sanitized provider failure', safeFailureCode({ code: 'VERCEL_GATEWAY_HTTP_403' }), 'AI_PROVIDER_ERROR')

  const incompleteOpenAiConfig = normalizeAiConfig({
    enabled: true,
    provider: 'openai',
    modelAlias: 'review-model'
  })
  expectEqual('OpenAI config identifies missing private key', incompleteOpenAiConfig.ready, false)
  const incompleteOpenAiProvider = createAiProvider(incompleteOpenAiConfig)
  const incompleteOpenAiResult = await incompleteOpenAiProvider.structured({
    featureType: 'classification',
    instruction: 'Suggest a catalog value.',
    input: { title: 'Synthetic test bug' }
  })
  expectEqual('incomplete OpenAI config returns safe result', incompleteOpenAiResult.status, 'AI_CONFIGURATION_INCOMPLETE')
  expectNoUnsafeDiagnostic('incomplete OpenAI config excludes private detail', incompleteOpenAiResult)

  const requests = []
  const fakeFetch = async (url, options) => {
    requests.push({ url, options })
    const isEmbedding = url.endsWith('/embeddings')
    return {
      ok: true,
      status: 200,
      json: async () => isEmbedding
        ? { data: [{ embedding: [0.1, -0.2, 0.3] }] }
        : { output_text: '{"priority":"HIGH","confidence":0.9}' }
    }
  }
  const openAiConfig = normalizeAiConfig({
    enabled: true,
    provider: 'openai',
    openaiApiKey: 'test-only-key-not-for-network',
    modelAlias: 'review-model',
    embeddingModelAlias: 'embedding-model'
  })
  const safeOpenAiProvider = createAiProvider(openAiConfig, { fetchImpl: fakeFetch })
  const openAiBatchUnsupported = await safeOpenAiProvider.embeddingBatch({
    featureType: 'duplicate_detection',
    texts: ['Synthetic source', 'Synthetic candidate']
  })
  expectEqual('OpenAI adapter without batch support returns compatibility status', openAiBatchUnsupported.status, 'AI_EMBEDDING_BATCH_UNSUPPORTED')
  expectEqual('unsupported OpenAI batch does not issue a network request', requests.length, 0)

  const openAiProvider = new OpenAiProvider(openAiConfig, fakeFetch)
  const openAiStructured = await openAiProvider.structured({
    schemaName: 'Idts Classification',
    instruction: 'Use only supplied catalogs.',
    input: { title: 'Synthetic test bug' }
  })
  expectEqual('OpenAI structured provider parses JSON response', openAiStructured.json.priority, 'HIGH')
  expectEqual('OpenAI structured provider uses no-response-storage mode', JSON.parse(requests[0].options.body).store, false)
  expectTruthy('OpenAI structured provider uses Responses endpoint', requests[0].url.endsWith('/v1/responses'))
  const openAiEmbedding = await openAiProvider.embedding({ text: 'Synthetic embedding input' })
  expectEqual('OpenAI embedding provider returns provider vector', openAiEmbedding.embedding.length, 3)
  expectEqual('OpenAI embedding provider uses configured embedding model', JSON.parse(requests[1].options.body).model, 'embedding-model')

  const redacted = redactSensitiveText(`AWS key AKIA${'1'.repeat(16)} and xkeysib-${'1'.repeat(30)}`)
  expectTruthy('redactor masks AWS access key', redacted.includes('[redacted:awsAccessKey]'))
  expectTruthy('redactor masks Brevo API key', redacted.includes('[redacted:brevoApiKey]'))
  const boundedRedaction = redactSensitiveText('x'.repeat(700), 500)
  expectEqual('redactor output stays within the requested persistence limit', boundedRedaction.length, 500)
  expectTruthy('bounded redaction keeps an explicit truncation marker', boundedRedaction.endsWith('...[truncated]'))

  console.log('')
  console.log('==============================================')
  console.log(` TOTAL: ${PASS} PASS  |  ${FAIL} FAIL  |  ${RESULTS.length} checks`)
  console.log('==============================================')

  if (FAIL > 0) {
    console.log('\nFAILED:')
    for (const result of RESULTS.filter(row => !row.pass)) {
      console.log(`  FAIL  ${result.label}`)
      if (result.detail) console.log(`        ${result.detail}`)
    }
    process.exit(1)
  }
}

main().catch(err => {
  console.error('FATAL:', err.message)
  console.error(err.stack?.substring(0, 1000))
  process.exit(1)
})
