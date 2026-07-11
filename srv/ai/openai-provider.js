'use strict'

const API_BASE_URL = 'https://api.openai.com/v1'

class OpenAiProvider {
  constructor (config, fetchImpl = globalThis.fetch) {
    if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required for the OpenAI provider.')
    this.config = config
    this.fetch = fetchImpl
  }

  async chat ({ messages = [] } = {}) {
    const response = await this.#responses({ input: messages })
    return { text: responseText(response) }
  }

  async structured ({ schemaName = 'Suggestion', instruction = '', input = null } = {}) {
    const response = await this.#responses({
      instructions: instruction,
      input: JSON.stringify(input || {}),
      text: {
        format: {
          type: 'json_schema',
          name: safeSchemaName(schemaName),
          strict: false,
          schema: {
            type: 'object',
            additionalProperties: true
          }
        }
      }
    })
    const text = responseText(response)
    try {
      return { json: JSON.parse(text) }
    } catch {
      throw Object.assign(new Error('OpenAI returned malformed structured output.'), { code: 'OPENAI_MALFORMED_OUTPUT' })
    }
  }

  async embedding ({ text = '' } = {}) {
    if (!this.config.embeddingModelAlias) {
      throw Object.assign(new Error('OpenAI embedding model is not configured.'), { code: 'OPENAI_EMBEDDING_MODEL_MISSING' })
    }
    const response = await this.#request('/embeddings', {
      model: this.config.embeddingModelAlias,
      input: text
    })
    const embedding = response?.data?.[0]?.embedding
    if (!Array.isArray(embedding)) {
      throw Object.assign(new Error('OpenAI returned an invalid embedding response.'), { code: 'OPENAI_EMBEDDING_INVALID' })
    }
    return { embedding, dimensions: embedding.length }
  }

  #responses (payload) {
    return this.#request('/responses', {
      model: this.config.modelAlias,
      store: false,
      ...payload
    })
  }

  async #request (path, body) {
    const response = await this.fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      const error = Object.assign(new Error('OpenAI request failed.'), {
        code: `OPENAI_HTTP_${response.status}`,
        retryable: response.status === 429 || response.status >= 500
      })
      throw error
    }
    return payload
  }
}

function responseText (response) {
  if (typeof response?.output_text === 'string') return response.output_text
  for (const item of response?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === 'string') return content.text
    }
  }
  throw Object.assign(new Error('OpenAI response did not contain text output.'), { code: 'OPENAI_RESPONSE_TEXT_MISSING' })
}

function safeSchemaName (value) {
  return String(value || 'Suggestion').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'Suggestion'
}

module.exports = {
  API_BASE_URL,
  OpenAiProvider,
  responseText,
  safeSchemaName
}
