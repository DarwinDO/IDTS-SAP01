# IDTS-112 — Technical Specification EN v0.8 integration and Drive sync

- Owner: DonHV
- Support: SangVN, DatDT, NhanT
- Due: 2026-08-06
- Status: In Progress — local Technical Specification EN v0.8 candidate generated and under final review
- Jira: https://dutassociation.atlassian.net/browse/IDTS-112

## Entry criteria

- IDTS-105 acknowledgment gate satisfied.
- IDTS-106 EN-only cleanup verified.
- IDTS-107, IDTS-108 and IDTS-109 each have a real owner approval in Jira and repo.

## Current integration baseline

- Git baseline: `9202adbf788fa52b309ebabc7560babfbc505dce` from `origin/dev`.
- IDTS-107 production truth: 48 deployable SAP HANA tables and 578 column declarations.
- IDTS-108: current screen/collaboration package and sanitized screenshots integrated.
- IDTS-109: 145-message catalog, development standards and 14-part technical traces integrated.
- IDTS-110 reviewed truth: 38 accepted candidates, 2 held, 135 mapping-only and 13 blocked.
- IDTS-111 reviewed truth: 22 MEETS, 12 DOES_NOT_MEET and 23 BLOCKED.
- Local artifact: `docs/sap490/generated/Technical_Specification_IDTS_SAP01_en_v0.8.xlsx`.
- Local validation: OfficeCLI `1.0.143`, specification pack, quality contract, EN-only/source checks, secret scan, AI DevKit, agent rules and QA Depth self-test PASS. The final 141-page PDF render has no blank/short page, and OfficeCLI reports zero format overflow and zero broken defined names.

## Output

- Technical Specification EN v0.8 generated from the official template.
- 12/12 tabs, natural numbering and complete technical evidence.
- Normal PR merge into `dev`.
- Same-ID Drive update with byte/hash/metadata readback and preview.

No Vietnamese workbook, runtime change, bypass or duplicate Drive file is allowed.

Drive synchronization remains blocked until the candidate PR merges normally into
`dev` and same-ID upload/readback/preview checks pass.
