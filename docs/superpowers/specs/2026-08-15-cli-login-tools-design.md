# IDTS CLI Login Tools Design

## Goal

Provide two safe npm commands that let DonHV refresh Cloud Foundry and SAP BTP CLI sessions without typing or pasting temporary authentication material into PowerShell.

## Commands

- `npm run btp:login:cf` opens the official Cloud Foundry passcode page, waits for a newly copied temporary code, pipes it to `cf login --sso` through stdin, clears the clipboard and in-memory variables, verifies authenticated API access, and emits only a fixed PASS/FAIL status.
- `npm run btp:login:cli` runs `btp login --sso` with redirected stdin and sends the confirmation newline automatically. The BTP CLI opens the browser; DonHV only completes Sign In. The helper verifies a read-only authenticated account request and emits only a fixed PASS/FAIL status.

## Security Boundary

- Never put a passcode, password, token, cookie, login URL, account identifier or credential in process arguments, files, terminal output, logs, evidence or chat.
- The CF helper accepts only a new clipboard value matching the bounded temporary-code shape.
- Both helpers suppress raw CLI output and return allowlisted status lines only.
- The CF helper nulls sensitive variables before overwriting the clipboard with one neutral whitespace character in `finally`.
- Login refresh is the only external effect. The commands do not deploy, start, stop, bind, configure, assign roles or mutate application data.

## Implementation

Use Windows PowerShell and built-in .NET process APIs only. Reuse the already reviewed CF clipboard pattern. Do not add npm dependencies or UI automation. Add one focused static contract test that proves stdin-only secret handling, automatic BTP newline input, safe output and cleanup ordering.

## Acceptance

- Focused test must fail before helpers/npm aliases exist and pass after implementation.
- `npm run btp:login:cf -- --help` is not used because the helper has no secret-bearing arguments.
- Static secret scan, agent-rule check and `git diff --check` pass.
- Live authentication is accepted only when each helper's own authenticated readback returns PASS.
