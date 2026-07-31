'use strict'

// ponytail: native fetch/AbortController cover Gateway HTTP; add an SDK only if the REST contract becomes insufficient.
// Vercel AI Gateway is OpenAI-compatible. This adapter receives already-sanitized data from provider.js.
const API_BASE_URL = 'https://ai-gateway.vercel.sh/v1'
const DEFAULT_COOLDOWN_SECONDS = 60
const MIN_COOLDOWN_SECONDS = 1
const MAX_COOLDOWN_SECONDS = 900
const GLOBAL_MODEL_KEY = '*'
const gatewayCooldownUntilByModel = new Map()
const gatewayRequestTimesByModel = new Map()

class VercelGatewayProvider {
  constructor (config, fetchImpl = globalThis.fetch, now = Date.now) {
    if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required for the Vercel AI Gateway provider.')
    this.config = config
    this.fetch = fetchImpl
    this.now = now
  }

  async chat ({ messages = [] } = {}) {
    return this.#withFallback(this.config.modelAlias, this.config.fallbackModelAlias, async model => {
      const response = await this.#chatCompletion(model, { messages })
      return { text: messageContent(response) }
    })
  }

  async structured ({
    schemaName = 'Suggestion',
    schema: requestedSchema = null,
    instruction = '',
    input = null,
    deadlineMs = null,
    modelAlias = null,
    fallbackModelAlias = null,
    allowModelAccessFallback = false
  } = {}) {
    const primaryModel = modelAlias || this.config.modelAlias
    const backupModel = fallbackModelAlias || this.config.fallbackModelAlias
    const normalizedSchemaName = safeSchemaName(schemaName)
    const schema = requestedSchema && typeof requestedSchema === 'object' && !Array.isArray(requestedSchema)
      ? requestedSchema
      : { type: 'object', additionalProperties: true }
    const deadlineAt = Number.isFinite(Number(deadlineMs)) && Number(deadlineMs) > 0
      ? this.now() + Number(deadlineMs)
      : null
    return this.#withFallback(primaryModel, backupModel, async model => {
      const messages = [
        { role: 'system', content: instruction },
        { role: 'user', content: JSON.stringify(input || {}) }
      ]
      let response
      try {
        response = await this.#chatCompletion(model, {
          messages,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: normalizedSchemaName,
              strict: false,
              schema
            }
          }
        }, deadlineAt)
      } catch (error) {
        const canUseCompatibilityFormat =
          model === primaryModel &&
          error?.gatewayReason === 'response_format_incompatible'
        if (!canUseCompatibilityFormat) throw error

        // A controlled BTP smoke observed parseable JSON when the current Qwen
        // route omitted response_format. Retry only the primary model and only
        // after the specifically classified response-format HTTP 400.
        response = await this.#chatCompletion(model, {
          messages: [
            {
              role: 'system',
              content: [
                instruction,
                `Return one valid JSON object only for contract ${normalizedSchemaName}.`,
                'Do not use Markdown, code fences, comments, or text outside the JSON object.'
              ].filter(Boolean).join('\n\n')
            },
            messages[1]
          ]
        }, deadlineAt)
      }
      try {
        const parsed = JSON.parse(messageContent(response))
        return { json: unwrapSchemaEnvelope(parsed, normalizedSchemaName) }
      } catch {
        // Provider output that cannot satisfy the JSON contract is a content
        // failure, not an availability failure. Let the feature use its safe
        // deterministic result instead of spending a second-model request.
        throw providerError('VERCEL_GATEWAY_MALFORMED_OUTPUT', { retryable: false, fallbackEligible: false })
      }
    }, deadlineAt, { allowModelAccessFallback })
  }

  async embedding ({ text = '' } = {}) {
    if (!this.config.embeddingModelAlias) {
      throw providerError('VERCEL_GATEWAY_EMBEDDING_MODEL_MISSING', { retryable: false, fallbackEligible: false })
    }
    return this.#withFallback(this.config.embeddingModelAlias, this.config.fallbackEmbeddingModelAlias, async model => {
      const response = await this.#request('/embeddings', { model, input: text })
      const embedding = response?.data?.[0]?.embedding
      if (!Array.isArray(embedding)) {
        throw providerError('VERCEL_GATEWAY_EMBEDDING_INVALID', { retryable: false, fallbackEligible: false })
      }
      return { embedding, dimensions: embedding.length }
    })
  }

  async embeddingBatch ({ texts = [] } = {}) {
    if (!this.config.embeddingModelAlias) {
      throw providerError('VERCEL_GATEWAY_EMBEDDING_MODEL_MISSING', { retryable: false, fallbackEligible: false })
    }
    try {
      return await this.#withFallback(this.config.embeddingModelAlias, this.config.fallbackEmbeddingModelAlias, async model => {
        const response = await this.#request('/embeddings', { model, input: texts })
        return normalizeEmbeddingBatch(response, texts.length)
      })
    } catch (error) {
      if (error?.gatewayReason === 'embedding_batch_unsupported' && !error?.fallbackAttempted) {
        throw providerError('AI_EMBEDDING_BATCH_UNSUPPORTED', {
          retryable: false,
          fallbackEligible: false,
          gatewayReason: 'embedding_batch_unsupported'
        })
      }
      throw error
    }
  }

  async #chatCompletion (model, request, deadlineAt = null) {
    return this.#request('/chat/completions', {
      model,
      stream: false,
      ...request
    }, deadlineAt)
  }

  async #withFallback (primaryModel, fallbackModel, execute, deadlineAt = null, options = {}) {
    try {
      return providerResult(primaryModel, false, await execute(primaryModel))
    } catch (primaryError) {
      if (!this.config.fallbackEnabled || !fallbackModel || !isFallbackEligible(primaryError, options)) throw primaryError
      if (deadlineAt && deadlineAt <= this.now()) throw deadlineExceededError()
      try {
        return providerResult(fallbackModel, true, await execute(fallbackModel))
      } catch (fallbackError) {
        fallbackError.fallbackAttempted = true
        throw fallbackError
      }
    }
  }

  async #request (path, body, deadlineAt = null) {
    const modelAlias = body?.model || GLOBAL_MODEL_KEY
    const now = this.now()
    const cooldownSeconds = remainingCooldownSeconds(now, modelAlias)
    if (cooldownSeconds > 0) {
      throw providerError('AI_RATE_LIMITED', {
        retryable: true,
        fallbackEligible: false,
        gatewayReason: 'rate_limited',
        retryAfterSeconds: cooldownSeconds
      })
    }
    reserveModelRequest(modelAlias, this.config.requestLimit, this.config.requestWindowSeconds, now)
    const requestBudget = requestBudgetFor(deadlineAt, now, this.config.timeoutMs)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), requestBudget.timeoutMs)
    try {
      const response = await this.fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.gatewayApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const error = httpError(response.status, payload, response.headers?.get?.('Retry-After'))
        if (error.gatewayReason === 'rate_limited') activateGatewayCooldown(error.retryAfterSeconds, this.now(), modelAlias)
        throw error
      }
      return payload
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw providerError('AI_TIMEOUT', {
          retryable: true,
          fallbackEligible: !requestBudget.deadlineLimited
        })
      }
      if (error?.code?.startsWith('VERCEL_GATEWAY_') || error?.code === 'AI_TIMEOUT') throw error
      throw providerError('VERCEL_GATEWAY_NETWORK_ERROR', { retryable: true, fallbackEligible: true })
    } finally {
      clearTimeout(timer)
    }
  }
}

