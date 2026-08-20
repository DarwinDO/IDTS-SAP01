'use strict'

function createClientCredentialsTokenProvider ({ credentials, fetchImpl = globalThis.fetch, timeoutMs = 10000, now = Date.now }) {
  if (typeof fetchImpl !== 'function') throw providerError('PROVIDER_UNAVAILABLE')
  if (!credentials || typeof credentials !== 'object') throw providerError('PROVIDER_UNAVAILABLE')
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60000) throw providerError('PROVIDER_UNAVAILABLE')

  let cachedToken = null
  let refreshAt = 0

  return Object.freeze({
    async getAccessToken () {
      if (cachedToken && now() < refreshAt) return cachedToken

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const form = new URLSearchParams({
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          grant_type: 'client_credentials',
          response_type: 'token'
        })
        const response = await fetchImpl(credentials.tokenUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: form.toString(),
          signal: controller.signal
        })
        if (!response?.ok) throw statusError(response?.status)
        const body = await response.json()
        if (!body || typeof body.access_token !== 'string' || body.access_token.length === 0 ||
            !Number.isFinite(body.expires_in) || body.expires_in <= 0) {
          throw providerError('PROVIDER_UNAVAILABLE')
        }
        cachedToken = body.access_token
        refreshAt = now() + Math.max(0, (body.expires_in - 30) * 1000)
        return cachedToken
      } catch (error) {
        if (typeof error?.code === 'string') throw error
        throw providerError('PROVIDER_UNAVAILABLE')
      } finally {
        clearTimeout(timer)
      }
    }
  })
}

function statusError (status) {
  if (status === 401 || status === 403) return providerError('PROVIDER_DENIED')
  if (status === 429) return providerError('PROVIDER_RATE_LIMITED')
  return providerError('PROVIDER_UNAVAILABLE')
}

function providerError (code) {
  return Object.assign(new Error('The access provider is unavailable.'), { code })
}

module.exports = { createClientCredentialsTokenProvider }
