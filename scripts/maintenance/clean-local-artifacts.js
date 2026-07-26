#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')

const args = process.argv.slice(2)
const rootArg = args.includes('--root') ? args[args.indexOf('--root') + 1] : process.cwd()
const apply = args.includes('--apply')
const root = fs.realpathSync(rootArg)

if (!fs.existsSync(path.join(root, '.git'))) {
  throw new Error(`Refusing cleanup because this is not a Git worktree root: ${root}`)
}

const relativeTargets = ['.tmp', 'logs', 'tmp', 'output', path.join('scripts', 'qa', 'uat-evidence')]
const targets = relativeTargets
  .map(relative => path.resolve(root, relative))
  .filter(target => target.startsWith(root + path.sep) && fs.existsSync(target))

const rootTempLogs = fs.readdirSync(root, { withFileTypes: true })
  .filter(entry => entry.isFile() && /^\.tmp-.*\.log$/i.test(entry.name))
  .map(entry => path.resolve(root, entry.name))

function sizeOf (target) {
  const stat = fs.statSync(target)
  if (stat.isFile()) return stat.size
  return fs.readdirSync(target, { withFileTypes: true }).reduce((total, entry) => {
    return total + sizeOf(path.join(target, entry.name))
  }, 0)
}

const allTargets = [...targets, ...rootTempLogs]
const totalBytes = allTargets.reduce((total, target) => total + sizeOf(target), 0)
console.log(`MODE=${apply ? 'APPLY' : 'DRY_RUN'}`)
console.log(`ROOT=${root}`)
console.log(`TARGETS=${allTargets.length}`)
console.log(`BYTES=${totalBytes}`)
for (const target of allTargets) console.log(path.relative(root, target))

if (apply) {
  for (const target of allTargets) fs.rmSync(target, { recursive: true, force: true })
  console.log('CLEANUP=COMPLETE')
}
