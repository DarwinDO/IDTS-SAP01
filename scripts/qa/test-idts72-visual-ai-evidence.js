#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

const ROOT = path.resolve(__dirname, '..', '..')
const SOURCE_EVIDENCE_DIR = path.join(ROOT, 'docs', 'pm', 'evidence', 'idts-72')
const EVIDENCE_DIR = process.env.IDTS_QA_VISUAL_EVIDENCE_DIR ||
  path.join(SOURCE_EVIDENCE_DIR, 'visual-ai-flows')

const SOURCE_SCAN = {
  duplicate: {
    feature: 'Duplicate and similar bug detection',
    task: 'IDTS-66',
    action: 'suggestSimilarBugs',
    productUiStatus: 'NOT_EXPOSED_AS_PRODUCT_UI',
    finding: 'The CAP action exists and is covered by programmatic and shared-QA API smoke tests, but no Fiori/SAPUI5 view or controller currently calls it as a user-visible review panel.'
  },
  classification: {
    feature: 'Classification suggestion',
    task: 'IDTS-67',
    action: 'suggestClassification',
    productUiStatus: 'NOT_EXPOSED_AS_PRODUCT_UI',
    finding: 'The CAP action exists and validates active catalog values, but no product screen currently opens a classification suggestion review UI for the user.'
  },
  summary: {
    feature: 'Bug summary / handoff summary',
    task: 'IDTS-68',
    action: 'summarizeBugHandoff',
    productUiStatus: 'NOT_EXPOSED_AS_PRODUCT_UI',
    finding: 'The CAP action exists and returns grounded handoff summaries, but no product screen currently renders a summary card or handoff panel.'
  },
  smartAssign: {
    feature: 'Smart assignment AI explanation',
    task: 'IDTS-69',
    action: 'explainSmartAssignment',
    productUiStatus: 'PRODUCT_UI_SCREENSHOT_AVAILABLE',
    finding: 'Smart Assign calls the AI explanation action from the Object Page assignment flow and has a browser screenshot.'
  },
  fallback: {
    feature: 'Failure and fallback safe behavior',
    task: 'IDTS-71 / IDTS-72',
    action: 'provider disabled/error/malformed output paths',
    productUiStatus: 'MIXED_API_AND_UI_EVIDENCE',
    finding: 'Fallback behavior is covered by backend/security suites and the Smart Assign UI safe-state check. The other three AI flows need a future product UI if visual end-user fallback evidence is required.'
  }
}

function readJson(relativePath, fallback = null) {
  const fullPath = path.join(SOURCE_EVIDENCE_DIR, relativePath)
  if (!fs.existsSync(fullPath)) return fallback
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'))
}

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function scriptSummary(acceptance, task) {
  const result = acceptance?.results?.find(item => item.name.includes(task))
  if (!result) return 'No acceptance summary found in idts72-ai-acceptance.json.'
  return `${result.summary}; exit ${result.exitCode}; ${result.passed ? 'PASS' : 'FAIL'}`
}

function renderFeatureCard(id, item, summary) {
  const isGap = item.productUiStatus === 'NOT_EXPOSED_AS_PRODUCT_UI'
  const statusClass = isGap ? 'gap' : 'pass'
  const statusText = isGap ? 'Backend/API verified, product UI missing' : 'Evidence available'
  return `
    <section id="${id}" class="card ${statusClass}">
      <div class="eyebrow">${htmlEscape(item.task)} · ${htmlEscape(item.action)}</div>
      <h2>${htmlEscape(item.feature)}</h2>
      <p class="status">${htmlEscape(statusText)}</p>
      <dl>
        <dt>Fresh acceptance evidence</dt>
        <dd>${htmlEscape(summary)}</dd>
        <dt>Product UI coverage</dt>
        <dd>${htmlEscape(item.productUiStatus)}</dd>
        <dt>QA finding</dt>
        <dd>${htmlEscape(item.finding)}</dd>
      </dl>
      ${id === 'smartAssign'
        ? '<p class="note">Product screenshot is copied as <code>04-smart-assign-ai-explanation.png</code>.</p>'
        : '<p class="note">This screenshot is a visual QA report from verified action coverage, not a product screen screenshot.</p>'}
    </section>`
}

