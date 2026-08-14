# UA-R3A Broker Local Artifact Evidence

Status: `LOCAL_CANDIDATE / NOT_DEPLOYMENT_AUTHORIZED`

## Frozen source

- Branch: `feature/wp7-user-onboarding-donhv`
- Commit: `5331d6f`
- Descriptor: `mta.user-access-broker-candidate.yaml`

## Artifact

- File name: `idts-user-access-broker-candidate-5331d6f.mtar`
- SHA-256: `353a62341333f8585c987f36edfd3cf2ffec1cfe0303c3e67037a94feaef4c51`
- Outer entries: 5
- Module payload files: 13
- Source-parity mismatches: 0
- Credential-pattern hits: 0
- Isolated broker production audit: 0 vulnerabilities

## Topology boundary

- Exactly one no-route Node.js broker module.
- Runtime remains disabled with `IDTS_ACCESS_BROKER_ENABLED=false`.
- References only a dedicated broker XSUAA instance and the exact existing broker API-access user-provided service name.
- Contains no main CAP, AppRouter, UI, DB deployer, HDI, destination, Job Scheduler, S3, Brevo, AI Gateway, user, group, or Role Collection mutation.
- Contains no credential value, token, private endpoint, user identity, or PII.

## Gate boundary

This local build proves packaging and topology only. It does not authorize deployment, creation of the user-provided service, XSUAA creation/update, HANA migration, broker enablement, user/Role Collection mutation, or live provisioning.

## Independent review

- Findings: `0 Critical / 0 Major`.
- Artifact size: 15,956 bytes.
- All 13 payload files byte-match both the working source and Git blobs at commit `5331d6f`.
- Archive paths, duplicate names, symlinks, runtime test, isolated audit, and secret scan pass.
- Verdict: local candidate accepted; deployment remains `NO-GO`.
