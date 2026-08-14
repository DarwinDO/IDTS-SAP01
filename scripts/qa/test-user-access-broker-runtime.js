'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const YAML = require('yaml')

const {
  loadApiAccessBinding,
  loadBrokerXsuaaBinding
} = require('../../broker/lib/service-bindings')
const { createClientCredentialsTokenProvider } = require('../../broker/lib/oauth-client')
const { createProvisioningCapClient } = require('../../broker/lib/cap-client')
const { createSapAuthorizationProviderFactory } = require('../../broker/lib/sap-authorization-provider')
const { createSapAuthorizationApiClient } = require('../../broker/lib/sap-authorization-api-client')
const {
  CONTRACT_ID,
  OPENAPI_SHA256,
  createSapUserManagementContract
} = require('../../broker/lib/sap-user-management-contract')
const { createBrokerRuntime } = require('../../broker/runtime')
const { createBrokerServer } = require('../../broker/server')

function controlledVcap () {
  return JSON.stringify({
    'user-provided': [{
      name: 'idts-user-access-broker-api-access',
      credentials: {
        apiUrl: 'https://api.example.invalid',
        tokenUrl: 'https://token.example.invalid/oauth/token',
        clientId: 'controlled-api-client',
        clientSecret: 'controlled-api-secret'
      }
    }],
    xsuaa: [{
      name: 'idts-user-access-broker-auth',
      credentials: {
        url: 'https://broker-auth.example.invalid',
        clientid: 'controlled-broker-client',
        clientsecret: 'controlled-broker-secret'
      }
    }]
  })
}

