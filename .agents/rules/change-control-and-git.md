---
name: idts-change-control-and-git
description: Surgical changes, dedicated branches, canonical-document synchronization, and safe repository operations.
applies_to: all nontrivial implementation, docs, PM, BA, and tool work
priority: required
---

# Change Control and Git

- Use a dedicated branch before nontrivial work: `<type>/<jira-key-or-task-id>-<short-task-slug>-<member>`.
- Preserve user changes and dirty worktrees. Do not reset, overwrite, delete, or move user files without first proving a safe path and preserving recoverable content.
- Work from the current upstream baseline when a stale worktree would hide implemented work or evidence.
- Make surgical changes only; do not reformat unrelated files or rewrite business documents wholesale.
- For business/domain changes, synchronize canonical business docs, relevant diagrams, BA/PM records, and knowledge notes in the same work item.
- Before completion, verify the exact requested behavior, run `git diff --check`, and report remaining risks honestly.
- Before `git worktree remove`, enumerate reparse points inside the exact worktree. If any dependency junction exists, detach junction objects non-recursively, prove every junction target still exists, and only then remove/prune the worktree. Never use force or recursive deletion to bypass an attached junction.
