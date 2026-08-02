# SAP BTP Trial demo readiness

## Purpose

SAP BTP Trial and HANA Cloud Free Tier are non-production environments. Cloud
Foundry applications and the HANA database can be stopped by platform policy,
so a successful deployment does not guarantee continuous availability. This
runbook verifies the actual runtime chain without deploying schema or resetting
data.

Run the preparation once the evening before a review and again **30-45 minutes**
before the live demonstration:

```powershell
npm run btp:demo:prepare
```

For a read-only status check:

```powershell
npm run btp:demo:check
```

## What the script checks

1. The Cloud Foundry CLI has an active target.
2. `idts-sap01-srv` and `idts-sap01-approuter` are running `1/1`.
3. `/health` confirms the CAP process is alive.
4. `/ready` performs database readiness through the real CAP/HDI binding.
5. Protected OData returns HTTP 401 without a user session.
6. The AppRouter web entry returns HTTP 200 or an authentication redirect.

If database readiness fails, prepare mode requests the supported HANA start
operation, waits for the database, then restarts CAP once to clear stale pooled
connections. It does not run the HDI deployer, `cds deploy`, seed loading or any
data mutation. `DB_PROBE_OK` remains the lower-level recovery evidence when an
operator needs to diagnose the database binding directly.

## Expected stopped applications

The migration runner and HDI deployer are one-shot applications. Their stopped
state is normal. Do not start them to recover the website. XSUAA, Destination,
HTML5 Repository and Job Scheduler are managed service instances rather than
long-running Cloud Foundry applications.

## If the result is not ready

- HANA start timeout: open HANA Cloud Central and confirm the physical database
  reaches `Running`; then rerun prepare mode.
- CAP not `1/1`: inspect recent `cf logs idts-sap01-srv --recent` output.
- AppRouter not `1/1`: inspect `cf logs idts-sap01-approuter --recent`.
- `/health` 200 but `/ready` 503: the process is alive but the database binding
  is unavailable; restarting only the browser cannot fix it.
- HTTP 403 after readiness passes: investigate the SAP identity and IDTS role
  mapping. Do not classify a 503/database outage as an account denial.

## Demo fallback

Trial has no SLA. Keep the verified Render/PostgreSQL environment and a short
sanitized recording/screenshots as fallback evidence for a review panel. Do not
use keep-alive polling, embed BTP operator credentials in Job Scheduler, or add
automatic broad database deployment as a workaround.
