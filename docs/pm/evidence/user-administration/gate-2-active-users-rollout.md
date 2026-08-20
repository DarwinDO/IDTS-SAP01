# Gate 2 Active Users selective rollout

Date: 2026-08-20 (Asia/Bangkok)

## Frozen inputs

- Source head: `f0818cdf179e0594d7719336973105442b278983`.
- Source base: `96746fef148d6d6b9627ed1e8b9be5b28eb94e81`.
- Main MTAR SHA-256: `D9DD3B8DD46261870C2B206ECECC20337DDFA987A5E7F57DE9EB1F204EA40729`.
- Dedicated UI MTAR SHA-256: `180E7FCC5F1F574E625FA01FD620962C617C5E689FBD6B3EE25B792EB27E5F0C`.
- UI rollback MTAR SHA-256: `A7FB892F2079C592C665704905A271A7B966B72E233A5AF32F7B716D0C3661C2`.

Artifact inspection proved that the dedicated UI content contains both Bug Management and User Administration UI ZIPs and references only the existing HTML5 repository host. The selected forward CAP module is `idts-sap01-srv`; the database deployer and AppRouter were not selected. The packaged CAP JavaScript hashes for the Active Users handler and User Administration service implementation match the reviewed source.

## Pre-state

- Runtime readiness: `DEMO READY`.
- CAP and AppRouter: started `1/1`, one route each.
- CAP bindings: seven reviewed existing service names; AppRouter bindings: three.
- Shared XSUAA: one healthy instance, two bindings.
- HTML5 host: one healthy instance, two bindings.
- Main MTA: one; dedicated Gate 2 UI MTA: zero.
- Active MTA operations: zero.

## Forward CAP operation

Exactly one `cf deploy` selected module `idts-sap01-srv` with blue-green strategy, version rule `ALL`, zero retries and abort-on-error. The idle app passed `/health=200`, `/ready=200` and anonymous protected API `401` before the operation was resumed. MultiApps then completed the blue-green cutover and reported `Process finished`.

Although only the CAP module was selected, MultiApps processed its required managed resources and issued same-descriptor updates for destination, XSUAA and Job Scheduler. No database deployer, HDI make, seed, DML, IAS/IPS, user, role, provider, Jira or Drive operation was selected.

## Current state

Status: `SOURCE_REMEDIATED_PENDING_SELECTIVE_REDEPLOYMENT`.

The first post-cutover readiness probe timed out. After CF control-plane connectivity briefly recovered, an initial sanitized V3 readback observed the CAP app requested `STARTED` with one desired web instance but zero running instances. The frozen rollback command was invoked once, but failed during its initial CF API GET and did not mutate the app. A later fresh readback proved CAP running `1/1`, followed by a complete `DEMO READY` result, zero active MTA operations, successful XSUAA/destination/Job Scheduler last operations, and unchanged CAP/AppRouter binding counts `7/3`; therefore no rollback was required.

The checksum-reviewed dedicated UI content MTAR was then deployed exactly once. MultiApps reported initial deployment of MTA `idts-user-admin-ui-r3c`, uploaded the single content module to the existing HTML5 host, skipped service deletion and finished successfully. The regional CF control plane and both AppRouter entry paths became unreachable again immediately afterward, so live content/readiness acceptance remains unproven. No second UI deploy or blind rollback was attempted.

Connectivity later recovered. A fresh readiness check returned CAP/AppRouter `1/1`, health/ready `200`, anonymous protected API `401`, Web `200` and `DEMO READY`; active MTA operations were zero. Read-only Edge verification through the existing PM session proved the new User Administration title, the three approved tabs, automatic Active Users loading, one controlled active TESTER row with a complete identity link, a read-only details dialog, restored Active Users tab/query after reload without duplicate loading, and an unaffected Bug Management list/filter surface. No browser write action or business-data mutation was performed. DonHV-owned Tester-negative and visual evidence remain pending.

- CAP deploy attempts/succeeded according to MultiApps: `1/1`.
- UI deploy attempts/succeeded according to MultiApps: `1/1`.
- Rollback command attempts: `1`; confirmed rollback mutations: `0`.
- Database/schema/data mutations: `0`.

DonHV completed the manual Gate 2 acceptance. No forward deployment retry is required. Use the frozen UI rollback artifact only if a content-specific regression is reproduced while connectivity is healthy.

## DonHV manual acceptance checkpoint

DonHV supplied screenshots that establish the following current results:

- Authorized PM + UserAdmin can open Access Requests, Active Users and Developer Responsibilities.
- Active Users search returns the controlled TESTER as active and identity-linked.
- The controlled TESTER receives `Forbidden` when opening User Administration, which is the expected negative authorization result.
- The controlled TESTER Bug Management check was temporarily blocked by the safe platform-starting fallback.

The blocked Bug Management check was diagnosed as an environment/runtime readiness issue: CAP and AppRouter remained `1/1`, but HANA readiness returned `503`. The approved conditional recovery requested one supported HANA start and restarted CAP once. An independent final check then proved CAP/AppRouter `1/1`, liveness/readiness `200`, protected anonymous API `401`, Web `200`, and `DEMO READY`. No schema, migration, import, seed, user, role or provider mutation ran.

