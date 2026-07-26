# IDTS-104 repository cleanup evidence

## Frozen baseline

- Git commit: `ad498f93721e838196b03e9566c71f2b24b04bc4`
- Annotated archive tag: `sap490-generated-archive-20260726`
- Google Drive: not changed by this task
- CAP/Fiori runtime: not changed by this task

## Generated artifact curation

- Before: 87 DOCX/XLSX files, 47,922,856 bytes in `docs/sap490/generated/`.
- Archived/removed from current tree: 61 files, 39,063,050 bytes.
- After: 26 current DOCX/XLSX files, including all versions explicitly approved by IDTS-104.
- Recovery proof: every archived file has SHA-256 and Git blob in `docs/sap490/generated-archive-manifest-20260726.md`.

## Local cleanup

- Safe dry-run and apply target count: 8 exact paths/items.
- Removed bytes: 443,166,353.
- Removed categories: `.tmp/`, `logs/`, `/tmp/`, `/output/`, raw `scripts/qa/uat-evidence/`, and root `.tmp-*.log` files.
- Post-cleanup dry-run: `TARGETS=0`, `BYTES=0`.
- Preserved: `.git/`, `node_modules/`, Playwright browser/session directories, `db.sqlite*`, private config and official templates.

Before removing raw UAT output, seven screenshots were copied to `docs/pm/evidence/idts-104/legacy-uat-baseline/` and labeled as historical rather than current acceptance.

## Commands

```text
officecli --version
python scripts/sap490/generate-generated-archive-manifest.py
python scripts/sap490/curate-generated-artifacts.py
node scripts/maintenance/clean-local-artifacts.js --root E:\IDTS-SAP01
node scripts/maintenance/clean-local-artifacts.js --root E:\IDTS-SAP01 --apply
```

OfficeCLI preflight result: `1.0.141`.

## Verification results

- OfficeCLI schema validation: 26/26 current DOCX/XLSX artifacts PASS.
- Specification pack: Functional 9/9 tabs, Technical 12/12 tabs, Configuration 5/5 tabs and Blueprint official-template contract PASS.
- Specification quality contract: PASS (97.5 seconds when run independently).
- Blueprint v0.6: 3 official sections, 8 template core tables, EN/VI table parity 18/18, style/version/placeholder/BP coverage PASS.
- Test pack: 12/12 workbooks, 27 cases, 32 requirements, 12 defects, zero warning/error.
- Template fidelity and evidence contract: PASS.
- Mentor Q&A: 30 mentor-to-team questions, 15 team-to-mentor questions and zero broken local references.
- Repository gates: agent rules 8/8, ownership runner 5/5, QA Depth self-test 15/15, secret scan PASS, AI DevKit 5/5, `git diff --check` PASS.
- Root cleanup recheck: `TARGETS=0`, `BYTES=0`.

## Limitations

- Removing files from the current tree does not shrink existing `.git` history.
- Historical UAT screenshots do not prove the current Shared QA baseline.
- This cleanup does not delete or rename any Google Drive artifact.
- The seven curated screenshots are historical UI baseline evidence, not current Shared QA acceptance.
