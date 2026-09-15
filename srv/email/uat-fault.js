'use strict'

const MIN_TOKEN_LENGTH = 16
const consumedTokens = new Set()

function wrapEmailSenderForUat (config, sendMail) {
  const token = typeof config?.uatFailureToken === 'string' ? config.uatFailureToken.trim() : ''
  if (!config?.uatFailureEnabled || token.length < MIN_TOKEN_LENGTH || typeof sendMail !== 'function') return sendMail

  return async message => {
    if (!consumedTokens.has(token) && typeof message?.text === 'string' && message.text.includes(token)) {
      consumedTokens.add(token)
      throw Object.assign(new Error('Controlled UAT email failure.'), { code: 'EMAIL_UAT_FORCED_FAILURE' })
    }
    return sendMail(message)
  }
}

module.exports = {
  wrapEmailSenderForUat
}