After recovery, DonHV pressed `Retry` once in the existing controlled TESTER Bug Management session. Bug Management rendered its list, filters and navigation, and the session menu identified the controlled account as `Tester`. This closes the unchanged-Bug-UI and controlled-Tester-access checks.

The supplied screenshots are intentionally not committed because they include a full email address and a private application hostname. The sanitized evidence below records only byte size, SHA-256 digest and allowlisted visible claims.

| Evidence | Bytes | SHA-256 | Sanitized result |
| --- | ---: | --- | --- |
| G2-M1 | 66,929 | `3d6e725dee77d5f87f15aa9d2b6a4aba68c182b63dec64bd1446622b06ebc7e4` | PM + UserAdmin Access Requests view loads. |
| G2-M2 | 73,400 | `679d09dfa63f3b65982f0c71f78784c8aa9666df12e88f98ecf3c0adde7ddffb` | Active Users search shows the controlled TESTER active and identity-linked. |
| G2-M3 | 55,527 | `0fa4c5e1917a163603976d0654776340c69e5f43b22bfd6711e4e36a5bf3c580` | Developer Responsibilities read-only tab loads. |
| G2-M4 | 175,481 | `681bf78bd948a707c8885b406daa855da7bc7f88b8da939d7d9c1a04e496146d` | Active Users list is deduplicated and readable. |
| G2-M5 | 44,772 | `56fea400f6ba9d427733acf3b2ea4cb3743f4f74a3d7edc1c0ab76b7c161f2f2` | Controlled TESTER is denied from User Administration with `Forbidden`. |
| G2-M6-blocked | 40,551 | `46953c62cd4fe9bbe664f978f769397a9807b75078e4408dddb11fa6ca09a4c5` | Initial Tester Bug Management check shows the safe platform-starting fallback while HANA readiness is `503`. |
| G2-M6-pass | 197,240 | `f3d0a078fbfc925bc99de4fda3be8124593d15eab305243f3f7b978152f18afe` | After bounded recovery, controlled TESTER renders Bug Management and the session role is `Tester`. |

The manual result above is valid for deployed source `f0818cdf179e0594d7719336973105442b278983`, but a final pre-merge review then found two source/design gaps: incomplete immutable identity could still be labeled `ACTIVE`, and the list omitted the required User Administration capability column. Those gaps are fixed at source head `4d28763dce61392186fa567c8da34633062eac9b`; therefore the earlier runtime/manual PASS must not be treated as acceptance of the remediated head.

## Remediation artifact candidate

Independent source re-review closed both product Majors. A strengthened PM/UserAdmin fixture mutation-check also proves that removing the identity guard makes the capability test fail.

- Remediated source head: `4d28763dce61392186fa567c8da34633062eac9b`.
- Main MTAR: `mta_archives/gate2-4d28763-remediation-main/idts-sap01-gate2-remediation-4d28763.mtar`.
- Main MTAR SHA-256: `51827D0B6C1F807D2A4A763150220D35122D5A40EE231EE93A5832EE8F201110`.
- Dedicated UI MTAR: `mta_archives/gate2-4d28763-remediation-ui/idts-user-admin-ui-gate2-remediation-4d28763.mtar`.
- Dedicated UI MTAR SHA-256: `B28BA137A8C9DDD65A74F65247865833B1B1702A659DB52C83F756C9EAD44228`.
- Packaged CAP `srv/user-admin/active-users.js` SHA-256 equals source: `8864A13C09A5A00BF4F7DF2EA378F14E989F81A36386AC52E1CF48DD913E8250`.
- Dedicated content contains exactly `bug-management-ui.zip` and `user-administration-ui.zip`; the nested Admin view contains both the localized capability header and `activeUsers>userAdminCapability` binding.
- Nested User Administration ZIP SHA-256: `A7051B7DDFEC6423090747AF3F4E7C24DFE3678327FEF8D39E4483425E94480B`.
- Independent artifact review: `0 Critical / 0 Major`; GO only for requesting a separate selective deployment approval.

The main MTAR is a full archive. Any approved redeployment must select only module `idts-sap01-srv`; DB deployer, AppRouter and app-content modules remain excluded. The dedicated UI operation may select only `idts-user-admin-ui-r3c-content` and the existing HTML5 host. Rollback authority remains the previously frozen current-runtime artifacts: main `D9DD3B8D...`, deployed UI `180E7FCC...`, and UI rollback `A7FB892F...`.

The full-repo/module installs emitted existing npm audit/deprecation findings during packaging. No `npm audit fix`, dependency update or lockfile change was made. The first dedicated UI build was rejected before artifact creation because the preceding full build removed its empty generated staging directory; recreating only that directory allowed one successful build. No platform mutation occurred during packaging.

Gate 2 now requires a selective CAP/UI remediation deployment, fresh readiness, and a bounded manual recheck of identity-incomplete state plus the capability column before merge. Gate 3 remains unopened.
