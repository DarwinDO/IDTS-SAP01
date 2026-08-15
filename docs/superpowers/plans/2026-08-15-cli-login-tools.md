# IDTS CLI Login Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two dependency-free npm login commands for browser-only BTP SSO and clipboard-to-stdin CF SSO.

**Architecture:** Keep each authentication flow in one bounded PowerShell script. A single Node static contract test enforces the no-secret and fixed-output boundaries without performing authentication.

**Tech Stack:** Windows PowerShell 5.1, Node.js built-in assertions, CF CLI v8, SAP BTP CLI v2.

## Global Constraints

- No password, OTP, passcode, token, cookie, login URL, account identifier or credential may be printed, persisted or passed as a process argument.
- No new npm dependency.
- Login refresh is the only external effect.
- Runtime output is limited to fixed PASS/FAIL status strings.

---

### Task 1: Lock the command contract with a failing test

**Files:**
- Create: `scripts/qa/test-cli-login-tools.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: the requested npm command names and security boundary.
- Produces: assertions for both PowerShell scripts and npm aliases.

- [x] Create a Node assertion test requiring `btp:login:cf`, `btp:login:cli`, clipboard polling, stdin-only CF passcode handling, automatic BTP newline input, fixed status output and cleanup ordering.
- [x] Run `node scripts/qa/test-cli-login-tools.js` and require failure because the aliases/helpers are absent.

### Task 2: Implement the minimal PowerShell helpers

**Files:**
- Create: `scripts/btp/cf-login-sso-from-clipboard.ps1`
- Create: `scripts/btp/btp-login-browser-sso.ps1`
- Modify: `package.json`

**Interfaces:**
- Consumes: installed `cf`, installed `btp`, current CF API target and current BTP CLI saved configuration.
- Produces: `CF_LOGIN=PASS|FAIL_*` and `BTP_LOGIN=PASS|FAIL_*` only.

- [x] Add the reviewed CF helper with an anchored SAP API host, official passcode-page derivation, five-minute new-clipboard deadline, stdin pipe, authenticated `cf apps` readback and fail-safe cleanup.
- [x] Add the BTP helper using `System.Diagnostics.Process`, redirected stdin/stdout/stderr, one automatic newline and a read-only authenticated subaccount-list verification.
- [x] Add npm aliases that invoke only the two fixed scripts through `powershell -NoProfile -ExecutionPolicy Bypass -File`.
- [x] Run the focused test and require PASS.

### Task 3: Verify and publish the tooling change

**Files:**
- Update: `docs/pm/status/donhv.md`
- Update: `docs/knowledge/btp/cli-login-tools.md`

**Interfaces:**
- Consumes: completed helpers and focused test.
- Produces: operational usage instructions and traceable verification evidence.

- [x] Document the two commands and the human-only browser/Copy actions.
- [x] Record the prior terminal-input and clipboard-clear defects plus the fix evidence in DonHV status.
- [x] Run focused test, syntax parsing, secret scan, agent rules and `git diff --check`.
- [ ] Commit and push the isolated branch after confirming no unrelated files are staged.
