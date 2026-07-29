// Học nhanh (DonHV): provider seam. Feature gọi interface này để có mock/fallback; không gọi HTTP provider trực tiếp từ workflow handler.
'use strict'

const cds = require('@sap/cds')

const { getAiConfig } = require('./config')
const { MockAiProvider } = require('./mock-provider')
const { OpenAiProvider } = require('./openai-provider')
const { VercelGatewayProvider } = require('./vercel-gateway-provider')
const {
  redactSensitiveText,
  safeFeatureType,
  sanitizeDiagnosticToken,
  sanitizeErrorSummary
} = require('./safety')
const { emitAiOperationalMetric } = require('./metrics')

const LOG = cds.log('idts-ai')

function createAiProvider (config = getAiConfig(), dependencies = {}) {
  // Factory public luôn trả SafeAiProvider, để mọi feature dùng cùng timeout/redaction/fallback contract.
  return new SafeAiProvider(config, dependencies)
}

class SafeAiProvider {
  // Wrapper bảo vệ delegate thật/mock: sanitize input, giới hạn thời gian và chuyển mọi lỗi thành result an toàn.
  constructor (config, dependencies = {}) {
    this.config = config
    this.delegate = createDelegate(config, dependencies)
    this.metricsLogger = dependencies.metricsLogger
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
      return this.#complete(failureResult({
        operation,
        featureType,
        correlationId,
        durationMs: Date.now() - started,
        code: 'AI_DISABLED',
        summary: 'AI assistance is disabled.',
        retryable: false,
        config: this.config
      }))
    }

    if (this.config.unsupported) {
      return this.#complete(failureResult({
        operation,
        featureType,
        correlationId,
        durationMs: Date.now() - started,
        code: 'AI_PROVIDER_UNSUPPORTED',
        summary: 'Configured AI provider is not supported by this IDTS build.',
        retryable: false,
        config: this.config
      }))
    }

    if (!this.config.ready) {
      return this.#complete(failureResult({
        operation,
        featureType,
        correlationId,
        durationMs: Date.now() - started,
        code: 'AI_CONFIGURATION_INCOMPLETE',
        summary: 'AI assistance is not configured completely.',
        retryable: false,
        config: this.config
      }))
    }

    try {
      const delegateResult = await withTimeout(execute(), operationTimeoutMs(this.config))
      const normalized = normalizeDelegateResult(delegateResult)
      return this.#complete(successResult({
        operation,
        featureType,
        correlationId,
        durationMs: Date.now() - started,
        data: normalized.data,
        providerAlias: normalized.providerAlias,
        modelAlias: normalized.modelAlias,
        fallbackUsed: normalized.fallbackUsed,
        config: this.config
      }))
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
      return this.#complete(failureResult({
        operation,
        featureType,
        correlationId,
        durationMs: Date.now() - started,
        code,
        summary: sanitizeErrorSummary(error),
        retryable: Boolean(error?.retryable || code === 'AI_TIMEOUT'),
        config: this.config
      }))
    }
  }

  #complete (result) {
    emitAiOperationalMetric(result, this.metricsLogger)
    return result
  }
}

function createDelegate (config, dependencies = {}) {
  // Chọn OpenAI, mock hoặc disabled delegate theo config; feature code không phụ thuộc SDK cụ thể.
  if (config.enabled && config.provider === 'mock' && !config.unsupported) {
    return new MockAiProvider(config)
  }
  if (config.enabled && config.provider === 'openai' && !config.unsupported && config.ready) {
    return new OpenAiProvider(config, dependencies.fetchImpl)
  }
  if (config.enabled && config.provider === 'vercel' && !config.unsupported && config.ready) {
    return new VercelGatewayProvider(config, dependencies.fetchImpl)
  }
  return {
    chat: async () => null,
    structured: async () => null,
    embedding: async () => null
  }
}

function sanitizeChatRequest (request, config) {
  // Chỉ giữ messages/options allow-list, redact text và ép model alias/limit trước khi gọi provider.
  const messages = Array.isArray(request.messages) ? request.messages : []
  return {
    messages: messages.map(message => ({
      role: ['system', 'user', 'assistant'].includes(message?.role) ? message.role : 'user',
      content: redactSensitiveText(message?.content, config.maxInputChars)
    }))
  }
}

function sanitizeStructuredRequest (request, config) {
  // Chuẩn hóa request JSON-schema/structured output; schema name và payload đều bị giới hạn.
  return {
    schemaName: sanitizeDiagnosticToken(request.schemaName, 'Suggestion'),
    instruction: redactSensitiveText(request.instruction, config.maxInputChars),
    input: redactSensitiveObject(request.input, config.maxInputChars)
  }
}

function sanitizeEmbeddingRequest (request, config) {
  // Redact/cắt text embedding và giới hạn batch để không gửi dữ liệu ngoài scope.
  return {
    text: redactSensitiveText(request.text, config.maxInputChars)
  }
}

function redactSensitiveObject (value, maxLength) {
  // Duyệt object request có depth/size limit, dùng safety.js cho mọi string.
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

function successResult ({ operation, featureType, correlationId, durationMs, data, providerAlias, modelAlias, fallbackUsed, config }) {
  // Chuẩn hóa response thành envelope thành công có metadata an toàn; không expose raw SDK response.
  return Object.freeze({
    ok: true,
    status: 'SUCCESS',
    operation,
    featureType,
    correlationId,
    durationMs,
    providerAlias: providerAlias || config.provider,
    modelAlias: modelAlias || modelAliasFor(operation, config),
    fallbackUsed: Boolean(fallbackUsed),
    data
  })
}

function normalizeDelegateResult (value) {
  if (value?.__idtsProviderMeta === true) {
    return {
      data: value.data,
      providerAlias: value.providerAlias,
      modelAlias: value.modelAlias,
      fallbackUsed: value.fallbackUsed
    }
  }
  return { data: value, providerAlias: null, modelAlias: null, fallbackUsed: false }
}

function operationTimeoutMs (config) {
  return config.provider === 'vercel' && config.fallbackEnabled
    ? config.timeoutMs * 2 + 50
    : config.timeoutMs
}

function failureResult ({ operation, featureType, correlationId, durationMs, code, summary, retryable, config }) {
  // Chuẩn hóa timeout/provider error thành envelope thất bại để feature deterministic fallback.
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
  // Chọn alias model theo operation chat/structured/embedding cho audit, không trả model endpoint/key.
  return operation === 'embedding'
    ? (config.embeddingModelAlias || config.modelAlias || 'not-configured')
    : (config.modelAlias || 'not-configured')
}

function withTimeout (promise, timeoutMs) {
  // Race provider promise với timer; timeout reject được SafeAiProvider chuyển thành failure result.
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
  createDelegate,
  normalizeDelegateResult,
  operationTimeoutMs,
  sanitizeChatRequest,
  sanitizeEmbeddingRequest,
  sanitizeStructuredRequest
}
