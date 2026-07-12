// Học nhanh (DonHV): dựng subject/text/HTML từ dữ liệu đã allowlist; không đưa description, attachment hay secret vào mail v1.
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
    `Notification type: ${eventLabel}`,
    `Current status: ${statusName}`,
    `Current action owner: ${nextProcessor}`,
    `Message: ${message || 'No additional message.'}`
  ]
  if (link) textLines.push(`Open in IDTS: ${link}`)

  const metadataRows = [
    ['Notification type', eventLabel],
    ['Current status', statusName],
    ['Current action owner', nextProcessor]
  ].map(([label, value]) => `
      <tr>
        <td style="padding:8px 12px;color:#556b82;font-size:13px;border-top:1px solid #e5ebf1;width:180px;">${escapeHtml(label)}</td>
        <td style="padding:8px 12px;color:#223548;font-size:13px;border-top:1px solid #e5ebf1;">${escapeHtml(value)}</td>
      </tr>`).join('')

  const actionHtml = link
    ? `
        <p style="margin:24px 0 8px;">
          <a href="${escapeHtml(link)}" style="display:inline-block;background:#0a6ed1;color:#ffffff;text-decoration:none;border-radius:4px;padding:10px 18px;font-weight:600;font-size:14px;">Open Bug in IDTS</a>
        </p>
        <p style="margin:8px 0 0;color:#556b82;font-size:12px;line-height:18px;">
          If the button does not work, copy this link:<br>
          <a href="${escapeHtml(link)}" style="color:#0a6ed1;word-break:break-all;">${escapeHtml(link)}</a>
        </p>`
    : ''

  const htmlLines = [
    '<div style="margin:0;padding:24px;background:#f5f6f7;font-family:Arial,Helvetica,sans-serif;color:#223548;">',
    '  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #d9e2ec;border-radius:8px;overflow:hidden;">',
    '    <div style="padding:18px 24px;background:#0a6ed1;color:#ffffff;">',
    '      <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">IDTS Notification</div>',
    `      <h1 style="margin:8px 0 0;font-size:20px;line-height:28px;font-weight:700;">${escapeHtml(bugNumber)}: ${escapeHtml(title)}</h1>`,
    '    </div>',
    '    <div style="padding:22px 24px;">',
    `      <p style="margin:0 0 16px;font-size:15px;line-height:22px;">${escapeHtml(message || 'No additional message.')}</p>`,
    '      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;border-bottom:1px solid #e5ebf1;margin:0 0 18px;">',
    metadataRows,
    '      </table>',
    actionHtml,
    '    </div>',
    '    <div style="padding:14px 24px;background:#f7f9fb;color:#6a7d90;font-size:12px;line-height:18px;">',
    '      This is an automated IDTS notification. It contains only summary information; open IDTS for full bug details, comments, and attachments.',
    '    </div>',
    '  </div>',
    '</div>'
  ]

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
  const appUrl = normalizeAppUrl(baseUrl)
  const key = `ID=${encodeURIComponent(bugID)},IsActiveEntity=true`
  return `${appUrl}#/Bugs(${key})`
}

function normalizeAppUrl (baseUrl) {
  const normalized = String(baseUrl).trim().replace(/\/+$/, '')
  const currentAppPath = '/idts.bugmanagementui/index.html'

  if (normalized.endsWith(currentAppPath)) return normalized
  if (normalized.endsWith('/idts.bugmanagementui')) return `${normalized}/index.html`

  // A prior Shared QA setup stored the retired UI5 application path in the
  // private base URL. Treat it as a deployment-root URL, never as a valid
  // destination, so newly generated emails recover without a secret change.
  const withoutLegacyAppPath = normalized
    .replace(/\/bug-management-ui\/webapp\/index\.html$/i, '')
    .replace(/\/bug-management-ui\/webapp$/i, '')

  return `${withoutLegacyAppPath}${currentAppPath}`
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
  buildBugLink,
  escapeHtml
}
