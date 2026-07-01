const { spawn } = require('node:child_process')

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function redact(value) {
  return String(value || '')
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/g, '[REDACTED_POSTGRES_URL]')
    .replace(/password:\s*'[^']*'/g, "password: '[REDACTED]'")
    .replace(/user:\s*'[^']*'/g, "user: '[REDACTED]'")
    .replace(/host:\s*'[^']*'/g, "host: '[REDACTED]'")
    .replace(/database:\s*'[^']*'/g, "database: '[REDACTED]'")
    .replace(/cds_requires_db_credentials_password=[^\s]+/g, 'cds_requires_db_credentials_password=[REDACTED]')
}

function runBuffered(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: {
        ...process.env,
        CDS_LOG_LEVEL: process.env.CDS_LOG_LEVEL || 'warn',
      },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let output = ''
    child.stdout.on('data', chunk => {
      output += chunk.toString()
    })
    child.stderr.on('data', chunk => {
      output += chunk.toString()
    })
    child.on('error', reject)
    child.on('close', code => {
      if (code === 0) return resolve()
      const error = new Error(`Command failed with exit code ${code}`)
      error.output = output
      error.code = code
      reject(error)
    })
  })
}

function startApp() {
  const child = spawn(npmCommand, ['start'], {
    env: process.env,
    shell: false,
    stdio: 'inherit',
  })

  child.on('error', error => {
    console.error('IDTS app start failed:', error.message)
    process.exit(1)
  })
  child.on('exit', code => {
    process.exit(code ?? 1)
  })
}

async function main() {
  try {
    await runBuffered(npmCommand, ['run', 'render:db:deploy'])
    console.log('IDTS Render DB deploy completed.')
    startApp()
  } catch (error) {
    console.error('IDTS Render DB deploy failed. Redacted deploy output follows.')
    console.error(redact(error.output || error.message))
    process.exit(error.code || 1)
  }
}

main()
