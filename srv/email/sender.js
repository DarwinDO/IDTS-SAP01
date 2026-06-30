'use strict'

const nodemailer = require('nodemailer')

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

module.exports = {
  createSmtpSender
}
