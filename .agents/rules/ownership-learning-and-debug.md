---
name: idts-ownership-learning-and-debug
description: Mandatory code ownership, beginner debugging, learning recap, and knowledge-gate rules.
applies_to: all nontrivial IDTS tasks, PRs, Jira transitions, source comments, and member learning
priority: required
---

# Ownership, Learning, and Debug Gate

## Effective baseline

- Effective from **2026-07-13** in the Asia/Bangkok timezone for DonHV, DatDT, SangVN, and NhanT.
- Use `docs/learning/ownership-map.md` as the source of truth for file ownership, backup ownership, and flow ownership.
- File ownership answers who maintains a file. Flow ownership answers who can trace a real request from UI through OData/CAP to persistence or an external integration.
- Do not use a front-end/backend boundary as an excuse for being unable to explain an end-to-end flow.

## Required task-start Knowledge Gate

Before the first nontrivial task of a calendar day, the executing member must complete the Knowledge Gate for the task's relevant ownership flow.

- Start on 2026-07-13 with three questions and zero historical debt.
- Add one question for each calendar day without an ownership-code activity after the most recent passing task. Cap the first gate at seven questions.
- When a later task on the same day enters a different ownership flow, ask two additional flow-specific questions.
- Questions must test purpose, caller/dependency, end-to-end request trace, breakpoint/root-cause reasoning, data effect, or authorization/security. Do not test line-number trivia or syntax memorization.
- Record the date, flow, question count, score, critical answers, debug exercise, teach-back result, and safe evidence path in the member progress file.

## PASS, FAIL, and mentoring

PASS requires all of the following:

- At least 80 percent score.
- Every security, authorization, and data-integrity question is correct.
- The member traces at least one relevant IDTS flow.
- The member performs one real or controlled debug exercise.
- The member explains the result back in their own words.

On FAIL:

- The member may continue learning and work under supervision.
- The agent must use mentor mode: give a hint, then the first file, then the first breakpoint, then a walkthrough only if needed.
- The agent must not mark the task PASS, transition the Jira issue to Done, or merge a PR until a new equivalent retest passes.
- Do not reveal a complete canned answer before the member has attempted a teach-back.

## PR and Jira evidence

- Every PR opened or merged on/after 2026-07-13 must complete the `Ownership Knowledge Gate` PR-body section.
- The PR check must reject missing evidence, a score below 80 percent, or any `FAIL` critical/debug/teach-back result.
- Before transitioning a Jira issue to Done, the agent and DonHV must find a Jira comment with `Ownership Knowledge Gate: PASS`, the PR/evidence link, and a matching progress entry.
- Jira workflow configuration cannot technically prevent a manual administrator bypass; the agent must still refuse the transition when evidence is missing.

## Source comments and mirrors

- Retrofit all 72 runtime JS/CDS/XML/HTML/CSS files under `app/`, `srv/`, and `db/`; exclude generated output, tests, seed CSV, properties, JSON, and private/config files.
- Source comments are concise Vietnamese UTF-8 comments. Keep code identifiers, APIs, entity names, and SAP/CAP/Fiori terms unchanged.
- Explain a file's purpose, non-obvious function trigger/input/output/side effect, business-rule rationale, transaction/security boundary, dependency, or debug anchor.
- Do not comment obvious imports, assignments, or every line. Do not add comments that can appear in the user interface or expose secrets/private infrastructure.
- Every touched source mirror must add the equivalent bilingual ownership/debug explanation: primary owner, backup owner, flow, breakpoint anchor, linked files, and safe-editing impact.

## English and Vietnamese teaching material

- New repository learning Markdown is bilingual: English first, then Vietnamese with equivalent depth.
- Source-code comments use Vietnamese only by the approved team decision.
- Debug Labs must be beginner-first: action, request, breakpoint, expected execution order, variables to inspect, data effect, failure path, and teach-back.

## Vietnamese

- Áp dụng từ **13/07/2026** theo múi giờ Asia/Bangkok cho DonHV, DatDT, SangVN và NhanT.
- `docs/learning/ownership-map.md` là nguồn chính về file owner, backup owner và flow owner.
- File ownership trả lời ai bảo trì file. Flow ownership trả lời ai có thể lần theo request thật từ UI qua OData/CAP đến database hoặc integration.
- Không được dùng ranh giới FE/BE làm lý do để không giải thích được luồng end-to-end.

Trước task không tầm thường đầu tiên trong ngày, member phải vượt Knowledge Gate theo flow liên quan. Ngày 13/07 bắt đầu ba câu, không tính nợ lịch sử; mỗi ngày lịch không có ownership-code activity cộng một câu, tối đa bảy câu. Nếu cùng ngày chuyển qua flow khác, hỏi thêm hai câu của flow đó.

PASS cần tối thiểu 80%, đúng toàn bộ câu security/authorization/data integrity, trace được một flow, làm debug exercise và teach-back bằng lời của mình. FAIL vẫn được học và code có hướng dẫn, nhưng không được PASS task, merge PR hay Jira Done trước khi retest tương đương đạt.

Comment source chỉ dùng tiếng Việt ngắn gọn cho mục đích, rule khó, side effect, dependency và breakpoint. Không comment từng dòng hiển nhiên. Knowledge mirror và Debug Lab vẫn song ngữ, giải thích đầy đủ cho người mới.
