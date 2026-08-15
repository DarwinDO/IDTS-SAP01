# IDTS CLI Login Tools

Use the repository commands below when a saved SAP CLI session expires.

## Cloud Foundry

Run:

```powershell
npm run btp:login:cf
```

The helper opens the official SAP passcode page derived from the currently targeted SAP Cloud Foundry API. Sign in on the browser page and click **Copy**. Do not paste the code into PowerShell or chat. The helper detects the new clipboard value, passes it to the CF CLI through stdin, overwrites the clipboard, clears in-memory variables and verifies authenticated access with a suppressed `cf apps` call.

Success output:

```text
CF_LOGIN=PASS
```

## SAP BTP CLI

Run:

```powershell
npm run btp:login:cli
```

The helper launches `btp login --sso` with redirected stdin and supplies the confirmation newline automatically. Complete Sign In in the browser window. The helper suppresses raw CLI output and verifies the session with a read-only subaccount inventory request.

Success output:

```text
BTP_LOGIN=PASS
```

## Security Boundary

These tools refresh local CLI sessions only. They do not deploy applications, start services, change bindings, modify trust, assign roles or access HANA data. Passwords, temporary codes, login URLs, tokens, cookies and account identifiers are never accepted as command arguments and are never written to files or logs.
