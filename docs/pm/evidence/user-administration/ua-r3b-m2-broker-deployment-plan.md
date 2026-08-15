# UA-R3B M2 Broker-Only Deployment Plan

Status: `PRE-MUTATION / EXACT PACKAGE / NOT YET EXECUTED`

## Frozen inputs

- Source branch HEAD context: `7023ab215bc78275795d2e7deebc7b5e75199b5d` plus the reviewed R3B tracked diff
- Deployment descriptor: `mta.user-access-broker-r3b.yaml`
- MTAR: `mta_archives/idts-user-access-broker-r3b1-7023ab2.mtar`
- MTAR SHA-256: `44a3d3ce6e94ccc77072287cc1b12ea0604735c8dedd019e28d730ff67f6b668`
- Broker payload files: `13`
- Source/payload hash mismatches: `0`
- Sensitive-pattern hits: `0`
- Packaged `package.json` engine: exact `22.x`
- Packaged package-lock root engine: exact `22.x`

The earlier MTARs `353a6234...f4c51` and `90d61cb...d3109` are rejected historical/local packaging candidates and are never used by M2. The latter contains the SAP-buildpack-incompatible engine range `>=20 <23` and is `NEVER DEPLOY`.

## Exact scope

M2 may create and operate only:

- MTA `idts-user-access-broker-r3b`;
- app `idts-user-access-broker`;
- dedicated XSUAA service `idts-user-access-broker-auth`;
- bindings from the exact broker app to the dedicated XSUAA and the existing UPS `idts-user-access-broker-api-access`.

The broker has no route and starts with `IDTS_ACCESS_BROKER_ENABLED=false`. M2 does not activate polling or provisioning.

M2 must not modify the main CAP srv, AppRouter, UI, HANA/HDI, Job Scheduler, IAS/IPS, trust, users, Role Collections, the existing Authorization API credential, or the existing UPS contents.

## Precondition matrix

Before deployment, all of the following must pass in a fresh readback:

- exact CF target assertion;
- BTP demo readiness `DEMO READY`;
- broker app collision `0`;
- dedicated XSUAA service collision `0`;
- MTA ID collision `0`;
- UPS exact/case-insensitive count `1/1` and binding count `0`;
- main srv/AppRouter binding counts `6/3`;
- MTAR hash equals the frozen value above;
- independent review returns `0 Critical / 0 Major`.

## Forward commands

Immediately before every mutation, the executor must repeat the in-memory exact target assertion.

```text
cf deploy <CHECKSUM_VERIFIED_R3B_MTAR> --no-start --version-rule ALL --retries 0 --abort-on-error
```

After sanitized readback proves the exact app, two exact bindings, dedicated XSUAA and no route:

```text
cf start idts-user-access-broker
```

There is no retry after timeout or ambiguous output. Read back state first.

## Postconditions

- broker app exact count `1`, state `STARTED`, instances `1/1`;
- broker route count `0`;
- broker service-binding names exactly:
  - `idts-user-access-broker-auth`;
  - `idts-user-access-broker-api-access`;
- UPS binding count `1`, bound only to the broker app;
- dedicated XSUAA binding count `1`, bound only to the broker app;
- main srv/AppRouter binding counts remain `6/3`;
- main apps remain `1/1` and BTP demo remains `DEMO READY`;
- no user, role, HANA or provider mutation occurred.

## Failure handling and rollback

| Failure point | Required response |
| --- | --- |
| Deploy returns nonzero/timeout | Read `cf mta-ops`, app, service and binding state once; do not redeploy blindly. |
| Ownership/collision is ambiguous | Preserve uncertain objects and stop. |
| App exists but bindings/topology differ | Do not start; run exact cleanup only when ownership is proven. |
| Start fails | Read app state once; no second start; run exact cleanup. |
| Main-app baseline changes | Stop and do not compensate main apps. |

Exact cleanup order:

```text
cf undeploy idts-user-access-broker-r3b -f --retries 0 --abort-on-error
cf delete-service idts-user-access-broker-auth -f
```

The undeploy command intentionally omits `--delete-services`. After undeploy, the executor must prove the broker app and both broker bindings are absent before deleting the dedicated XSUAA. The existing UPS and existing Authorization API credential are never deleted, recreated, rotated or updated.

Final rollback proof requires:

- broker app, broker MTA and dedicated XSUAA absent;
- UPS exact count `1`, binding count `0`;
- main srv/AppRouter bindings `6/3` and readiness unchanged.
