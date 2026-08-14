'use strict'

const API_ACCESS_SERVICE = 'idts-user-access-broker-api-access'
const BROKER_AUTH_SERVICE = 'idts-user-access-broker-auth'

function loadApiAccessBinding (rawBindings) {
  const credentials = exactBinding(rawBindings, API_ACCESS_SERVICE, 'API_ACCESS_BINDING')
  return Object.freeze({
    apiUrl: requiredHttpsUrl(credentials.apiUrl, 'API_ACCESS_BINDING_INVALID'),
    tokenUrl: requiredHttpsUrl(credentials.tokenUrl, 'API_ACCESS_BINDING_INVALID'),
    clientId: requiredSecret(credentials.clientId, 'API_ACCESS_BINDING_INVALID'),
    clientSecret: requiredSecret(credentials.clientSecret, 'API_ACCESS_BINDING_INVALID')
  })
}

function loadBrokerXsuaaBinding (rawBindings) {
  const credentials = exactBinding(rawBindings, BROKER_AUTH_SERVICE, 'BROKER_AUTH_BINDING')
  const authBaseUrl = requiredHttpsUrl(credentials.url, 'BROKER_AUTH_BINDING_INVALID')
  return Object.freeze({
    tokenUrl: new URL('/oauth/token', `${authBaseUrl}/`).toString(),
    clientId: requiredSecret(credentials.clientid, 'BROKER_AUTH_BINDING_INVALID'),
    clientSecret: requiredSecret(credentials.clientsecret, 'BROKER_AUTH_BINDING_INVALID')
  })
}

function exactBinding (rawBindings, serviceName, codePrefix) {
  const services = parseBindings(rawBindings)
  const matches = Object.values(services)
    .flatMap(value => Array.isArray(value) ? value : [])
    .filter(binding => binding && (binding.name === serviceName || binding.instance_name === serviceName))
  if (matches.length === 0) throw bindingError(`${codePrefix}_MISSING`)
  if (matches.length !== 1) throw bindingError(`${codePrefix}_AMBIGUOUS`)
  if (!matches[0].credentials || typeof matches[0].credentials !== 'object' || Array.isArray(matches[0].credentials)) {
    throw bindingError(`${codePrefix}_INVALID`)
  }
  return matches[0].credentials
}

function parseBindings (rawBindings) {
  try {
    const parsed = typeof rawBindings === 'string' ? JSON.parse(rawBindings) : rawBindings
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid')
    return parsed
  } catch {
    throw bindingError('SERVICE_BINDINGS_INVALID')
  }
}

function requiredHttpsUrl (value, code) {
  try {
    const url = new URL(requiredSecret(value, code))
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('invalid')
    return url.toString().replace(/\/$/, '')
  } catch {
    throw bindingError(code)
  }
}

function requiredSecret (value, code) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 4096) throw bindingError(code)
  return value
}

function bindingError (code) {
  return Object.assign(new Error('Required broker service binding is unavailable.'), { code })
}

module.exports = {
  API_ACCESS_SERVICE,
  BROKER_AUTH_SERVICE,
  loadApiAccessBinding,
  loadBrokerXsuaaBinding
}
