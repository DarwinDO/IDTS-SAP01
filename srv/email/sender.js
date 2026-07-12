// Học nhanh (DonHV): adapter gửi mail theo provider config. Nó chỉ gửi; retry/status thuộc outbox để workflow không bị phụ thuộc provider.
'use strict'

const nodemailer = require('nodemailer')

function createEmailSender (config) {
  if (config?.provider === 'brevo-api') return createBrevoApiSender(config)
  return createSmtpSender(config)
}

function createSmtpSender (config) {
  if (!config?.ready) throw new Error('SMTP configuration is not ready.')

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    pool: true,
    maxConnections: config.maxConnections,
    auth: {
      user: config.username,
      pass: config.password
    }
  })

  return {
    sendMail: message => transporter.sendMail(message),
    close: () => transporter.close()
  }
}

function createBrevoApiSender (config) {
  if (!config?.ready) throw new Error('Brevo API configuration is not ready.')

  return {
    sendMail: message => sendBrevoApiMail(config, message),
    close: () => {}
  }
}

async function sendBrevoApiMail (config, message) {
  const response = await fetch(config.brevoApiEndpoint, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': config.brevoApiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(toBrevoApiPayload(message, config))
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const error = new Error('Brevo API request failed.')
    error.code = response.status >= 500 ? 'BREVO_API_FAILED' : 'BREVO_API_REJECTED'
    error.status = response.status
    error.providerMessage = sanitizeProviderMessage(payload?.message)
    throw error
  }

  return {
    messageId: payload?.messageId || payload?.messageIds?.[0] || null
  }
}

function toBrevoApiPayload (message, config) {
  const payload = {
    sender: parseAddress(message.from, config),
    to: [{ email: message.to }],
    subject: message.subject,
    textContent: message.text,
    htmlContent: message.html
  }

  if (message.replyTo) payload.replyTo = { email: message.replyTo }
  if (message.headers?.['X-IDTS-Notification-ID']) {
    payload.headers = { 'X-IDTS-Notification-ID': message.headers['X-IDTS-Notification-ID'] }
  }

  return payload
}

function parseAddress (from, config) {
  const match = typeof from === 'string' ? from.match(/^"?(.*?)"?\s*<([^>]+)>$/) : null
  return {
    name: match?.[1] || config.fromName || 'IDTS',
    email: match?.[2] || config.fromAddress
  }
}

function sanitizeProviderMessage (message) {
  if (!message) return undefined
  return String(message).replace(/[\r\n]+/g, ' ').slice(0, 160)
}

module.exports = {
  createBrevoApiSender,
  createEmailSender,
  createSmtpSender
}
