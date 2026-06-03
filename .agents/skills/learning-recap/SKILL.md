---
name: learning-recap
description: Use after a nontrivial IDTS task when the user asks for "learning recap", "mentor mode", "teach me what you did", or wants to understand SAP, CAP, Fiori/UI5, BA/PM, SAP490, workflow, architecture, documentation, tool setup, or project decisions. Turns the completed task into an incremental teach-back session with explanation, impact analysis, user recall, correction, and quiz.
---

# Learning Recap / Mentor Mode

Use this skill after a meaningful task is complete, or when the user explicitly asks to learn what happened. The goal is not to repeat the final report. The goal is to help the user understand the problem, solution, reasoning, and project impact.

Vietnamese: Dùng skill này sau khi hoàn tất task đáng kể, hoặc khi user yêu cầu học lại những gì vừa diễn ra. Mục tiêu không phải lặp lại báo cáo cuối, mà là giúp user hiểu vấn đề, giải pháp, lý do chọn hướng xử lý và tác động tới project.

## When To Use

Use this skill for:

- SAP/CAP/Fiori/UI5 concepts or code changes.
- BA/PM decisions, scope, workflow, status, role, or ownership changes.
- BRD/SRS/FRS, SAP490 deliverables, Google Workspace sync, DOCX/XLSX tooling, or template work.
- Complex debugging, setup, architecture, data model, service, handler, Fiori annotation, or UI behavior work.
- Any user request such as `learning recap`, `mentor mode`, `teach me`, `explain what you did`, or `check if I understood`.

Vietnamese:

- Khái niệm hoặc thay đổi liên quan SAP/CAP/Fiori/UI5.
- Quyết định BA/PM, scope, workflow, status, role hoặc ownership.
- BRD/SRS/FRS, deliverable SAP490, Google Workspace sync, DOCX/XLSX tooling hoặc template.
- Debug/setup/architecture/data model/service/handler/Fiori annotation/UI behavior phức tạp.
- Bất kỳ yêu cầu nào như `learning recap`, `mentor mode`, `teach me`, `explain what you did`, hoặc `check if I understood`.

Do not use it for tiny one-line factual answers unless the user explicitly asks.

Vietnamese: Không dùng cho câu trả lời sự kiện một dòng rất nhỏ, trừ khi user yêu cầu rõ.

## Teaching Flow

Teach incrementally. Do not dump everything at once.

1. **Frame the task**: What was the original problem or need?
2. **Explain the context**: Which project files, SAP concepts, tools, or constraints mattered?
3. **Walk through the solution**: What changed or what was decided?
4. **Explain why**: Why this approach instead of obvious alternatives?
5. **Explain impact**: What parts of IDTS, SAP490, CAP/Fiori, PM docs, or future work are affected?
6. **Check understanding**: Ask the user to explain one key part back in their own words.
7. **Correct and fill gaps**: Point out missing or incorrect understanding.
8. **Quiz lightly**: Ask 2-5 questions, mixing open-ended, multiple-choice, or scenario questions.
9. **Close with next learning target**: Suggest what the user should understand next.

Vietnamese:

1. **Đặt lại task**: Vấn đề hoặc nhu cầu ban đầu là gì?
2. **Giải thích context**: File, khái niệm SAP, tool hoặc constraint nào quan trọng?
3. **Đi qua giải pháp**: Đã thay đổi hoặc quyết định gì?
4. **Giải thích lý do**: Vì sao chọn hướng này thay vì hướng khác?
5. **Giải thích tác động**: Phần nào của IDTS, SAP490, CAP/Fiori, PM docs hoặc việc sau này bị ảnh hưởng?
6. **Kiểm tra hiểu**: Yêu cầu user giải thích lại một phần quan trọng bằng lời của họ.
7. **Sửa và bổ sung**: Chỉ ra phần thiếu hoặc hiểu sai.
8. **Quiz nhẹ**: Hỏi 2-5 câu gồm câu mở, trắc nghiệm hoặc tình huống.
9. **Kết bằng mục tiêu học tiếp theo**: Gợi ý phần user nên hiểu tiếp.

## Output Shape

For the first learning response, keep it short and ask for teach-back before continuing:

```text
Learning Recap - Part 1

1. Original problem:
2. What I changed/decided:
3. Why this matters:

Your turn:
Please explain back [one specific concept] in your own words. Then I will correct gaps and continue to Part 2.
```

Vietnamese: Với phản hồi học đầu tiên, giữ ngắn và yêu cầu user giải thích lại trước khi tiếp tục.

## Quiz Rules

- Do not reveal answers before the user answers.
- Keep questions tied to the actual task.
- Prefer practical IDTS scenarios over generic textbook questions.
- After the user answers, give direct feedback: correct, partially correct, or incorrect, then explain why.

Vietnamese:

- Không tiết lộ đáp án trước khi user trả lời.
- Câu hỏi phải gắn với task thật.
- Ưu tiên tình huống thực tế của IDTS thay vì câu hỏi giáo khoa chung chung.
- Sau khi user trả lời, feedback trực tiếp: đúng, đúng một phần hoặc sai, rồi giải thích lý do.

## Knowledge Notes

If the recap introduces durable SAP/project knowledge that will help the user later, add or update `docs/knowledge/` according to `AGENTS.md`. Do not save generic learning transcripts or one-off quiz answers.

Vietnamese: Nếu recap tạo ra kiến thức SAP/project bền vững có ích về sau, hãy thêm hoặc cập nhật `docs/knowledge/` theo `AGENTS.md`. Không lưu transcript học chung chung hoặc câu trả lời quiz dùng một lần.
