# Candidate Manifest Template

Create one manifest for every SAP490 XLSX candidate. Store no credential, token, private endpoint, or sensitive personal data.

## Identity

- Artifact/deliverable:
- Executing member:
- Baseline Git SHA:
- Candidate path:
- Candidate SHA-256:
- Generated at:

## Authoritative reference

- Drive file ID:
- Name:
- Parent/folder:
- MIME type:
- Modified/version metadata:
- Downloaded raw XLSX SHA-256:
- Retrieval timestamp:

## Approved write scope

| Tab | Allowed ranges | Intended content change | DonHV decision |
| --- | --- | --- | --- |

## Source and evidence map

| Tab/range | Claim/content | Code/doc/evidence source | Verified at SHA |
| --- | --- | --- | --- |

## Reference baseline issues

| Tool/renderer | Tab/range | Exact warning | Pre-existing? | Candidate touched range? | Disposition |
| --- | --- | --- | --- | --- | --- |

Never use a workbook-wide waiver. Every warning needs a precise tab/range and disposition.

## Validation matrix

| Gate | Tool/version | Result | Evidence/notes |
| --- | --- | --- | --- |
| OfficeCLI validate | | | |
| OfficeCLI view issues | | | |
| Policy validator | | | |
| Excel/Office preview | | | |
| LibreOffice PDF | | | |
| English/secret/token scan | | | |
| Formula/defined-name scan | | | |

## Approval and release

- DonHV approved exact candidate hash:
- Approved tabs/ranges:
- Approval date/reference:
- Local current artifact replaced: No/Yes + hash
- Drive same-ID updated: No/Yes
- Drive readback SHA-256:
- Remaining limitation:
