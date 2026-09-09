#!/usr/bin/env node

'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { renderPngFiles } = require('./generate-idts110-evidence')

const outputPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'idts110-card-fullpage-')), 'long-card.png')
const longCard = '<!doctype html><main style="height:1600px">Long mentor card</main>'

renderPngFiles([{ outputPath, html: longCard }], { fullPage: true })
  .then(() => {
    const png = fs.readFileSync(outputPath)
    assert.equal(png.toString('ascii', 1, 4), 'PNG')
    assert.ok(png.readUInt32BE(20) > 720, 'mentor card PNG must include content below the 720px viewport')
    console.log('IDTS-110 mentor-card full-page rendering: PASS')
  })
  .catch(error => { console.error(error); process.exitCode = 1 })
