# IDTS CLI Login Tools

Use the repository commands below when a saved SAP CLI session expires.

## Cloud Foundry

Run:

```powershell
npm run btp:login:cf
```

The helper opens the static, non-secret official SAP passcode page derived from the currently targeted SAP Cloud Foundry API. Sign in on the browser page and click **Copy**. Do not paste the code into PowerShell or chat. The helper detects the new clipboard value, passes it to the CF CLI through stdin, clears in-memory variables, verifies authenticated access with a suppressed `cf apps` call, and emits PASS only after five successful clipboard overwrite/readback cycles.

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

These tools refresh local CLI sessions only. They do not deploy applications, start services, change bindings, modify trust, assign roles or access HANA data. The temporary code is never accepted as a command argument and is never written by the helper to files or logs. The CF helper passes only the static, non-secret official passcode-page URL to the browser launcher. The official CF and BTP CLIs retain their documented managed login/session configuration; the helpers create no additional credential store.
