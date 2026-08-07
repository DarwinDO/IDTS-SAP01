# IDTS-125 — Bug mutation authorization

Owner: SangVN
Support: DonHV / Tester QA
Due: 2026-08-08
Status: In Progress (implementation verified; Knowledge Gate PASS; PR/merge pending)

## Scope and decision

CAP and Fiori must distinguish comment access, Bug-field edit access, edit-shell access, and attachment mutation. Non-assignee Developers are read/comment only. Assigned Developers may comment, manage attachments, and use permitted lifecycle actions, but Bug business fields remain read-only. Tester/PM retain documented coordination/edit permissions. Closed Bugs remain immutable.

Vietnamese: CAP va Fiori tach quyen comment, sua field Bug, mo edit shell va mutate attachment. Developer khong phai assignee chi doc/comment. Developer assignee duoc comment, quan ly attachment va dung lifecycle action duoc phep, nhung field nghiep vu Bug read-only. Tester/PM giu quyen dieu phoi/edit da mo ta. Bug Closed van immutable.

## Implementation

- Guard active UPDATE and draft EDIT/PATCH/SAVE in CAP.
- Guard attachment create/update/delete using role plus current assignee mapping.
- Keep comments available to all active Tester/Developer/PM users on open Bugs.
- Split `canEdit`, `canManageAttachments`, and dynamic required/optional Bug field controls in the read model and Fiori annotations.
- Add `qa:idts125:programmatic` with role, assignee, persistence/no-mutation, and UI contract checks.

## Evidence state

- Red regression observed before the fix: assigned Developer direct Bug-field update unexpectedly succeeded; non-assignee route was not guaranteed to return the required ownership 403.
- Focused test after implementation and fail-closed actor hardening: `qa:idts125:programmatic` PASS 12/12.
- Impacted regression: IDTS-41 18/18, IDTS-43 12/12, IDTS-122 closed PASS, IDTS-122 retest-owner 53/53, IDTS-116 PASS, IDTS-73 PASS, comment persistence PASS.
- Syntax checks, CAP compile, UI5 build, secret scan, agent-rule check and `git diff --check` PASS. UI5 build required restoring the already-declared zipper locally without manifest/lock changes. Node 24 remains outside the declared Node 20–22 engine range.
- Production dependency audit found pre-existing transitive advisories; remediation is outside IDTS-125 and must not use a breaking forced update here.
- Jira: [IDTS-125](https://dutassociation.atlassian.net/browse/IDTS-125), related to IDTS-2.
- Ownership Knowledge Gate retest PASS 6/6 on 2026-08-06 with Critical/Debug/Teach-back PASS; Jira comment `11000`. Normal PR review, merge and final evidence remain before Jira Done.
