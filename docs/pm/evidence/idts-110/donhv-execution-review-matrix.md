# IDTS-110 DonHV execution review — PR #269

## Review baseline

- Pull request: `#269`
- Exact candidate head: `8957cbaa20f9c629818901f9b988884337a7ff82`
- Candidate execution: `34 PASS / 2 FAIL / 152 BLOCKED`
- Approved catalog: 188 English-only cases
- Reviewer: DonHV
- Review status: remediation required before merge

The machine-readable 188-case disposition is generated at
`docs/pm/evidence/idts-110/donhv-case-taxonomy.json`.

## BTP readiness at the reviewed head

`npm run btp:demo:check` returned `DEMO READY` without recovery:

- SAP HANA/HDI readiness: PASS
- CAP application: `1/1`
- AppRouter: `1/1`
- `/health`: HTTP 200
- `/ready`: HTTP 200
- Anonymous protected API/Auth boundary: HTTP 401 as expected
- Web/AppRouter: HTTP 200

No database deployment, seed load, schema migration, or credential read occurred.

## Primary execution taxonomy

The candidate conflates optional BTP confirmation with the environment required for the primary assertion.

| Primary boundary | Cases | Required environment |
| --- | ---: | --- |
| Pure unit | 10 | Local |
| UI component | 2 | Local browser/component harness |
| CAP component | 146 | Local isolated CAP fixture |
| OData contract | 13 | Local CAP HTTP/OData harness |
| BTP integration | 17 | SAP BTP/HANA/XSUAA/external integration |
| **Total** | **188** | **171 local + 17 BTP** |

Therefore, 133 cases labeled `HYBRID_BTP` are not legitimately blocked from their primary local result. They require local execution first; BTP confirmation is additional evidence only where the assertion calls for it.

The 17 true BTP integration cases are:

- `UT-AUTH-011`–`UT-AUTH-015`: XSUAA/deployed identity behavior.
- `UT-ATT-003`–`UT-ATT-006` and `UT-ATT-009`–`UT-ATT-012`: HANA/S3 persistence and deployed attachment behavior.
- `UT-NTF-012`–`UT-NTF-013`: deployed worker concurrency and Job Scheduler behavior.
- `UT-AI-026`–`UT-AI-027`: deployed PM metrics and live-provider rate-limit behavior.

## Two candidate FAIL results

### UT-AUTH-004 — catalog expectation mismatch

The case sends a non-string password but expects generic HTTP 401. `srv/auth.cds` declares the password as `String(255)`, so CAP rejects the malformed type at the CDS contract boundary before `srv/auth.js#login` executes.

Disposition:

- Non-string password: safe validation/HTTP 400-style boundary.
- Wrong string credential: generic HTTP 401 without account disclosure.
- No `AuthSessions` row may be inserted in either failure path.

This is a catalog correction, not a runtime defect.

The current local runner also stops at the mismatched status assertion, so its later no-session assertion is not executed. The rerun must verify both the public HTTP response and unchanged `AuthSessions` state instead of treating the thrown validation object alone as complete security evidence.

### UT-VAL-REPORTER — catalog expectation mismatch

The case expects a missing client `reporter_ID` to fail. Current runtime deliberately treats reporter as server-owned:

- `srv/bug-service/bug-write.js#prepareBugWrite` derives it from the authenticated actor before required-field validation.
- Draft helpers apply the same ownership rule.

Disposition:

- Client omission is valid when the authenticated actor resolves.
- Keep a separate negative case for an actor that cannot be resolved.

This is also a catalog correction, not a runtime defect.

## Evidence quality and repository size

- All 188 manifests exist.
- The candidate contains 269 PNG and 269 SVG files.
- The PNG/SVG pairs are generated result cards, not browser/runtime screenshots by themselves.
- SVG copies contain encoding artifacts in visible text and duplicate the PNG information.
- A blocker card proves that the harness recorded a blocker; it does not prove execution of the product flow.

Required cleanup:

1. Keep each case manifest.
2. Keep one verified PNG result card when it materially helps review.
3. Remove duplicate SVG copies when no tracked consumer requires them.
4. Add real runtime/browser/database evidence only for cases whose assertion requires it.
5. Do not describe generated cards as browser or BTP proof.

## Required remediation before PR #269 can merge

1. NhanT personally reads and acknowledges briefing SHA `3e78b495cb8feb56188cc446b827d47e040e1b98`.
2. DonHV's correction branch updates the two canonical catalog expectations above; no execution result is rewritten to manufacture PASS.
3. NhanT reruns the 133 falsely blocked local CAP/OData cases with the correct local harness.
4. NhanT runs the two UI component cases with a working UI component/browser harness.
5. Only 17 cases remain BTP-required; run them in controlled batches after `btp:demo:check` reports READY.
6. Evidence duplicates and misleading proof labels are removed.
7. PR body is refreshed and `qa-depth-gate` reruns on the exact final head.

Until these steps complete, PR #269 remains a truthful candidate package but is not merge-ready, and IDTS-110 remains `In Progress`.
