# IDTS-114 feature-specific model routing — SAP BTP selective deployment

## Release baseline

- Source merge SHA: `5807313f232db91acc55cc1f6aca6378891044b1`
- Source PR: `#247`
- Build source: clean detached worktree at the merge SHA
- MTAR: `idts-sap01_1.0.0.mtar`
- MTAR SHA-256: `826973CE15D94D3052E34BFC06C47DE82A00A976ABC697EBBBE528AA593A95B4`
- Cloud Foundry org/space: `f5648117trial / dev`
- MTA operation: `2f9643d5-8cd7-11f1-ada0-eeee0a9d0408`

No API key, password, binding credential, prompt, raw provider response, or
private endpoint was read into this evidence.

## Selective rollout

The deployment command selected only the service module:

```text
cf deploy mta_archives/idts-sap01_1.0.0.mtar -m idts-sap01-srv
```

Result:

- `idts-sap01-srv` uploaded, staged, and started successfully.
- The HDI database deployer was not selected.
- No broad `cds deploy`, schema migration, seed reload, or direct HANA write
  was run.
- The existing HANA binding was explicitly not rebound because its binding
  parameters did not change.
- The MTA controller refreshed service parameters and application bindings
  declared by the selected module.

## Runtime routing readback

Only non-secret model aliases were read back through the Cloud Foundry API:

| Capability | Active model |
| --- | --- |
| Classification | `openai/gpt-5.4-nano` |
| Handoff Summary | `minimax/minimax-m2.5` |
| Handoff bounded backup | `xai/grok-4.1-fast-non-reasoning` |
| Smart Assign Explanation | `zai/glm-4.7-flash` |
| Similar Bugs embedding | `alibaba/qwen3-embedding-0.6b` |

Grok was retained. It is not a general primary model; it is one bounded backup
for eligible Handoff route denial, network/timeout, or HTTP 5xx. HTTP 429 and a
generic account/key HTTP 403 do not switch to Grok.

## Post-deployment verification

| Check | Result |
| --- | --- |
| `idts-sap01-srv` requested state | `started` |
| `idts-sap01-srv` instances | `1/1 running` |
| `idts-sap01-approuter` requested state | `started` |
| `idts-sap01-approuter` instances | `1/1 running` |
| Service `/health` | HTTP `200` |
| Anonymous protected BugService request | HTTP `401` |
| AppRouter static application path | HTTP `200` |
| New staging/runtime crash | Not observed |

The AppRouter can serve the static application shell anonymously, while the
protected OData service still rejects requests without an XSUAA token. Full
feature acceptance therefore requires the authenticated browser session and
backend response, not only the shell status.

## Build observations

- CAP production build passed.
- UI5 production build passed.
- Existing CAP warning remains for
  `@Capabilities.UpdateRestrictions.NonUpdateableProperties` on attachments.
- Locked dependency installation reported existing audit findings. No
  dependency or lockfile was changed and no force upgrade was run.

## Remaining acceptance

The deployment is complete, but provider-live feature acceptance is not yet
complete. Run the authenticated flows sequentially:

1. Classification.
2. Handoff Summary.
3. Smart Assign Explanation.
4. Similar Bugs last.

For each flow, verify the sanitized HANA audit fields, reload persistence, and
no unintended Bug mutation. Tester/Developer role evidence remains deferred,
so IDTS-114 and IDTS-115 stay `In Progress`.