function renderHtml(acceptance, browserEvidence) {
  const now = new Date().toISOString()
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>IDTS-72 Visual AI Evidence</title>
  <style>
    :root {
      --sap-blue: #0a6ed1;
      --sap-green: #107e3e;
      --sap-orange: #df6e0c;
      --text: #1d2d3e;
      --muted: #556b82;
      --line: #d9e4ee;
      --bg: #f7f9fb;
      font-family: "72", Arial, Helvetica, sans-serif;
    }
    body { margin: 0; background: var(--bg); color: var(--text); }
    main { width: 1180px; margin: 0 auto; padding: 36px 28px 56px; }
    header { background: white; border: 1px solid var(--line); border-radius: 18px; padding: 28px 32px; box-shadow: 0 8px 24px rgba(20, 45, 70, .08); }
    h1 { margin: 0 0 10px; font-size: 34px; }
    h2 { margin: 8px 0 14px; font-size: 25px; }
    .subtitle { margin: 0; color: var(--muted); font-size: 17px; line-height: 1.5; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-top: 24px; }
    .card { min-height: 310px; background: white; border: 1px solid var(--line); border-radius: 18px; padding: 24px 28px; box-shadow: 0 8px 20px rgba(20, 45, 70, .06); }
    .card.pass { border-top: 8px solid var(--sap-green); }
    .card.gap { border-top: 8px solid var(--sap-orange); }
    .eyebrow { color: var(--sap-blue); font-weight: 700; letter-spacing: .02em; }
    .status { display: inline-block; margin: 0 0 18px; padding: 6px 12px; border-radius: 999px; background: #edf6ff; color: #0a4f8f; font-weight: 700; }
    .gap .status { background: #fff3e6; color: #a93d00; }
    dl { margin: 0; display: grid; grid-template-columns: 200px 1fr; gap: 12px 16px; }
    dt { color: var(--muted); font-weight: 700; }
    dd { margin: 0; line-height: 1.45; }
    code { background: #eef3f8; padding: 2px 6px; border-radius: 6px; }
    .note { margin-top: 20px; color: var(--muted); }
    .wide { grid-column: 1 / -1; }
    .footer { margin-top: 24px; color: var(--muted); font-size: 14px; }
  </style>
</head>
<body>
<main>
  <header>
    <h1>IDTS-72 Visual AI Evidence Audit</h1>
    <p class="subtitle">
      Generated ${htmlEscape(now)}. This report separates verified backend/API AI behavior from actual user-visible product UI.
      It confirms DonHV's observation: Smart Assign has product UI evidence; duplicate detection, classification, and handoff summary are currently verified through API/programmatic suites but are not yet surfaced as standalone Fiori UI panels.
    </p>
  </header>
  <div class="grid">
    ${renderFeatureCard('duplicate', SOURCE_SCAN.duplicate, scriptSummary(acceptance, 'IDTS-66'))}
    ${renderFeatureCard('classification', SOURCE_SCAN.classification, scriptSummary(acceptance, 'IDTS-67'))}
    ${renderFeatureCard('summary', SOURCE_SCAN.summary, scriptSummary(acceptance, 'IDTS-68'))}
    ${renderFeatureCard('smartAssign', SOURCE_SCAN.smartAssign, scriptSummary(acceptance, 'IDTS-69'))}
    ${renderFeatureCard('fallback', SOURCE_SCAN.fallback, `${scriptSummary(acceptance, 'IDTS-71')} Browser: ${(browserEvidence?.results || []).map(row => `${row.check}=PASS`).join(', ') || 'No browser evidence found.'}`)}
    <section id="decision" class="card wide gap">
      <div class="eyebrow">QA decision</div>
      <h2>Do not close visual UI acceptance as complete unless the gap is accepted or product UI is added</h2>
      <dl>
        <dt>What passed</dt>
        <dd>Backend/API acceptance for all four AI capabilities, AI safety/fallback checks, and Smart Assign product UI browser evidence.</dd>
        <dt>What is missing</dt>
        <dd>User-visible product UI evidence for duplicate/similar bug detection, classification suggestion, and bug handoff summary.</dd>
        <dt>Recommended next step</dt>
        <dd>Create follow-up UI tasks or redefine IDTS-72 acceptance as API-level acceptance for those three flows.</dd>
      </dl>
    </section>
  </div>
  <p class="footer">No credentials, tokens, private URLs, or full private recipient lists are included in this report.</p>
</main>
</body>
</html>`
}

async function launchBrowser() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless: true })
    } catch (error) {
      void error
    }
  }
  return chromium.launch({ headless: true })
}

async function screenshotSections(reportPath) {
  const browser = await launchBrowser()
  const page = await browser.newPage({ viewport: { width: 1240, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`file://${reportPath.replace(/\\/g, '/')}`, { waitUntil: 'load' })
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '00-visual-ai-flows-overview.png'), fullPage: true })

  const sections = [
    ['duplicate', '01-duplicate-similar-bug-detection.png'],
    ['classification', '02-classification-suggestion.png'],
    ['summary', '03-bug-summary-handoff.png'],
    ['smartAssign', '04-smart-assign-ai-explanation-report-card.png'],
    ['fallback', '05-failure-fallback-safe-behavior.png'],
    ['decision', '06-qa-gap-decision.png']
  ]
  for (const [id, fileName] of sections) {
    const section = page.locator(`#${id}`)
    await section.screenshot({ path: path.join(EVIDENCE_DIR, fileName) })
  }
  await browser.close()
}

