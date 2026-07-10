'use strict'

const cds = require('@sap/cds')

const { getAiConfig } = require('./config')
const { MockAiProvider } = require('./mock-provider')
const { OpenAiProvider } = require('./openai-provider')
const {
  redactSensitiveText,
  safeFeatureType,
  sanitizeDiagnosticToken,
  sanitizeErrorSummary
} = require('./safety')

const LOG = cds.log('idts-ai')

function createAiProvider (config = getAiConfig()) {
  return new SafeAiProvider(config)
}

class SafeAiProvider {
  constructor (config) {
    this.config = config
    this.delegate = createDelegate(config)
  }

  chat (request = {}) {
    return this.#run('chat', request, () => this.delegate.chat(sanitizeChatRequest(request, this.config)))
  }

  structured (request = {}) {
    return this.#run('structured', request, () => this.delegate.structured(sanitizeStructuredRequest(request, this.config)))
  }

  embedding (request = {}) {
    return this.#run('embedding', request, () => this.delegate.embedding(sanitizeEmbeddingRequest(request, this.config)))
  }

  async #run (operation, request, execute) {
    const started = Date.now()
    const correlationId = request.correlationId || cds.utils.uuid()
    const featureType = safeFeatureType(request.featureType)

    if (!this.config.enabled) {
      return failureResult({
        operation,
        featureType,
        correlationId,
        durationMs: Date.now() - started,
        code: 'AI_DISABLED',
        summary: 'AI assistance is disabled.',
        retryable: false,
        config: this.config
      })
    }

    if (this.config.unsupported) {
      return failureResult({
        operation,
        featureType,
        correlationId,
        durationMs: Date.now() - started,
        code: 'AI_PROVIDER_UNSUPPORTED',
        summary: 'Configured AI provider is not supported by this IDTS build.',
        retryable: false,
        config: this.config
      })
    }

    if (!this.config.ready) {
      return failureResult({
        operation,
        featureType,
        correlationId,
        durationMs: Date.now() - started,
        code: 'AI_CONFIGURATION_INCOMPLETE',
        summary: 'AI assistance is not configured completely.',
        retryable: false,
        config: this.config
      })
    }

    try {
      const data = await withTimeout(execute(), this.config.timeoutMs)
      return successResult({
        operation,
        featureType,
        correlationId,
        durationMs: Date.now() - started,
        data,
        config: this.config
      })
    } catch (error) {
      const code = error?.code === 'AI_TIMEOUT' ? 'AI_TIMEOUT' : 'AI_PROVIDER_ERROR'
      LOG.warn('AI provider operation failed', {
        operation,
        featureType,
        correlationId,
        diagnostic: {
          name: sanitizeDiagnosticToken(error?.name, 'Error'),
          code: sanitizeDiagnosticToken(error?.code, code),
          retryable: Boolean(error?.retryable || code === 'AI_TIMEOUT')
        }
      })
      return failureResult({
        operation,
        featureType,
        correlationId,
        durationMs: Date.now() - started,
        code,
        summary: sanitizeErrorSummary(error),
        retryable: Boolean(error?.retryable || code === 'AI_TIMEOUT'),
        config: this.config
      })
    }
  }
}

function createDelegate (config) {
  if (config.enabled && config.provider === 'mock' && !config.unsupported) {
    return new MockAiProvider(config)
  }
  if (config.enabled && config.provider === 'openai' && !config.unsupported && config.ready) {
    return new OpenAiProvider(config)
  }
  return {
    chat: async () => null,
    structured: async () => null,
    embedding: async () => null
  }
}

function sanitizeChatRequest (request, config) {
  const messages = Array.isArray(request.messages) ? request.messages : []
  return {
    messages: messages.map(message => ({
      role: ['system', 'user', 'assistant'].includes(message?.role) ? message.role : 'user',
      content: redactSensitiveText(message?.content, config.maxInputChars)
    }))
  }
}

function sanitizeStructuredRequest (request, config) {
  return {
    schemaName: sanitizeDiagnosticToken(request.schemaName, 'Suggestion'),
    instruction: redactSensitiveText(request.instruction, config.maxInputChars),
    input: redactSensitiveObject(request.input, config.maxInputChars)
  }
}

function sanitizeEmbeddingRequest (request, config) {
  return {
    text: redactSensitiveText(request.text, config.maxInputChars)
  }
}

function redactSensitiveObject (value, maxLength) {
  if (value === undefined || value === null) return null
  if (typeof value === 'string') return redactSensitiveText(value, maxLength)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.slice(0, 50).map(item => redactSensitiveObject(item, maxLength))
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).slice(0, 50).map(([key, nested]) => [
        sanitizeDiagnosticToken(key, 'field'),
        redactSensitiveObject(nested, maxLength)
      ])
    )
  }
  return null
}

function successResult ({ operation, featureType, correlationId, durationMs, data, config }) {
  return Object.freeze({
    ok: true,
    status: 'SUCCESS',
    operation,
    featureType,
    correlationId,
    durationMs,
    providerAlias: config.provider,
    modelAlias: modelAliasFor(operation, config),
    data
  })
}

function failureResult ({ operation, featureType, correlationId, durationMs, code, summary, retryable, config }) {
  return Object.freeze({
    ok: false,
    status: code,
    operation,
    featureType,
    correlationId,
    durationMs,
    providerAlias: config.provider,
    modelAlias: modelAliasFor(operation, config),
    error: Object.freeze({
      code,
      summary,
      retryable: Boolean(retryable)
    })
  })
}

function modelAliasFor (operation, config) {
  return operation === 'embedding'
    ? (config.embeddingModelAlias || config.modelAlias || 'not-configured')
    : (config.modelAlias || 'not-configured')
}

function withTimeout (promise, timeoutMs) {
  let timeout
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      timeout = setTimeout(() => {
        reject(Object.assign(new Error('AI provider timed out.'), { code: 'AI_TIMEOUT', retryable: true }))
      }, timeoutMs)
    })
  ]).finally(() => clearTimeout(timeout))
}

module.exports = {
  SafeAiProvider,
  createAiProvider,
  sanitizeChatRequest,
  sanitizeEmbeddingRequest,
  sanitizeStructuredRequest
}
