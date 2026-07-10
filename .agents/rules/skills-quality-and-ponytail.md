---
name: idts-skills-quality-and-ponytail
description: Mandatory skill selection, simplicity gate, code-review routing, and reporting requirements.
applies_to: all code-related work
priority: required
---

# Skills, Quality, and Ponytail

- Apply `karpathy-guidelines` to nontrivial project work: make assumptions explicit, use the smallest correct change, and verify it.
- Use the smallest relevant installed skill, MCP, connector, or project script before introducing a dependency or custom framework.

## Mandatory Ponytail matrix

| Work | Required skill |
| --- | --- |
| Read, answer, design, write, refactor, or debug code | `ponytail` |
| Review a diff/PR for simplicity | `ponytail` and `ponytail-review` |
| Audit a repository or scope for complexity | `ponytail` and `ponytail-audit` |
| Inspect deferred shortcuts marked `ponytail:` | `ponytail-debt` |

- Run the Ponytail ladder only after understanding the real flow. Reuse existing helpers, standard library, native platform features, and installed dependencies before adding code.
- Never simplify away validation, data-loss prevention, security, accessibility, explicitly requested behavior, or a focused regression check.
- Code handoffs and PR evidence must name the Ponytail skill(s) used, the simplification selected, what was deliberately not built, and verification evidence.
- Report every skill/MCP/connector used, its purpose, result, and limitation in the final handoff. If no MCP was used, say so.