function requestBudgetFor (deadlineAt, now, providerTimeoutMs) {
  if (!deadlineAt) return { timeoutMs: providerTimeoutMs, deadlineLimited: false }
  const remainingMs = Math.ceil(deadlineAt - now)
  if (remainingMs <= 0) throw deadlineExceededError()
  return {
    timeoutMs: Math.max(1, Math.min(providerTimeoutMs, remainingMs)),
    deadlineLimited: true
  }
}

function deadlineExceededError () {
  return providerError('AI_TIMEOUT', { retryable: true, fallbackEligible: false })
}

function providerResult (modelAlias, fallbackUsed, data) {
  return {
    __idtsProviderMeta: true,
    providerAlias: 'vercel',
    modelAlias,
    fallbackUsed,
    data
  }
}

function httpError (status, payload, retryAfterValue = null) {
  const budgetExhausted = isBudgetExhausted(payload)
  const responseFormatIncompatible = status === 400 && isResponseFormatIncompatible(payload)
  const embeddingBatchUnsupported = status === 400 && isEmbeddingBatchUnsupported(payload)
  const modelAccessDenied = status === 403 && isModelAccessDenied(payload)
  const retryable = (status === 429 && !budgetExhausted) || status >= 500 || modelAccessDenied
  return providerError(`VERCEL_GATEWAY_HTTP_${status}`, {
    retryable,
    fallbackEligible: status >= 500 || modelAccessDenied,
    gatewayReason: responseFormatIncompatible
      ? 'response_format_incompatible'
      : (embeddingBatchUnsupported
          ? 'embedding_batch_unsupported'
          : (modelAccessDenied
              ? 'model_access_denied'
              : (budgetExhausted ? 'budget_exhausted' : (status === 429 ? 'rate_limited' : 'http_error')))),
    providerErrorCode: safeProviderErrorCode(payload),
    retryAfterSeconds: parseRetryAfterSeconds(retryAfterValue)
  })
}

