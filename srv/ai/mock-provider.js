// Học nhanh (DonHV): provider deterministic cho local/QA. Nó giúp test AI flow mà không cần key, network hoặc kết quả ngẫu nhiên.
'use strict'

const crypto = require('crypto')

class MockAiProvider {
  // Provider deterministic cho test/local: trả success/failure/no-result theo config mà không gọi mạng hay cần API key.
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
  // Lấy message user cuối làm input fixture; bỏ system content khỏi deterministic output.
  const message = [...messages].reverse().find(entry => entry?.role === 'user')
  return typeof message?.content === 'string' ? message.content.slice(0, 120) : ''
}

function deterministicEmbedding (text, dimensions) {
  // Hash token text thành vector lặp lại được để test ranking; không đại diện chất lượng embedding thật.
  const hash = crypto.createHash('sha256').update(String(text)).digest()
  const values = []
  for (let i = 0; i < dimensions; i++) {
    values.push(Number(((hash[i % hash.length] / 255) * 2 - 1).toFixed(6)))
  }
  return values
}

module.exports = {
  MockAiProvider,
  deterministicEmbedding
}
