---
name: idts-ownership-learning-and-debug
description: Optional code ownership learning, beginner debugging, and user-requested learning recap guidance.
applies_to: user-requested learning, mentor mode, beginner debugging, source comments, and ownership guidance
priority: optional
---

# Ownership, Optional Learning, and Debugging

## Ownership reference

- Effective from **2026-07-13** in the Asia/Bangkok timezone for DonHV, DatDT, SangVN, and NhanT.
- Use `docs/learning/ownership-map.md` as the source of truth for file ownership, backup ownership, and flow ownership.
- File ownership answers who maintains a file. Flow ownership answers who can trace a real request from UI through OData/CAP to persistence or an external integration.
- Use these ownership records as guidance for learning and collaboration, not as a prerequisite for normal task execution.

## Opt-in learning only

Learning is opt-in. Start this workflow only when the user explicitly asks to learn, requests mentor mode, asks for a walkthrough or quiz, or wants their understanding checked.

- Do not start a Knowledge Gate automatically at task start or because a calendar day changed.
- Do not score the user or require PASS/FAIL evidence unless the user explicitly asks for a scored exercise.
- Missing learning evidence must never block implementation, task completion, PR creation/merge, or a Jira transition.
- The PR template and QA Depth validator do not require Ownership Knowledge Gate or Learning Material Bootstrap sections.
- Historical learning records remain valid learning evidence but do not create current enforcement.

## User-requested learning path

1. Ask which concept or flow the user wants to understand.
2. Explain the purpose and business context first.
3. Show the first relevant file, caller and dependency.
4. Trace UI to OData/CAP to persistence or external integration when applicable.
5. For debugging practice, use hint, first file, first breakpoint, variables, data effect and failure path.
6. Ask for teach-back or a quiz only when the user requests practice or assessment.
7. Store sanitized learning notes only when the user asks for a durable record.

The existing `npm run learning:gate -- ...` selector may be used as an optional quiz helper when the user explicitly requests it. Its result is learning feedback, not release authorization.

## Optional learning material

- Reuse existing ownership maps, knowledge notes and Debug Labs before creating another artifact.
- Create or update dedicated learning material only when the user explicitly requests a durable learning record. The independent source knowledge-mirror rule still applies when source files change.
- New repository learning Markdown is bilingual: English first, then Vietnamese with equivalent depth.
- Keep code identifiers, APIs, entities and SAP/CAP/Fiori terms exact. Never include secrets, credentials, private endpoints or personal data.
- Debug Labs requested by the user are beginner-first: action, request, first breakpoint, execution order, variables, data effect and failure path. Add teach-back only when requested.

## Tiếng Việt

- Áp dụng từ **13/07/2026** theo múi giờ Asia/Bangkok cho DonHV, DatDT, SangVN và NhanT.
- `docs/learning/ownership-map.md` là nguồn chính về file owner, backup owner và flow owner.
- File ownership trả lời ai bảo trì file. Flow ownership trả lời ai có thể lần theo request thật từ UI qua OData/CAP đến database hoặc integration.
- Dùng ownership map làm hướng dẫn học và phối hợp, không làm điều kiện để bắt đầu hoặc hoàn thành task.
- Việc học là opt-in: chỉ bắt đầu khi user chủ động yêu cầu học, mentor mode, walkthrough, quiz hoặc kiểm tra mức hiểu.
- Không tự chạy Knowledge Gate theo ngày, không tự chấm PASS/FAIL và không yêu cầu evidence học tập.
- Thiếu learning evidence không được chặn implementation, task completion, tạo/merge PR hoặc Jira transition.
- PR template và QA Depth validator không yêu cầu section Ownership Knowledge Gate hoặc Learning Material Bootstrap.
- Evidence học tập lịch sử được giữ nguyên để tham khảo, nhưng không tạo enforcement hiện tại.

Khi user yêu cầu học: hỏi concept/flow cần hiểu; giải thích mục đích và context; chỉ ra file/caller/dependency đầu tiên; trace UI qua OData/CAP đến persistence hoặc integration; nếu luyện debug thì đi theo hint → file đầu → breakpoint đầu → variable/data effect/failure path. Chỉ yêu cầu teach-back hoặc quiz khi user muốn luyện tập hoặc được đánh giá.

Lệnh `npm run learning:gate -- ...` vẫn có thể dùng làm helper quiz tùy chọn khi user yêu cầu rõ. Kết quả chỉ là feedback học tập, không phải quyền release.

Ưu tiên dùng lại ownership map, knowledge note và Debug Lab đã có. Chỉ tạo/cập nhật learning material riêng khi user yêu cầu lưu tài liệu học bền vững; rule knowledge mirror độc lập vẫn áp dụng khi source thay đổi. Learning Markdown mới phải song ngữ tương đương, giữ nguyên identifier kỹ thuật và không chứa secret, endpoint private hoặc dữ liệu cá nhân. Debug Lab do user yêu cầu phải bắt đầu từ action, request, breakpoint đầu, execution order, variable, data effect và failure path; chỉ thêm teach-back khi user muốn.