function normalizeEmbeddingBatch (response, expectedCount) {
  const rows = Array.isArray(response?.data) ? response.data : null
  if (!rows || rows.length !== expectedCount || expectedCount < 1) {
    throw providerError('VERCEL_GATEWAY_EMBEDDING_BATCH_INVALID', { retryable: false, fallbackEligible: false })
  }

  const indexed = rows.every(row => Number.isInteger(row?.index))
  const ordered = indexed
    ? [...rows].sort((left, right) => left.index - right.index)
    : rows
  if (indexed && ordered.some((row, index) => row.index !== index)) {
    throw providerError('VERCEL_GATEWAY_EMBEDDING_BATCH_INVALID', { retryable: false, fallbackEligible: false })
  }

  const embeddings = ordered.map(row => row?.embedding)
  const dimensions = embeddings[0]?.length
  if (
    !Number.isInteger(dimensions) || dimensions < 2 ||
    embeddings.some(vector => !Array.isArray(vector) || vector.length !== dimensions || vector.some(value => !Number.isFinite(Number(value))))
  ) {
    throw providerError('VERCEL_GATEWAY_EMBEDDING_BATCH_INVALID', { retryable: false, fallbackEligible: false })
  }
  return { embeddings: embeddings.map(vector => vector.map(Number)), dimensions }
}

function activateGatewayCooldown (retryAfterSeconds, now = Date.now(), modelAlias = GLOBAL_MODEL_KEY) {
  const hasRetryAfter = retryAfterSeconds !== null && retryAfterSeconds !== undefined && retryAfterSeconds !== ''
  const seconds = Math.min(
    Math.max(hasRetryAfter && Number.isFinite(Number(retryAfterSeconds)) ? Math.ceil(Number(retryAfterSeconds)) : DEFAULT_COOLDOWN_SECONDS, MIN_COOLDOWN_SECONDS),
    MAX_COOLDOWN_SECONDS
  )
  const key = modelAlias || GLOBAL_MODEL_KEY
  gatewayCooldownUntilByModel.set(
    key,
    Math.max(gatewayCooldownUntilByModel.get(key) || 0, now + seconds * 1000)
  )
}

function remainingCooldownSeconds (now = Date.now(), modelAlias = GLOBAL_MODEL_KEY) {
  const modelCooldown = gatewayCooldownUntilByModel.get(modelAlias || GLOBAL_MODEL_KEY) || 0
  const globalCooldown = gatewayCooldownUntilByModel.get(GLOBAL_MODEL_KEY) || 0
  return Math.max(Math.ceil((Math.max(modelCooldown, globalCooldown) - now) / 1000), 0)
}

function resetGatewayCooldownForTest () {
  gatewayCooldownUntilByModel.clear()
  gatewayRequestTimesByModel.clear()
}

function reserveModelRequest (modelAlias, requestLimit, requestWindowSeconds, now = Date.now()) {
  const limit = Number(requestLimit)
  if (!Number.isInteger(limit) || limit <= 0) return

  const windowSeconds = Number(requestWindowSeconds)
  const windowMs = (Number.isFinite(windowSeconds) && windowSeconds > 0 ? windowSeconds : DEFAULT_COOLDOWN_SECONDS) * 1000
  const key = modelAlias || GLOBAL_MODEL_KEY
  const recent = (gatewayRequestTimesByModel.get(key) || []).filter(timestamp => timestamp > now - windowMs)
  if (recent.length >= limit) {
    const retryAfterSeconds = Math.max(Math.ceil((recent[0] + windowMs - now) / 1000), MIN_COOLDOWN_SECONDS)
    activateGatewayCooldown(retryAfterSeconds, now, key)
    throw providerError('AI_RATE_LIMITED', {
      retryable: true,
      fallbackEligible: false,
      gatewayReason: 'rate_limited',
      retryAfterSeconds
    })
  }
  recent.push(now)
  gatewayRequestTimesByModel.set(key, recent)
}

