# UA-R3D M3D Broker Enablement Evidence

Date: 2026-08-15

Scope: enable the isolated no-route user-access broker only after proving an empty operation journal, dedicated-XSUAA client-credentials authorization, CAP technical-action reachability, and rollback safety. No user or Role Collection provisioning operation was approved or executed in this gate.

## Outcome

- Broker enablement: `PASS`.
- Broker runtime: `STARTED`, `1/1`, zero routes, exactly two broker-only bindings.
- Latest sanitized broker poll: `IDLE`.
- Main runtime: `DEMO READY`; CAP/AppRouter `1/1`, health/readiness `200`, anonymous protected API `401`, Web `200`.
- Pre-enable `UserAccessOperations` aggregate: exactly `0`.
- SAP provider/user/Role Collection mutation count: `0`.

## Root cause and correction

The first valid technical token was unexpired but had neither the `ProvisioningBroker` scope nor the main CAP audience. A sanitized CAP task proved that the live main-XSUAA `xsappname` did not equal the broker descriptor's constructed `idts-sap01-${org}-${space}` value.

The broker descriptor now uses the SAP-supported same-space service reference:

```text
$XSSERVICENAME(idts-sap01-auth).ProvisioningBroker
```

This keeps the authority narrow and avoids the broader `$ACCEPT_GRANTED_AUTHORITIES` option. The dedicated broker XSUAA was updated, the broker was unbound/rebound to recreate its binding OAuth client, and the broker was restaged while disabled. Fresh in-memory token checks then returned scope `PASS` and audience `PASS`; no raw JWT, claim, credential or endpoint was emitted.

Official SAP references:

- <https://help.sap.com/docs/authorization-and-trust-management-service/authorization-and-trust-management/application-security-descriptor-configuration-syntax>
- <https://help.sap.com/docs/SAP_HANA_PLATFORM/4505d0bdaf4948449b7f7379d24d0f0d/184402c0da574164ab6e715e73b9d595.html>
- <https://help.sap.com/docs/authorization-and-trust-management-service/authorization-and-trust-management/update-service-instance>

## Verification sequence

1. Fresh demo check initially found HANA readiness `503`; the existing approved recovery workflow woke the existing HANA service and restarted CAP once. Independent recheck returned `DEMO READY`. No DB deploy, seed, migration or SQL/DML ran.
2. An aggregate-only CF task queried only `COUNT(*)` from `IDTS_CAP_USERACCESSOPERATIONS`; final readback was `0`.
3. Disabled-runtime tasks proved the broker remained disabled during diagnosis and rollback.
4. Dedicated XSUAA token acquisition passed. Status-only CAP diagnostics first returned `401`, narrowing the defect to token audience/authority.
5. Focused source tests failed against the old constructed authority and passed after the service-reference correction.
6. After isolated XSUAA update/rebind/restage, token scope and audience both passed.
7. A process-local technical CAP claim returned `PASS_EMPTY`; the temporary CAP URL was removed immediately afterward.
8. Final broker activation set the in-memory-derived CAP URL, set enabled `true`, restaged the exact broker app, and observed a new `IDLE` poll.

## Mutation ledger

| Category | Result |
| --- | --- |
| Existing HANA state recovery | one supported wake request |
| Existing CAP state recovery | one restart by the approved readiness workflow |
| Aggregate/diagnostic CF tasks | allowlisted output only; no data mutation |
| Failed activation attempts | two; both restored disabled state and removed CAP URL |
| Dedicated broker XSUAA updates | two bounded updates; final service-reference configuration succeeded |
| Dedicated broker XSUAA rebinds | two isolated unbind/bind/restage cycles; final token contract passed |
| Final broker enablement | one successful set-URL/set-enabled/restage sequence |
| Main XSUAA/AppRouter/CAP configuration mutation | zero |
| HANA schema/seed/business-data mutation | zero |
| IAS/IPS/trust mutation | zero |
| User/Role Collection/provider mutation | zero |

## Remaining gate

End-to-end provisioning is not yet claimed. The next gate requires exactly one controlled non-member SAP ID test identity. DonHV must not use DonHV, NhanT, SangVN, DatDT, or another real team identity. No password, OTP, token or activation link may be shared. The controlled test must cover assign/readback, IDTS reconciliation, login, revoke, stale-session behavior and cleanup.
