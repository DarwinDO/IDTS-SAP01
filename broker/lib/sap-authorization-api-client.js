'use strict'

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PATCH', 'DELETE'])

function createSapAuthorizationApiClient ({
  apiUrl,
  tokenProvider,
  fetchImpl = globalThis.fetch,
  timeoutMs = 10000,
  minIntervalMs = 350
}) {
  const baseUrl = httpsBaseUrl(apiUrl)
  if (typeof tokenProvider?.getAccessToken !== 'function' || typeof fetchImpl !== 'function') throw providerError('PROVIDER_UNAVAILABLE')
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60000) throw providerError('PROVIDER_UNAVAILABLE')
  if (!Number.isInteger(minIntervalMs) || minIntervalMs < 0 || minIntervalMs > 5000) throw providerError('PROVIDER_UNAVAILABLE')
  let nextRequestAt = 0

  return Object.freeze({
    async request ({ method, path, body }) {
      const normalizedMethod = String(method || '').toUpperCase()
      if (!ALLOWED_METHODS.has(normalizedMethod) || !safeRelativePath(path)) throw providerError('PROVIDER_DENIED')
      if (normalizedMethod === 'GET' && body !== undefined) throw providerError('PROVIDER_DENIED')
      if (body !== undefined && (!body || typeof body !== 'object' || Array.isArray(body))) throw providerError('PROVIDER_DENIED')

      const token = await tokenProvider.getAccessToken()
      if (typeof token !== 'string' || token.length === 0) throw providerError('PROVIDER_UNAVAILABLE')
      const waitMs = Math.max(0, nextRequestAt - Date.now())
      if (waitMs > 0) await new Promise(resolve => setTimeout(resolve, waitMs))
      nextRequestAt = Date.now() + minIntervalMs
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const options = {
          method: normalizedMethod,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        }
        if (body !== undefined) {
          options.headers['Content-Type'] = 'application/json'
          options.body = JSON.stringify(body)
        }
        const response = await fetchImpl(new URL(path, `${baseUrl}/`).toString(), options)
        if (!response?.ok) throw statusError(response?.status)
        if (response.status === 204) return null
        return await response.json()
      } catch (error) {
        if (typeof error?.code === 'string') throw error
        throw providerError('PROVIDER_UNAVAILABLE')
      } finally {
        clearTimeout(timer)
      }
    }
  })
}

function safeRelativePath (value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') &&
    !value.includes('..') && !/[\r\n\\]/.test(value)
}

function httpsBaseUrl (value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('invalid')
    return url.toString().replace(/\/$/, '')
  } catch {
    throw providerError('PROVIDER_UNAVAILABLE')
  }
}

function statusError (status) {
  if (status === 429) return providerError('PROVIDER_RATE_LIMITED')
  if (status === 404) return providerError('PROVIDER_RESOURCE_NOT_FOUND')
  if (status === 401 || status === 403 || status === 409 || status === 412) return providerError('PROVIDER_DENIED')
  return providerError('PROVIDER_UNAVAILABLE')
}

function providerError (code) {
  return Object.assign(new Error('The access provider is unavailable.'), { code })
}

module.exports = { createSapAuthorizationApiClient }
