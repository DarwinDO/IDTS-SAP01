'use strict'

const SERVICE_PATH = '/internal/user-access-provisioning'

function createProvisioningCapClient ({ baseUrl, tokenProvider, fetchImpl = globalThis.fetch, timeoutMs = 10000 }) {
  const serviceUrl = httpsBaseUrl(baseUrl)
  if (typeof tokenProvider?.getAccessToken !== 'function' || typeof fetchImpl !== 'function') throw capError()
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60000) throw capError()

  return Object.freeze({
    claimNextAccessOperation: () => callAction('claimNextAccessOperation', {}),
    completeAccessOperation: payload => callAction('completeAccessOperation', completionPayload(payload))
  })

  async function callAction (action, body) {
    const token = await tokenProvider.getAccessToken()
    if (typeof token !== 'string' || token.length === 0) throw capError()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetchImpl(new URL(`${SERVICE_PATH}/${action}`, `${serviceUrl}/`).toString(), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })
      if (!response?.ok) throw capError()
      if (response.status === 204) return null
      const result = await response.json()
      const value = Object.prototype.hasOwnProperty.call(result || {}, 'value') ? result.value : result
      if (value === null && action === 'claimNextAccessOperation') return null
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw capError()
      return value
    } catch (error) {
      if (error?.code === 'CAP_CLIENT_UNAVAILABLE') throw error
      throw capError()
    } finally {
      clearTimeout(timer)
    }
  }
}

function completionPayload (payload) {
  if (!payload || typeof payload !== 'object') throw capError()
  return {
    operationID: payload.operationID,
    leaseToken: payload.leaseToken,
    resultCode: payload.resultCode,
    safeCode: payload.safeCode,
    providerCorrelationHash: payload.providerCorrelationHash || null
  }
}

function httpsBaseUrl (value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('invalid')
    return url.toString().replace(/\/$/, '')
  } catch {
    throw capError()
  }
}

function capError () {
  return Object.assign(new Error('The provisioning CAP service is unavailable.'), { code: 'CAP_CLIENT_UNAVAILABLE' })
}

module.exports = { createProvisioningCapClient }
