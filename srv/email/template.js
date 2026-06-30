'use strict'

function buildEmailMessage ({
  notificationID,
  recipientEmail,
  eventType,
  eventTypeName,
  message,
  bug,
  config
}) {
  const bugNumber = bug?.bugNumber || 'Bug'
  const title = bug?.title || 'Untitled bug'
  const eventLabel = eventTypeName || eventType || 'Updated'
  const statusName = bug?.statusName || 'Unknown'
  const nextProcessor = bug?.nextProcessorDisplayName || 'Not assigned'
  const link = buildBugLink(config?.baseUrl, bug?.ID)
  const subject = `[IDTS] ${bugNumber} - ${eventLabel}`

  const textLines = [
    `${bugNumber}: ${title}`,
    `Event: ${eventLabel}`,
    `Status: ${statusName}`,
    `Next processor: ${nextProcessor}`,
    `Message: ${message || 'No additional message.'}`
  ]
  if (link) textLines.push(`Open in IDTS: ${link}`)

  const htmlLines = [
    `<h2>${escapeHtml(bugNumber)}: ${escapeHtml(title)}</h2>`,
    '<dl>',
    `<dt>Event</dt><dd>${escapeHtml(eventLabel)}</dd>`,
    `<dt>Status</dt><dd>${escapeHtml(statusName)}</dd>`,
    `<dt>Next processor</dt><dd>${escapeHtml(nextProcessor)}</dd>`,
    '</dl>',
    `<p>${escapeHtml(message || 'No additional message.')}</p>`
  ]
  if (link) htmlLines.push(`<p><a href="${escapeHtml(link)}">Open this bug in IDTS</a></p>`)

  return {
    to: recipientEmail,
    from: formatFrom(config),
    replyTo: config?.replyTo || undefined,
    subject,
    text: textLines.join('\n'),
    html: htmlLines.join(''),
    headers: {
      'X-IDTS-Notification-ID': notificationID
    },
    templateKey: `BUG_${eventType || 'UPDATED'}`
  }
}

function buildBugLink (baseUrl, bugID) {
  if (!baseUrl || !bugID) return null
  return `${baseUrl}/#/Bugs(${encodeURIComponent(bugID)})`
}

function formatFrom (config) {
  if (!config?.fromAddress) return undefined
  const name = String(config.fromName || 'IDTS').replace(/["\r\n]/g, '')
  return `"${name}" <${config.fromAddress}>`
}

function escapeHtml (value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

module.exports = {
  buildEmailMessage,
  escapeHtml
}