async function main () {
  const api = loadApiAccessBinding(controlledVcap())
  assert.deepEqual(api, {
    apiUrl: 'https://api.example.invalid',
    tokenUrl: 'https://token.example.invalid/oauth/token',
    clientId: 'controlled-api-client',
    clientSecret: 'controlled-api-secret'
  })

  const brokerAuth = loadBrokerXsuaaBinding(controlledVcap())
  assert.deepEqual(brokerAuth, {
    tokenUrl: 'https://broker-auth.example.invalid/oauth/token',
    clientId: 'controlled-broker-client',
    clientSecret: 'controlled-broker-secret'
  })

  assert.throws(
    () => loadApiAccessBinding('{}'),
    error => error?.code === 'API_ACCESS_BINDING_MISSING'
  )
  assert.throws(
    () => loadApiAccessBinding('{bad json'),
    error => error?.code === 'SERVICE_BINDINGS_INVALID'
  )

  const duplicate = JSON.parse(controlledVcap())
  duplicate['user-provided'].push(duplicate['user-provided'][0])
  assert.throws(
    () => loadApiAccessBinding(JSON.stringify(duplicate)),
    error => error?.code === 'API_ACCESS_BINDING_AMBIGUOUS'
  )

  const insecure = JSON.parse(controlledVcap())
  insecure['user-provided'][0].credentials.apiUrl = 'http://api.example.invalid'
  assert.throws(
    () => loadApiAccessBinding(JSON.stringify(insecure)),
    error => error?.code === 'API_ACCESS_BINDING_INVALID'
  )

  let tokenCalls = 0
  const tokenProvider = createClientCredentialsTokenProvider({
    credentials: api,
    timeoutMs: 1000,
    fetchImpl: async (url, options) => {
      tokenCalls += 1
      assert.equal(url, 'https://token.example.invalid/oauth/token')
      assert.equal(options.method, 'POST')
      assert.equal(options.headers.Accept, 'application/json')
      assert.equal(options.headers['Content-Type'], 'application/x-www-form-urlencoded')
      assert.ok(options.signal)
      const form = new URLSearchParams(options.body)
      assert.equal(form.get('client_id'), 'controlled-api-client')
      assert.equal(form.get('client_secret'), 'controlled-api-secret')
      assert.equal(form.get('grant_type'), 'client_credentials')
      assert.equal(form.get('response_type'), 'token')
      return {
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'controlled-access-token', expires_in: 120 })
      }
    }
  })
  assert.equal(await tokenProvider.getAccessToken(), 'controlled-access-token')
  assert.equal(await tokenProvider.getAccessToken(), 'controlled-access-token')
  assert.equal(tokenCalls, 1, 'a valid token must be cached in memory until near expiry')

  const rateLimited = createClientCredentialsTokenProvider({
    credentials: api,
    fetchImpl: async () => ({
      ok: false,
      status: 429,
      text: async () => 'private provider detail token=must-not-leak'
    })
  })
  await assert.rejects(
    rateLimited.getAccessToken(),
    error => error?.code === 'PROVIDER_RATE_LIMITED' && !error.message.includes('private provider detail')
  )

  const malformed = createClientCredentialsTokenProvider({
    credentials: api,
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ access_token: '' }) })
  })
  await assert.rejects(
    malformed.getAccessToken(),
    error => error?.code === 'PROVIDER_UNAVAILABLE'
  )

  const capRequests = []
  const capClient = createProvisioningCapClient({
    baseUrl: 'https://cap.example.invalid',
    tokenProvider: { getAccessToken: async () => 'controlled-broker-token' },
    fetchImpl: async (url, options) => {
      capRequests.push({ url, options })
      assert.equal(options.method, 'POST')
      assert.equal(options.headers.Authorization, 'Bearer controlled-broker-token')
      assert.equal(options.headers['Content-Type'], 'application/json')
      if (url.endsWith('/claimNextAccessOperation')) {
        assert.equal(options.body, '{}')
        return {
          ok: true,
          status: 200,
          json: async () => ({
            operationID: '11111111-1111-4111-8111-111111111111',
            operationType: 'PROVISION',
            leaseToken: 'a'.repeat(64)
          })
        }
      }
      const payload = JSON.parse(options.body)
      assert.deepEqual(payload, {
        operationID: '11111111-1111-4111-8111-111111111111',
        leaseToken: 'a'.repeat(64),
        resultCode: 'APPLIED',
        safeCode: 'ROLE_COLLECTIONS_VERIFIED',
        providerCorrelationHash: null
      })
      return { ok: true, status: 200, json: async () => ({ operationID: payload.operationID, status: 'ACTIVE' }) }
    }
  })
  const claimed = await capClient.claimNextAccessOperation()
  assert.equal(claimed.operationType, 'PROVISION')
  const completed = await capClient.completeAccessOperation({
    operationID: claimed.operationID,
    leaseToken: claimed.leaseToken,
    resultCode: 'APPLIED',
    safeCode: 'ROLE_COLLECTIONS_VERIFIED',
    providerCorrelationHash: null,
    rawProviderBody: 'must-not-forward'
  })
  assert.deepEqual(completed, { operationID: claimed.operationID, status: 'ACTIVE' })
  assert.equal(capRequests.length, 2)

  const unavailableCap = createProvisioningCapClient({
    baseUrl: 'https://cap.example.invalid',
    tokenProvider: { getAccessToken: async () => 'controlled-broker-token' },
    fetchImpl: async () => ({ ok: false, status: 503, text: async () => 'private CAP response' })
  })
  await assert.rejects(
    unavailableCap.claimNextAccessOperation(),
    error => error?.code === 'CAP_CLIENT_UNAVAILABLE' && !error.message.includes('private CAP response')
  )

  const disabledProvider = createSapAuthorizationProviderFactory({ enabled: false })
  assert.throws(
    () => disabledProvider.forIdentity({}),
    error => error?.code === 'PROVIDER_DISABLED'
  )
  assert.throws(
    () => createSapAuthorizationProviderFactory({ enabled: true, mutationContract: null }),
    error => error?.code === 'PROVIDER_CONTRACT_UNVERIFIED'
  )

  const repositoryRoot = path.join(__dirname, '../..')
  const mta = YAML.parse(fs.readFileSync(path.join(repositoryRoot, 'mta.yaml'), 'utf8'))
  const brokerModule = mta.modules.find(module => module.name === 'idts-user-access-broker')
  assert.ok(brokerModule, 'the separate broker module must be declared')
  assert.equal(brokerModule.path, 'broker')
  assert.equal(brokerModule.parameters['no-route'], true)
  assert.equal(brokerModule.properties.IDTS_ACCESS_BROKER_ENABLED, false)
  assert.deepEqual(brokerModule.requires.map(requirement => requirement.name).sort(), [
    'idts-user-access-broker-api-access',
    'idts-user-access-broker-auth',
    'srv-api'
  ])
  const mainSrv = mta.modules.find(module => module.name === 'idts-sap01-srv')
  const mainAppRouter = mta.modules.find(module => module.name === 'idts-sap01-approuter')
  for (const module of [mainSrv, mainAppRouter]) {
    const names = (module.requires || []).map(requirement => requirement.name)
    assert.equal(names.includes('idts-user-access-broker-api-access'), false)
    assert.equal(names.includes('idts-user-access-broker-auth'), false)
  }
  const apiAccessResource = mta.resources.find(resource => resource.name === 'idts-user-access-broker-api-access')
  assert.equal(apiAccessResource.type, 'org.cloudfoundry.existing-service')
  assert.equal(apiAccessResource.parameters['service-name'], 'idts-user-access-broker-api-access')
  const brokerAuthResource = mta.resources.find(resource => resource.name === 'idts-user-access-broker-auth')
  assert.equal(brokerAuthResource.parameters.service, 'xsuaa')
  assert.equal(brokerAuthResource.parameters.config.xsappname, 'idts-user-access-broker')
  assert.deepEqual(brokerAuthResource.parameters.config.authorities, [
    'idts-sap01-${org}-${space}.ProvisioningBroker'
  ])

  const security = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'xs-security.json'), 'utf8'))
  const technicalScope = security.scopes.find(scope => scope.name === '$XSAPPNAME.ProvisioningBroker')
  assert.deepEqual(technicalScope['grant-as-authority-to-apps'], [
    '$XSAPPNAME(application,idts-user-access-broker)'
  ])
  assert.equal(security['role-templates'].some(template => template.name === 'ProvisioningBroker'), false)

  const brokerPackage = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'broker/package.json'), 'utf8'))
  assert.deepEqual(brokerPackage.scripts, { start: 'node server.js' })
  assert.deepEqual(brokerPackage.dependencies || {}, {})

  const sourceOnlyMta = YAML.parse(fs.readFileSync(
    path.join(repositoryRoot, 'mta.user-access-broker-source-only.yaml'),
    'utf8'
  ))
  assert.match(sourceOnlyMta.description, /SOURCE-ONLY \/ NOT DEPLOYMENT-AUTHORIZED/)
  assert.equal(sourceOnlyMta.modules.length, 1)
  assert.deepEqual(sourceOnlyMta.resources || [], [])
  const sourceOnlyBroker = sourceOnlyMta.modules[0]
  assert.equal(sourceOnlyBroker.name, 'idts-user-access-broker-source-candidate')
  assert.equal(sourceOnlyBroker.path, 'broker')
  assert.equal(sourceOnlyBroker.type, 'nodejs')
  assert.equal(sourceOnlyBroker.parameters['no-route'], true)
  assert.equal(sourceOnlyBroker.parameters.instances, 1)
  assert.deepEqual(sourceOnlyBroker.requires || [], [])
  assert.deepEqual(sourceOnlyBroker.provides || [], [])
  assert.deepEqual(sourceOnlyBroker.properties, {
    IDTS_ACCESS_BROKER_ENABLED: false
  })

  const contractCalls = []
  const providerFactory = createSapAuthorizationProviderFactory({
    enabled: true,
    mutationContract: {
      contractId: CONTRACT_ID,
      listRoleCollections: async identity => { contractCalls.push(['LIST', identity]); return ['NON_IDTS_EXISTING'] },
      assignRoleCollection: async (identity, roleCollection) => { contractCalls.push(['ASSIGN', identity, roleCollection]) },
      unassignRoleCollection: async (identity, roleCollection) => { contractCalls.push(['UNASSIGN', identity, roleCollection]) }
    }
  })
  const controlledIdentity = {
    origin: 'sap.default',
    issuer: 'https://issuer.example.invalid',
    email: 'controlled@example.invalid',
    subject: 'stable-user-uuid',
    platformUserId: '11111111-1111-4111-8111-111111111111'
  }
  const sapProvider = providerFactory.forIdentity(controlledIdentity)
  assert.deepEqual(await sapProvider.listRoleCollections(), ['NON_IDTS_EXISTING'])
  await sapProvider.assignRoleCollection('IDTS_TESTER')
  await sapProvider.unassignRoleCollection('IDTS_TESTER')
  await assert.rejects(
    sapProvider.assignRoleCollection('Subaccount Administrator'),
    error => error?.code === 'PROVIDER_DENIED'
  )
  assert.equal(contractCalls.length, 3)
  assert.deepEqual(contractCalls[0][1], controlledIdentity)

  const authorizationRequests = []
  const authorizationClient = createSapAuthorizationApiClient({
    apiUrl: api.apiUrl,
    minIntervalMs: 0,
    tokenProvider: { getAccessToken: async () => 'controlled-api-token' },
    fetchImpl: async (url, options) => {
      authorizationRequests.push({ url, options })
      assert.equal(url, 'https://api.example.invalid/sap/rest/authorization/v2/roles')
      assert.equal(options.method, 'GET')
      assert.equal(options.headers.Authorization, 'Bearer controlled-api-token')
      assert.equal('body' in options, false)
      return { ok: true, status: 200, json: async () => ([{ name: 'controlled-role' }]) }
    }
  })
  assert.deepEqual(await authorizationClient.request({
    method: 'GET',
    path: '/sap/rest/authorization/v2/roles'
  }), [{ name: 'controlled-role' }])
  assert.equal(authorizationRequests.length, 1)
  await assert.rejects(
    authorizationClient.request({ method: 'GET', path: 'https://attacker.example.invalid/private' }),
    error => error?.code === 'PROVIDER_DENIED'
  )
  await assert.rejects(
    authorizationClient.request({ method: 'TRACE', path: '/sap/rest/authorization/v2/roles' }),
    error => error?.code === 'PROVIDER_DENIED'
  )
  let deniedMethodTokenReads = 0
  let deniedMethodFetches = 0
  const methodRestrictedClient = createSapAuthorizationApiClient({
    apiUrl: api.apiUrl,
    minIntervalMs: 0,
    tokenProvider: {
      getAccessToken: async () => {
        deniedMethodTokenReads += 1
        return 'must-not-be-requested'
      }
    },
    fetchImpl: async () => {
      deniedMethodFetches += 1
      return { ok: true, status: 204 }
    }
  })
  for (const method of ['POST', 'DELETE']) {
    await assert.rejects(
      methodRestrictedClient.request({ method, path: '/Groups/controlled-group', body: method === 'POST' ? {} : undefined }),
      error => error?.code === 'PROVIDER_DENIED'
    )
  }
  assert.equal(deniedMethodTokenReads, 0)
  assert.equal(deniedMethodFetches, 0)
  const missingResourceClient = createSapAuthorizationApiClient({
    apiUrl: api.apiUrl,
    minIntervalMs: 0,
    tokenProvider: { getAccessToken: async () => 'controlled-api-token' },
    fetchImpl: async () => ({
      ok: false,
      status: 404,
      text: async () => 'private provider response must-not-leak'
    })
  })
  await assert.rejects(
    missingResourceClient.request({ method: 'GET', path: '/Users/11111111-1111-4111-8111-111111111111' }),
    error => error?.code === 'PROVIDER_RESOURCE_NOT_FOUND' && !error.message.includes('private provider response')
  )

  const scimRequests = []
  let directGroups = [{ display: 'NON_IDTS_EXISTING', value: 'non-idts', type: 'DIRECT' }]
  const scimApiClient = {
    async request ({ method, path, body }) {
      scimRequests.push({ method, path, body })
      if (method === 'GET' && path === '/Users/11111111-1111-4111-8111-111111111111') {
        return {
          id: '11111111-1111-4111-8111-111111111111',
          origin: 'sap.default',
          active: true,
          groups: directGroups
        }
      }
      if (method === 'GET' && path === '/Groups?count=500&startIndex=1') {
        return {
          resources: [
            { id: 'idts-tester-group', displayName: 'IDTS_TESTER' },
            { id: 'idts-pm-group', displayName: 'IDTS_PM' },
            { id: 'idts-developer-group', displayName: 'IDTS_DEVELOPER' },
            { id: 'idts-user-admin-group', displayName: 'IDTS_USER_ADMIN' }
          ],
          startIndex: 1,
          itemsPerPage: 4,
          totalResults: 4
        }
      }
      if (method === 'PATCH' && path === '/Groups/idts-tester-group') {
        assert.equal(body.members.length, 1)
        assert.deepEqual({ ...body.members[0], operation: undefined }, {
          origin: 'sap.default',
          type: 'USER',
          value: '11111111-1111-4111-8111-111111111111',
          operation: undefined
        })
        assert.ok(['create', 'delete'].includes(body.members[0].operation))
        directGroups = body.members[0].operation === 'create'
          ? [...directGroups, { display: 'IDTS_TESTER', value: 'idts-tester-group', type: 'DIRECT' }]
          : directGroups.filter(group => group.display !== 'IDTS_TESTER')
        return { id: 'idts-tester-group', displayName: 'IDTS_TESTER' }
      }
      throw new Error('unexpected SCIM request')
    }
  }
  const scimContract = createSapUserManagementContract()
  assert.equal(scimContract.contractId, 'SAP_USER_MANAGEMENT_OPENAPI_69DC872E_V1')
  assert.equal(OPENAPI_SHA256, '69dc872e32ce2c4bcec77466c736f81e0a99961b333eea9f10aa23b9705c2cc8')
  assert.deepEqual(await scimContract.listRoleCollections(controlledIdentity, scimApiClient), ['NON_IDTS_EXISTING'])
  await scimContract.assignRoleCollection(controlledIdentity, 'IDTS_TESTER', scimApiClient)
  assert.deepEqual(await scimContract.listRoleCollections(controlledIdentity, scimApiClient), [
    'NON_IDTS_EXISTING',
    'IDTS_TESTER'
  ])
  await scimContract.unassignRoleCollection(controlledIdentity, 'IDTS_TESTER', scimApiClient)
  assert.deepEqual(await scimContract.listRoleCollections(controlledIdentity, scimApiClient), ['NON_IDTS_EXISTING'])
  assert.ok(scimRequests.some(request => request.method === 'PATCH'))
  assert.equal(scimRequests.every(request => ['GET', 'PATCH'].includes(request.method)), true)
  assert.equal(JSON.stringify(scimRequests).includes(controlledIdentity.email), false)

  await assert.rejects(
    scimContract.listRoleCollections({ ...controlledIdentity, platformUserId: 'not-a-uuid' }, scimApiClient),
    error => error?.code === 'PROVIDER_IDENTITY_UNVERIFIED'
  )
  await assert.rejects(
    scimContract.listRoleCollections({ ...controlledIdentity, origin: 'other-origin' }, scimApiClient),
    error => error?.code === 'PROVIDER_IDENTITY_UNVERIFIED'
  )
  await assert.rejects(
    scimContract.assignRoleCollection(controlledIdentity, 'Subaccount Administrator', scimApiClient),
    error => error?.code === 'PROVIDER_DENIED'
  )

  const inactiveUserClient = {
    request: async () => ({
      id: controlledIdentity.platformUserId,
      origin: 'sap.default',
      active: false,
      groups: [],
      rawPrivateProviderDetail: 'must-not-leak'
    })
  }
  await assert.rejects(
    scimContract.listRoleCollections(controlledIdentity, inactiveUserClient),
    error => error?.code === 'PROVIDER_IDENTITY_UNVERIFIED' && !error.message.includes('rawPrivateProviderDetail')
  )

  const duplicateGroupClient = {
    request: async ({ method, path }) => {
      if (method === 'GET' && path.startsWith('/Users/')) {
        return {
          id: controlledIdentity.platformUserId,
          origin: 'sap.default',
          active: true,
          groups: []
        }
      }
      if (method === 'GET' && path.startsWith('/Groups?')) return {
          resources: [
            { id: 'one', displayName: 'IDTS_TESTER' },
            { id: 'two', displayName: 'IDTS_TESTER' }
          ],
          startIndex: 1,
          itemsPerPage: 2,
          totalResults: 2
        }
      return null
    }
  }
  await assert.rejects(
    scimContract.assignRoleCollection(controlledIdentity, 'IDTS_TESTER', duplicateGroupClient),
    error => error?.code === 'PROVIDER_GROUP_AMBIGUOUS' && !error.message.includes('IDTS_TESTER')
  )

  const paginatedPaths = []
  const paginatedGroupClient = {
    request: async ({ method, path, body }) => {
      paginatedPaths.push(path)
      if (method === 'GET' && path.startsWith('/Users/')) {
        return { id: controlledIdentity.platformUserId, origin: 'sap.default', active: true, groups: [] }
      }
      if (method === 'GET' && path.endsWith('startIndex=1')) {
        return {
          resources: [{ id: 'first', displayName: 'UNRELATED' }],
          startIndex: 1,
          itemsPerPage: 1,
          totalResults: 2
        }
      }
      if (method === 'GET' && path.endsWith('startIndex=2')) {
        return {
          resources: [{ id: 'second', displayName: 'IDTS_PM' }],
          startIndex: 2,
          itemsPerPage: 1,
          totalResults: 2
        }
      }
      if (method === 'PATCH' && path === '/Groups/second') {
        assert.equal(body.members[0].operation, 'create')
        return { id: 'second' }
      }
      throw new Error('unexpected paginated SCIM request')
    }
  }
  await scimContract.assignRoleCollection(controlledIdentity, 'IDTS_PM', paginatedGroupClient)
  assert.deepEqual(paginatedPaths.slice(1, 3), [
    '/Groups?count=500&startIndex=1',
    '/Groups?count=500&startIndex=2'
  ])

  let disabledFetchCalls = 0
  const disabledRuntime = createBrokerRuntime({
    env: {},
    vcapServices: '{bad json',
    fetchImpl: async () => { disabledFetchCalls += 1 }
  })
  assert.equal(disabledRuntime.enabled, false)
  assert.deepEqual(await disabledRuntime.runOnce(), { processed: false, status: 'DISABLED' })
  assert.equal(disabledFetchCalls, 0)

  const brokerServer = createBrokerServer({ runtime: disabledRuntime, port: 0 })
  const address = await brokerServer.start()
  try {
    const health = await fetch(`http://127.0.0.1:${address.port}/health`)
    assert.equal(health.status, 200)
    assert.deepEqual(await health.json(), { status: 'UP', enabled: false })
    const missing = await fetch(`http://127.0.0.1:${address.port}/private`)
    assert.equal(missing.status, 404)
  } finally {
    await brokerServer.stop()
  }

  assert.throws(
    () => createBrokerRuntime({
      env: {
        IDTS_ACCESS_BROKER_ENABLED: 'true',
        IDTS_BROKER_CAP_URL: 'https://cap.example.invalid'
      },
      vcapServices: controlledVcap(),
      mutationContract: null
    }),
    error => error?.code === 'PROVIDER_CONTRACT_UNVERIFIED'
  )

  console.log('IDTS user access broker runtime checks: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
