'use strict'

const ALLOWED_METHODS = new Set(['GET', 'PATCH'])
const EXPECTED_API_SCOPES = new Set([
  'uaa.resource',
  'xs_authorization.read',
  'xs_authorization.write',
  'xs_idp.read',
  'xs_idp.write',
  'xs_user.read',
  'xs_user.write'
])

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
    async request ({ method, path, headers, body }) {
      const normalizedMethod = String(method || '').toUpperCase()
      if (!ALLOWED_METHODS.has(normalizedMethod) || !safeRelativePath(path)) throw providerError('PROVIDER_DENIED')
      if (normalizedMethod === 'GET' && body !== undefined) throw providerError('PROVIDER_DENIED')
      if (body !== undefined && (!body || typeof body !== 'object' || Array.isArray(body))) throw providerError('PROVIDER_DENIED')
      const normalizedHeaders = requestHeaders(normalizedMethod, headers)

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
            Authorization: `Bearer ${token}`,
            ...normalizedHeaders
          },
          signal: controller.signal
        }
        if (body !== undefined) {
          options.headers['Content-Type'] = 'application/json'
          options.body = JSON.stringify(body)
        }
        let response
        try {
          response = await fetchImpl(new URL(path, `${baseUrl}/`).toString(), options)
        } catch (error) {
          if (controller.signal.aborted || error?.name === 'AbortError') throw providerError('PROVIDER_TIMEOUT')
          if (typeof error?.code === 'string') throw error
          throw providerError('PROVIDER_NETWORK_FAILURE')
        }
        if (!response?.ok) throw await responseError(response)
        if (response.status === 204) return null
        try {
          return await response.json()
        } catch (error) {
          if (controller.signal.aborted || error?.name === 'AbortError') throw providerError('PROVIDER_TIMEOUT')
          throw providerError('PROVIDER_RESPONSE_INVALID')
        }
      } catch (error) {
        if (typeof error?.code === 'string') throw error
        throw providerError('PROVIDER_NETWORK_FAILURE')
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

async function responseError (response) {
  const status = response?.status
  if (status === 400) return providerError('PROVIDER_REQUEST_INVALID')
  if (status === 429) return providerError('PROVIDER_RATE_LIMITED')
  if (status === 404) return providerError('PROVIDER_RESOURCE_NOT_FOUND')
  if (status === 401) return providerError('PROVIDER_AUTHENTICATION_FAILED')
  if (status === 403) {
    return providerError(await reportsExpectedScope(response)
      ? 'PROVIDER_SCOPE_MISSING'
      : 'PROVIDER_FORBIDDEN')
  }
  if (status === 409 || status === 412) return providerError('PROVIDER_CONFLICT')
  if (Number.isInteger(status) && status >= 500 && status <= 599) return providerError('PROVIDER_UPSTREAM_5XX')
  return providerError('PROVIDER_RESPONSE_INVALID')
}

function requestHeaders (method, headers) {
  if (headers === undefined) return {}
  if (method !== 'PATCH' || !headers || typeof headers !== 'object' || Array.isArray(headers)) {
    throw providerError('PROVIDER_DENIED')
  }
  const keys = Object.keys(headers)
  if (keys.length !== 1 || keys[0] !== 'If-Match' ||
      typeof headers['If-Match'] !== 'string' ||
      !/^(0|[1-9][0-9]*)$/.test(headers['If-Match'])) {
    throw providerError('PROVIDER_DENIED')
  }
  return { 'If-Match': headers['If-Match'] }
}

async function reportsExpectedScope (response) {
  if (typeof response?.json !== 'function') return false
  try {
    const body = await response.json()
    return body && typeof body === 'object' && !Array.isArray(body) &&
      typeof body.scope === 'string' && EXPECTED_API_SCOPES.has(body.scope)
  } catch {
    return false
  }
}

function providerError (code) {
  return Object.assign(new Error('The access provider is unavailable.'), { code })
}

module.exports = { createSapAuthorizationApiClient }