function providerError (code, {
  retryable,
  fallbackEligible,
  gatewayReason = null,
  providerErrorCode = null,
  retryAfterSeconds = null
}) {
  return Object.assign(new Error('Vercel AI Gateway request failed.'), {
    code,
    retryable: Boolean(retryable),
    fallbackEligible: Boolean(fallbackEligible),
    gatewayReason,
    providerErrorCode,
    retryAfterSeconds
  })
}

function isFallbackEligible (error, { allowModelAccessFallback = false } = {}) {
  if (error?.gatewayReason === 'model_access_denied') {
    return Boolean(allowModelAccessFallback && error?.fallbackEligible && error?.retryable)
  }
  return Boolean(error?.fallbackEligible && error?.retryable)
}

function isModelAccessDenied (payload) {
  // Generic `access_denied` can indicate a key/team/account restriction and
  // must stay visible. Vercel uses `no_providers_available` when the selected
  // model has no eligible upstream route; that specific condition may spend
  // one bounded structured fallback request.
  return [
    'model_access_denied',
    'model_not_allowed',
    'provider_model_access_denied',
    'no_providers_available'
  ].includes(safeProviderErrorCode(payload))
}

function isBudgetExhausted (payload) {
  // Inspect only to choose retry policy; never retain or log the provider body.
  return /budget|quota|balance|billing|spend limit/i.test(JSON.stringify(payload || {}))
}

function isResponseFormatIncompatible (payload) {
  // Inspect only to choose one documented compatibility retry. The raw
  // provider message is discarded and never attached to the thrown error.
  const code = safeProviderErrorCode(payload)
  if ([
    'unsupported_response_format',
    'response_format_unsupported',
    'invalid_response_format'
  ].includes(code)) return true

  const message = String(payload?.error?.message || '')
  return /response[_ -]?format|json[_ -]?schema/i.test(message) &&
    /unsupported|not support|incompatible|invalid/i.test(message)
}

function safeProviderErrorCode (payload) {
  const value = payload?.error?.code || payload?.error?.type
  const normalized = String(value || '').trim().toLowerCase()
  return /^[a-z0-9_.-]{1,64}$/.test(normalized) ? normalized : null
}

function parseRetryAfterSeconds (value) {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric >= 0) return Math.min(Math.ceil(numeric), 86400)

  const retryAt = Date.parse(String(value))
  if (!Number.isFinite(retryAt)) return null
  return Math.min(Math.max(Math.ceil((retryAt - Date.now()) / 1000), 0), 86400)
}

function messageContent (response) {
  const content = response?.choices?.[0]?.message?.content
  if (typeof content === 'string' && content.trim()) return content
  throw providerError('VERCEL_GATEWAY_RESPONSE_TEXT_MISSING', { retryable: false, fallbackEligible: false })
}

function isEmbeddingBatchUnsupported (payload) {
  // Chỉ mở compatibility path khi Gateway nói rõ array/batch input không
  // được hỗ trợ. Generic HTTP 400 phải dừng, không biến thành 11 request mới.
  const code = safeProviderErrorCode(payload)
  if (['batch_not_supported', 'unsupported_batch', 'unsupported_input_array'].includes(code)) return true

  const message = String(payload?.error?.message || '')
  return /(array|batch).{0,48}(unsupported|not supported|not accept|invalid)|(?:unsupported|not supported).{0,48}(array|batch)/i.test(message)
}

function safeSchemaName (value) {
  return String(value || 'Suggestion').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'Suggestion'
}

function unwrapSchemaEnvelope (json, schemaName) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return json

  const key = safeSchemaName(schemaName)
  const keys = Object.keys(json)
  const wrapped = json[key]
  if (
    keys.length === 1 &&
    Object.prototype.hasOwnProperty.call(json, key) &&
    wrapped &&
    typeof wrapped === 'object' &&
    !Array.isArray(wrapped)
  ) return wrapped

  return json
}

module.exports = {
  API_BASE_URL,
  VercelGatewayProvider,
  activateGatewayCooldown,
  httpError,
  isBudgetExhausted,
  isEmbeddingBatchUnsupported,
  isFallbackEligible,
  isModelAccessDenied,
  isResponseFormatIncompatible,
  parseRetryAfterSeconds,
  reserveModelRequest,
  remainingCooldownSeconds,
  resetGatewayCooldownForTest,
  safeProviderErrorCode,
  safeSchemaName,
  unwrapSchemaEnvelope
}
