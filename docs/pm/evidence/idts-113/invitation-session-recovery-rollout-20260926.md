# IDTS-113 invitation guidance and SAP-session recovery rollout — 2026-09-26

## Scope and source

- Source behavior PR: `#418`, merged as `d74b7a8756778b4deb6928e7d2f17cd467d63a86`.
- HTML5 cache-identity PR: `#419`, merged in `dev` head `b93e96d5`.
- Artifact: `idts-sap01-invitation-recovery-b93e96d5.mtar`.
- Artifact SHA-256: `85EFC56631CF31BCD7D1594158A3660A97E42687AE147872F37E4FE6E2D61119`.
- Artifact size: `34,271,945` bytes.

The rollout changes invitation guidance, the protected onboarding success page, and safe recovery from a stale or wrong SAP/XSUAA browser session. It does not change identity matching, business-role authorization, schema, HANA data, invitation records, or user/role assignments.

## Artifact readback

The checksum-reviewed archive contained non-empty packages for `idts-sap01-srv`, `idts-sap01-approuter`, `idts-sap01-app-content`, and the unselected database deployer. Nested-package readback confirmed:

- CAP `srv/user-admin/delivery.js` contains the SAP Universal ID branches, invited-email warning, `ACTIVE` boundary, fresh-sign-in instruction, and IDTS link.
- AppRouter `resources/onboarding/onboarding-page.mjs` contains `refreshSapSignIn` and the post-verification `ACTIVE` guidance.
- Bug Management `auth-guard.js` contains `Sign out and try another SAP account`.
- Packaged Bug Management manifest version is `0.0.18`.

The initial PowerShell manifest readback used `ConvertFrom-Json`, which rejected an existing empty-name UI5 manifest property. Node JSON parsing then returned `PACKAGED_UI_VERSION=0.0.18`. This was a readback-tool limitation, not malformed JSON or an artifact change.

## Selective blue-green deployment

- Cloud Foundry target: org `f5648117trial`, space `dev`.
- Operation: `e0d3810a-b9c1-11f1-9eae-eeee0a8326e5`.
- Selected modules:
  - `idts-sap01-srv`
  - `idts-sap01-approuter`
  - `idts-sap01-app-content`
- Not selected: `idts-sap01-db-deployer`.
- Strategy: blue-green, version rule `ALL`, retries `0`, abort on error.

The MTA controller processed declared XSUAA, Job Scheduler, Destination, HDI, HTML5 repository and other managed-resource metadata while deploying the selected modules. It did not run the database deployer, HDI schema deployment, migration, or seed. Content upload and both idle applications completed before the operation entered `ACTION_REQUIRED` testing phase.

Idle checks passed before resume:

- CAP idle: started `1/1`.
- AppRouter idle: started `1/1`.
- CAP `/health`: HTTP `200`.
- CAP `/ready`: HTTP `200`.
- Anonymous protected Auth API: HTTP `401` as expected.
- AppRouter web entry: HTTP `200`.

The operation was then resumed. Routes moved to the new applications, prior live variants were stopped and deleted, and the operation finished successfully.

## Final readback

- `npm run btp:demo:check`: `DEMO READY`.
- Active MTA operations: none.
- CAP: started `1/1`; droplet `42f5cc6c-5328-4f14-95d6-c0dbb06bbe5d`.
- AppRouter: started `1/1`; droplet `581fe3a1-19b5-495d-802c-f40716d44b32`.
- Public `/onboarding/continue`: HTTP `200`.
- Public `/onboarding/onboarding-page.mjs`: HTTP `200`.
- Live module contains `refreshSapSignIn`: true.
- Live module contains the `ACTIVE` guidance: true.

The local CF CLI does not have the `html5-list` plugin, so HTML5 repository version readback through that command was unavailable. No plugin was installed during rollout and no service credential was printed. Version `0.0.18` is proven by the nested artifact readback and the successful selected app-content deployment, but a signed-in explicit-version and unversioned-alias browser readback remains separate manual acceptance.

## Verification and limitations

Before merge and rollout, the following passed:

- full User Administration invitation config/security/programmatic suite;
- onboarding callback page suite;
- IDTS-113 XSUAA authorization suite `13/13`;
- IDTS-117 logout/re-login regression;
- IDTS-43 Fiori UX `18/18`;
- IDTS-116 collaboration/cache-identity regression;
- Bug Management production UI5 build;
- secret scan;
- AI DevKit lint `5` OK, `0` warnings, `0` required failures;
- both PR QA Depth gates after the stale `0.0.17` test/lockfile contract was corrected.

MTAR dependency installation reported existing audit backlog: root `33` findings, generated CAP package `10`, Bug Management package `13`, User Administration package `12`, and AppRouter package `8`. No `npm audit fix`, dependency upgrade, manifest mutation, or lockfile rewrite was authorized during rollout.

No real invitation email was sent, no invitation/user/role was created or changed, and no signed-in normal-browser recovery click was performed in this rollout. Those actions require a controlled recipient and are not inferred from source, artifact or public-route proof.

## Tóm tắt tiếng Việt

Đã rollout chọn lọc CAP, AppRouter và app-content bằng blue-green từ đúng merge `b93e96d5`; không chọn DB deployer và không chạy schema/migration/seed. Idle checks, cutover, readiness cuối và public onboarding resource đều PASS. Module live đã có helper refresh SAP sign-in và hướng dẫn chờ `ACTIVE`; artifact xác nhận email guidance, auth recovery và UI version `0.0.18`.

Máy hiện tại thiếu plugin `cf html5-list`, nên chưa readback version trực tiếp từ HTML5 repository. Chưa gửi email thật, chưa mutation user/role/invitation và chưa thực hiện click-through bằng signed-in normal browser; đây vẫn là acceptance có kiểm soát riêng.
