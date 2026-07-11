# IDTS Formal Figure Manifest

This manifest maps the figures used by the BRD, SRS, and FRS to their editable draw.io source and reviewer-friendly output. The repository is authoritative; Drive copies are review/distribution copies only.

| Document | Figure | Editable source | Reviewer output |
| --- | --- | --- | --- |
| BRD | 01 System Context | `drawio/01-system-context.drawio` | `review/png/01-system-context.png`, PDF, SVG |
| BRD | 03 Use Cases | `drawio/03-use-case.drawio` | `review/png/03-use-case.png`, PDF, SVG |
| BRD | 04 End-to-End Flow | `drawio/04-end-to-end-defect-flow.drawio` | `review/png/04-end-to-end-defect-flow.png`, PDF, SVG |
| SRS | 13 System Context | `drawio/13-srs-system-context.drawio` | `review/png/13-srs-system-context.png`, PDF, SVG |
| SRS | 02 CAP/Fiori Architecture | `drawio/02-cap-fiori-architecture.drawio` | `review/png/02-cap-fiori-architecture.png`, PDF, SVG |
| SRS | 09 Conceptual Data Model | `drawio/09-conceptual-data-model.drawio` | `review/png/09-conceptual-data-model.png`, PDF, SVG |
| FRS | 14–21 Functional Flows | `drawio/14-*.drawio` through `drawio/21-*.drawio` | Matching files under `review/png`, `review/pdf`, and `review/svg` |

## Editing and review rule

- Open `.drawio` in draw.io to edit shapes, labels, and connectors.
- Use PNG or PDF for Google Drive preview and mentor reading.
- SVG is a sanitized review export; it is not editable and is not the primary Drive preview format.
- If a business rule changes, update the canonical Mermaid/PlantUML trace source and the matching draw.io figure in the same work item.
