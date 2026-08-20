'use strict'

const http = require('node:http')
const { createBrokerRuntime } = require('./runtime')

function createBrokerServer ({ runtime, port = 3000, pollIntervalMs = 5000, logger = safeLogger() }) {
  if (!runtime || typeof runtime.runOnce !== 'function') throw new Error('Broker runtime is unavailable.')
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Broker port is invalid.')
  if (!Number.isInteger(pollIntervalMs) || pollIntervalMs < 1000 || pollIntervalMs > 60000) throw new Error('Broker poll interval is invalid.')

  let timer = null
  let stopped = false
  const server = http.createServer((request, response) => {
    if (request.method !== 'GET' || request.url !== '/health') {
      response.writeHead(404).end()
      return
    }
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ status: 'UP', enabled: runtime.enabled === true }))
  })

  async function poll () {
    if (stopped || runtime.enabled !== true) return
    try {
      const result = await runtime.runOnce()
      logger.info({ event: 'ACCESS_BROKER_POLL', status: safeStatus(result?.status) })
    } catch {
      logger.error({ event: 'ACCESS_BROKER_POLL', status: 'ERROR' })
    } finally {
      if (!stopped) timer = setTimeout(poll, pollIntervalMs)
    }
  }

  return Object.freeze({
    start: () => new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(port, '0.0.0.0', () => {
        server.removeListener('error', reject)
        if (runtime.enabled === true) timer = setTimeout(poll, 0)
        resolve(server.address())
      })
    }),
    stop: () => new Promise((resolve, reject) => {
      stopped = true
      if (timer) clearTimeout(timer)
      server.close(error => error ? reject(error) : resolve())
    })
  })
}

function safeStatus (value) {
  return ['IDLE', 'ACTIVE', 'REVOKED', 'RETRYABLE_FAILURE', 'BLOCKED_MANUAL_REVIEW'].includes(value)
    ? value
    : 'UNKNOWN'
}

function safeLogger () {
  return Object.freeze({
    info: value => process.stdout.write(`${JSON.stringify(value)}\n`),
    error: value => process.stderr.write(`${JSON.stringify(value)}\n`)
  })
}

if (require.main === module) {
  try {
    const runtime = createBrokerRuntime({})
    const port = Number.parseInt(process.env.PORT || '3000', 10)
    const pollIntervalMs = Number.parseInt(process.env.IDTS_ACCESS_BROKER_POLL_INTERVAL_MS || '5000', 10)
    createBrokerServer({ runtime, port, pollIntervalMs }).start()
  } catch {
    process.stderr.write('{"event":"ACCESS_BROKER_START","status":"ERROR"}\n')
    process.exitCode = 1
  }
}

module.exports = { createBrokerServer }
