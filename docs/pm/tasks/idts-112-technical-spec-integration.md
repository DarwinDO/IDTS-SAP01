# IDTS-112 — Technical Specification EN v0.8 integration and Drive sync

- Owner: DonHV
- Support: SangVN, DatDT, NhanT
- Due: 2026-08-06
- Status: Done — Technical Specification EN v0.8 merged, synchronized to the official same-ID Drive artifact, and read back successfully
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

## Completion evidence

- PR: https://github.com/DarwinDO/IDTS-SAP01/pull/285
- Merge SHA: `07c5f50851c56a0cbcf229e8b01744febf2a86f5`
- Official Drive file ID: `1nAmUQb3852G4-hxJ0BOK6OHGLDs6Kq1P`
- Drive artifact: `SU26SAP01_GSU26SAP01_Technical_Specification_EN_v0_8_20260804.xlsx`
- Local and Drive readback SHA-256: `4EB60BE650B6247F5A8726B1F11E025BF2909009A737C0A968FBB2D786BDBA0F`
- Same parent, XLSX MIME type and permissions were preserved; no duplicate was created.
- Drive preview exposed all 12 tabs. Technical Design, Message Definition and Technical Implementation were opened and visually checked.
- Detailed readback: `docs/pm/evidence/idts-112/drive-sync-verification-20260804.md`.

Blocked, held and mapping-only IDTS-110/111 cases remain represented as such and were not promoted to PASS.
