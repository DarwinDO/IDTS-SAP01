'use strict'

const crypto = require('crypto')

class MockAiProvider {
  constructor (config) {
    this.config = config
  }

  async chat ({ messages = [] } = {}) {
    await this.#maybeFail()
    const latestUserText = latestUserMessage(messages)
    return {
      text: this.config.mockResponseText || `Mock AI response for: ${latestUserText || 'empty request'}`
    }
  }

  async structured ({ schemaName = 'Suggestion' } = {}) {
    await this.#maybeFail()
    return {
      json: {
        ...this.config.mockStructuredOutput,
        schemaName
      }
    }
  }

  async embedding ({ text = '' } = {}) {
    await this.#maybeFail()
    return {
      embedding: deterministicEmbedding(text, this.config.mockEmbeddingDimensions),
      dimensions: this.config.mockEmbeddingDimensions
    }
  }

  async #maybeFail () {
    if (this.config.mockMode === 'error') {
      throw Object.assign(
        new Error('Mock provider failed with SELECT passwordHash from idts.cap.Users and token=xkeysib-secret-value'),
        { code: 'MOCK_PROVIDER_ERROR', retryable: true }
      )
    }
    if (this.config.mockMode === 'timeout') {
      await new Promise(resolve => setTimeout(resolve, this.config.timeoutMs + 25))
    }
  }
}

function latestUserMessage (messages) {
  const message = [...messages].reverse().find(entry => entry?.role === 'user')
  return typeof message?.content === 'string' ? message.content.slice(0, 120) : ''
}

function deterministicEmbedding (text, dimensions) {
  const hash = crypto.createHash('sha256').update(String(text)).digest()
  const values = []
  for (let i = 0; i < dimensions; i++) {
    values.push(Number(((hash[i] / 255) * 2 - 1).toFixed(6)))
  }
  return values
}

module.exports = {
  MockAiProvider,
  deterministicEmbedding
}