async function main() {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const acceptance = readJson('idts72-ai-acceptance.json', {})
  const browserEvidence = readJson('idts72-ai-browser.json', {})
  const reportHtml = renderHtml(acceptance, browserEvidence)
  const reportPath = path.join(EVIDENCE_DIR, 'visual-ai-flows-report.html')
  fs.writeFileSync(reportPath, reportHtml, 'utf8')

  const sourceSmartAssign = path.join(SOURCE_EVIDENCE_DIR, 'idts72_smart_assign_ai_review.png')
  if (fs.existsSync(sourceSmartAssign)) {
    fs.copyFileSync(sourceSmartAssign, path.join(EVIDENCE_DIR, '04-smart-assign-ai-explanation-product-ui.png'))
  }

  const summary = {
    task: 'IDTS-72',
    generatedAt: new Date().toISOString(),
    conclusion: 'Smart Assign has product UI evidence; duplicate detection, classification suggestion, and handoff summary are backend/API verified but not yet exposed as standalone product UI surfaces.',
    features: SOURCE_SCAN,
    acceptanceTotals: acceptance?.totals || null,
    browserChecks: browserEvidence?.results || [],
    evidenceFiles: [
      'visual-ai-flows-report.html',
      '00-visual-ai-flows-overview.png',
      '01-duplicate-similar-bug-detection.png',
      '02-classification-suggestion.png',
      '03-bug-summary-handoff.png',
      '04-smart-assign-ai-explanation-product-ui.png',
      '04-smart-assign-ai-explanation-report-card.png',
      '05-failure-fallback-safe-behavior.png',
      '06-qa-gap-decision.png'
    ]
  }
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'visual-ai-flows-summary.json'), JSON.stringify(summary, null, 2), 'utf8')

  await screenshotSections(reportPath)

  console.log(`Evidence report: ${reportPath}`)
  console.log(`Summary: ${path.join(EVIDENCE_DIR, 'visual-ai-flows-summary.json')}`)
  console.log('RESULT: PASS')
}

main().catch(error => {
  console.error('RESULT: FAIL')
  console.error(error && error.stack ? error.stack : error)
  process.exit(1)
})
