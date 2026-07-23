# IDTS-90 DonHV Knowledge Gate — Assignment flow

Date: 2026-07-23

Mode: additional flow on the same day

Result: PASS

Score: 90%

The deterministic runner selected five assignment questions. This assessment uses DonHV's own answers from the live learning/debug session; no answer was generated on DonHV's behalf.

- DonHV explained that assignee is the technical Developer responsible for the Bug, while Current Action Owner / next processor identifies who must act at the current workflow step.
- DonHV traced direct assignee writes through backend permission and assignee validation, and explained why Postman callers cannot rely on Fiori UI protection.
- DonHV gave a negative case: a Developer changing `assignee_ID` must receive `403`; invalid capability data must not persist.
- DonHV explained that `nextState` is an in-memory preview built from old data plus patch data, not a committed row.
- DonHV explained transaction rollback: if Bug update succeeds but mandatory history persistence fails, both must roll back to avoid an untraceable state.

Debug/teach-back evidence: DonHV used VS Code breakpoints in `srv/service.js`, followed permission/transition code and explained request order in their own words.

No credential, private endpoint or personal email is recorded here.
