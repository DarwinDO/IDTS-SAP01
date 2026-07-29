'use strict'

// ponytail: native fetch/AbortController cover Gateway HTTP; add an SDK only if the REST contract becomes insufficient.
// Vercel AI Gateway is OpenAI-compatible. This adapter receives already-sanitized data from provider.js.
const API_BASE_URL = 'https://ai-gateway.vercel.sh/v1'

class VercelGatewayProvider {
  constructor (config, fetchImpl = globalThis.fetch) {
    if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required for the Vercel AI Gateway provider.')
    this.config = config
    this.fetch = fetchImpl
  }

  async chat ({ messages = [] } = {}) {
    return this.#withFallback(this.config.modelAlias, this.config.fallbackModelAlias, async model => {
      const response = await this.#chatCompletion(model, { messages })
      return { text: messageContent(response) }
    })
  }

  async structured ({ schemaName = 'Suggestion', instruction = '', input = null } = {}) {
    return this.#withFallback(this.config.modelAlias, this.config.fallbackModelAlias, async model => {
      const response = await this.#chatCompletion(model, {
        messages: [
          { role: 'system', content: instruction },
          { role: 'user', content: JSON.stringify(input || {}) }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: safeSchemaName(schemaName),
            strict: false,
            schema: { type: 'object', additionalProperties: true }
          }
        }
      })
      try {
        return { json: JSON.parse(messageContent(response)) }
      } catch {
        throw providerError('VERCEL_GATEWAY_MALFORMED_OUTPUT', { retryable: true, fallbackEligible: true })
      }
    })
  }

  async embedding ({ text = '' } = {}) {
    if (!this.config.embeddingModelAlias) {
      throw providerError('VERCEL_GATEWAY_EMBEDDING_MODEL_MISSING', { retryable: false, fallbackEligible: false })
    }
    return this.#withFallback(this.config.embeddingModelAlias, this.config.fallbackEmbeddingModelAlias, async model => {
      const response = await this.#request('/embeddings', { model, input: text })
      const embedding = response?.data?.[0]?.embedding
      if (!Array.isArray(embedding)) {
        throw providerError('VERCEL_GATEWAY_EMBEDDING_INVALID', { retryable: true, fallbackEligible: true })
      }
      return { embedding, dimensions: embedding.length }
    })
  }

  async #chatCompletion (model, request) {
    return this.#request('/chat/completions', {
      model,
      stream: false,
      ...request
    })
  }

  async #withFallback (primaryModel, fallbackModel, execute) {
    try {
      return providerResult(primaryModel, false, await execute(primaryModel))
    } catch (primaryError) {
      if (!this.config.fallbackEnabled || !fallbackModel || !isFallbackEligible(primaryError)) throw primaryError
      try {
        return providerResult(fallbackModel, true, await execute(fallbackModel))
      } catch (fallbackError) {
        fallbackError.fallbackAttempted = true
        throw fallbackError
      }
    }
  }

  async #request (path, body) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs)
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
      if (!response.ok) throw httpError(response.status, payload)
      return payload
    } catch (error) {
      if (error?.name === 'AbortError') throw providerError('AI_TIMEOUT', { retryable: true, fallbackEligible: true })
      if (error?.code?.startsWith('VERCEL_GATEWAY_') || error?.code === 'AI_TIMEOUT') throw error
      throw providerError('VERCEL_GATEWAY_NETWORK_ERROR', { retryable: true, fallbackEligible: true })
    } finally {
      clearTimeout(timer)
    }
  }
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

function httpError (status, payload) {
  const budgetExhausted = isBudgetExhausted(payload)
  const retryable = (status === 429 && !budgetExhausted) || status >= 500
  return providerError(`VERCEL_GATEWAY_HTTP_${status}`, {
    retryable,
    fallbackEligible: retryable && !budgetExhausted
  })
}

function providerError (code, { retryable, fallbackEligible }) {
  return Object.assign(new Error('Vercel AI Gateway request failed.'), {
    code,
    retryable: Boolean(retryable),
    fallbackEligible: Boolean(fallbackEligible)
  })
}

function isFallbackEligible (error) {
  return Boolean(error?.fallbackEligible && error?.retryable)
}

function isBudgetExhausted (payload) {
  // Inspect only to choose retry policy; never retain or log the provider body.
  return /budget|quota|balance|billing|spend limit/i.test(JSON.stringify(payload || {}))
}

function messageContent (response) {
  const content = response?.choices?.[0]?.message?.content
  if (typeof content === 'string' && content.trim()) return content
  throw providerError('VERCEL_GATEWAY_RESPONSE_TEXT_MISSING', { retryable: true, fallbackEligible: true })
}

function safeSchemaName (value) {
  return String(value || 'Suggestion').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'Suggestion'
}

module.exports = {
  API_BASE_URL,
  VercelGatewayProvider,
  httpError,
  isBudgetExhausted,
  isFallbackEligible,
  safeSchemaName
}
