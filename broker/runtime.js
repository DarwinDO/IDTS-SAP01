'use strict'

const { processOneAccessOperation } = require('./worker')
const { loadApiAccessBinding, loadBrokerXsuaaBinding } = require('./lib/service-bindings')
const { createClientCredentialsTokenProvider } = require('./lib/oauth-client')
const { createProvisioningCapClient } = require('./lib/cap-client')
const { createSapAuthorizationProviderFactory } = require('./lib/sap-authorization-provider')
const { createSapAuthorizationApiClient } = require('./lib/sap-authorization-api-client')
const { createSapUserManagementContract } = require('./lib/sap-user-management-contract')

function createBrokerRuntime ({
  env = process.env,
  vcapServices = process.env.VCAP_SERVICES,
  fetchImpl = globalThis.fetch,
  mutationContract = createSapUserManagementContract()
}) {
  if (env.IDTS_ACCESS_BROKER_ENABLED !== 'true') {
    return Object.freeze({
      enabled: false,
      runOnce: async () => ({ processed: false, status: 'DISABLED' })
    })
  }

  const apiCredentials = loadApiAccessBinding(vcapServices)
  const brokerAuthCredentials = loadBrokerXsuaaBinding(vcapServices)
  const brokerTokenProvider = createClientCredentialsTokenProvider({ credentials: brokerAuthCredentials, fetchImpl })
  const capClient = createProvisioningCapClient({
    baseUrl: env.IDTS_BROKER_CAP_URL,
    tokenProvider: brokerTokenProvider,
    fetchImpl
  })
  const providerFactory = createSapAuthorizationProviderFactory({
    enabled: true,
    mutationContract,
    apiClient: createSapAuthorizationApiClient({
      apiUrl: apiCredentials.apiUrl,
      tokenProvider: createClientCredentialsTokenProvider({ credentials: apiCredentials, fetchImpl }),
      fetchImpl
    })
  })

  return Object.freeze({
    enabled: true,
    runOnce: () => processOneAccessOperation({ capClient, providerFactory })
  })
}

module.exports = { createBrokerRuntime }
