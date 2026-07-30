# IDTS-114 BTP AI configuration binding — local verification

## Scope

This change makes the BTP AI configuration durable across MTA deployments. It does not invoke a provider, change an OData contract, migrate HANA, or alter Bug workflow data.

## Root cause observed

The PM Classification dialog returned a safe deterministic fallback because the deployed service reported AI disabled with the mock provider. A presence-only Cloud Foundry inspection found the AI enablement/model environment properties and a dedicated AI gateway binding absent from the service runtime. The prior MTA deploy supplied only the timeout property, so the evidence strongly indicates its environment was replaced by the declared MTA properties.

## Change

- `mta.yaml` declares non-secret Qwen primary and bounded OpenAI fallback properties for the service module.
- The service requires existing user-provided service `idts-sap01-ai-gateway`.
- `srv/ai/config.js` reads only that named binding from `VCAP_SERVICES` if a direct private environment key is absent.
- The retained `idts-sap01-external-services` binding is never scanned for AI credentials.

## Local checks

| Check | Result |
| --- | --- |
| AI provider/config regression | PASS — 38 checks |
| Vercel gateway adapter regression | PASS — 58 checks |
| CAP compile | PASS |
| UI5 production build | PASS |
| Secret scan | PASS |
| Agent rules | PASS |
| QA-depth self-test | PASS — 15 checks |
| AI DevKit lint | PASS — 5 checks |
| `git diff --check` | PASS |

## Release prerequisite

The empty BTP user-provided service has been created. DonHV must enter the Vercel gateway key directly in that service as credential `gatewayApiKey`; the key is not stored in this repository, this evidence, shell history, or a task log. After this is done, deploy the service runtime (not the HDI deployer) and verify the effective configuration by presence/alias only before one sequential Qwen browser call.
