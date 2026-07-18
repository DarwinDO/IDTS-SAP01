---
name: idts-ownership-learning-and-debug
description: Mandatory code ownership, beginner debugging, learning recap, and knowledge-gate rules.
applies_to: all nontrivial IDTS tasks, PRs, Jira transitions, source comments, and member learning
priority: required
---

# Ownership, Learning, and Debug Gate

## English

### Effective baseline

- Effective from **2026-07-13** in the Asia/Bangkok timezone for DonHV, DatDT, SangVN, and NhanT.
- Use `docs/learning/ownership-map.md` as the source of truth for file ownership, backup ownership, and flow ownership.
- File ownership answers who maintains a file. Flow ownership answers who can trace a real request from UI through OData/CAP to persistence or an external integration.
- A front-end/back-end boundary is not a reason for being unable to explain an end-to-end flow.

### Material-quality pause

- A Knowledge Gate must be marked `PAUSED — material quality defect`, not FAIL, when the approved material omits important blocks, names the wrong symbol, skips a file transition, or cannot guide a beginner to a real breakpoint.
- While paused, the member may learn with mentor guidance. The gate is not scored and cannot be used as PASS evidence.
- Resume assessment only after the material remediation is merged and IDTS-86 verifies it against the real source.

### Required task-start Knowledge Gate

Before the first nontrivial task of a calendar day, the executing member completes the gate for the relevant ownership flow.

- Start with three questions and no historical debt on 2026-07-13.
- Add one question for each calendar day without an ownership-code activity after the most recent passing task, capped at seven questions.
- Add two flow-specific questions when a later task on the same day enters another ownership flow.
- Test purpose, caller/dependency, request trace, breakpoint/root-cause reasoning, data effects, authorization, or security. Do not test line numbers or syntax memorization.
- `npm run learning:gate -- <member> <flow> YYYY-MM-DD [last-activity|-] [additional]` selects a reproducible question set only. A human or mentoring agent still assesses the answers, real debug exercise, and teach-back.
- Record date, flow, question count, score, critical answers, debug exercise, teach-back, result, and safe evidence path under `docs/learning/progress/`.

### Initial learning-material bootstrap exception

An agent may prepare learning material before the human owner is assessed on it.

- A bootstrap PR may merge before the member gate only when it changes source comments and matching knowledge mirrors and changes no runtime behavior, schema, service contract, manifest behavior, test, dependency, or configuration.
- The PR body declares `Learning Material Bootstrap`, learner, follow-up Jira issue, and `Runtime behavior changed: NO`.
- The member studies the merged material, then performs a gate, a real debug exercise, and a teach-back before later technical work can receive PASS.
- This exception never applies to a feature, bug fix, refactor, security change, or mixed behavior/documentation PR.

### PASS, FAIL, and mentoring

PASS requires all of the following:

- score of at least 80 percent;
- every security, authorization, and data-integrity question correct;
- one relevant end-to-end IDTS flow traced;
- one real or controlled debug exercise completed;
- a teach-back in the member's own words.

On FAIL, the member may continue learning and supervised work. Mentor mode reveals help gradually: first a hint, then the first file, then the first breakpoint, then a full walkthrough only when still needed. Do not merge a behavior PR or transition Jira Done until an equivalent retest passes. Do not reveal a canned full answer before the learner attempts the teach-back.

### Source-comment quality

- Retrofit the frozen 72-file inventory in `docs/learning/runtime-comment-retrofit.md`.
- Source comments use concise Vietnamese UTF-8 while identifiers, APIs, entities, and SAP/CAP/Fiori terms remain unchanged.
- Every non-obvious entry point or decision block must explain the relevant trigger/caller, purpose, important input, decision, output/side effect, next dependency, and breakpoint.
- A generic file header alone does not pass.
- Do not comment obvious imports, braces, assignments, or syntax. Do not add comments that can appear in the UI or reveal secrets/private infrastructure.
- JSON/properties files that cannot contain comments must be fully explained by their mirror and cross-file map.

### Knowledge-mirror quality

Each bilingual mirror must contain equivalent English and Vietnamese coverage for:

- a beginner mental model;
- caller -> current symbol -> callee;
- a walkthrough anchored by real function/symbol names;
- input, output, side effect, and why the block exists;
- cross-folder links naming the exact file and symbol;
- request lifecycle and database/external boundary;
- breakpoint order, variables to inspect, and expected execution order;
- failure path and safe-edit impact.

Line numbers may be supplementary but cannot be the primary anchor. QA must verify named symbols and flow claims against the actual source.

### Debug Labs

Every Debug Lab is beginner-first and includes: exact UI action, Browser Network request, first file/function, next breakpoint sequence, variables to inspect, database/external effect, one safe failure exercise, and teach-back prompts. A lab that skips a file transition or refers to a nonexistent symbol fails material QA.

### PR and Jira evidence

- Every relevant PR opened or merged on/after 2026-07-13 completes the `Ownership Knowledge Gate` section, except a valid learning-material bootstrap PR.
- The PR check rejects missing evidence, score below 80 percent, or any FAIL critical/debug/teach-back result.
- Before Jira Done, find a Jira comment with `Ownership Knowledge Gate: PASS`, the PR/evidence link, and a matching progress entry.
- Jira administrators can technically bypass workflow evidence; agents must still refuse an unsupported transition.

## Vietnamese

### Mốc áp dụng

- Áp dụng từ **13/07/2026** theo múi giờ Asia/Bangkok cho DonHV, DatDT, SangVN và NhanT.
- Dùng `docs/learning/ownership-map.md` làm nguồn chính về file owner, backup owner và flow owner.
- File ownership trả lời ai bảo trì file. Flow ownership trả lời ai có thể lần theo request thật từ UI qua OData/CAP đến database hoặc external integration.
- Không được dùng ranh giới FE/BE làm lý do để không giải thích được luồng end-to-end.

### Tạm dừng do chất lượng tài liệu

- Knowledge Gate phải ghi `PAUSED — material quality defect`, không ghi FAIL, nếu tài liệu được duyệt bỏ sót khối quan trọng, ghi sai symbol, skip điểm chuyển file hoặc không giúp người mới đặt được breakpoint thật.
- Trong thời gian PAUSED, member vẫn được học với mentor. Gate không được chấm điểm và không được dùng làm evidence PASS.
- Chỉ đánh giá lại sau khi material remediation đã merge và IDTS-86 đối chiếu đạt với source thật.

### Knowledge Gate đầu ngày

Trước task không tầm thường đầu tiên của ngày, member làm gate của ownership flow liên quan.

- Ngày 13/07/2026 bắt đầu ba câu, không tính nợ lịch sử.
- Sau lần PASS gần nhất, mỗi ngày không có ownership-code activity cộng một câu, tối đa bảy câu.
- Nếu trong cùng ngày chuyển sang flow khác thì thêm hai câu riêng của flow đó.
- Câu hỏi kiểm tra mục đích, caller/dependency, request trace, breakpoint/root cause, data effect, authorization hoặc security; không hỏi thuộc line number hay cú pháp.
- Lệnh `npm run learning:gate -- <member> <flow> YYYY-MM-DD [last-activity|-] [additional]` chỉ chọn bộ câu hỏi ổn định. Người hoặc agent mentor vẫn phải đánh giá câu trả lời, debug thật và teach-back.
- Ghi ngày, flow, số câu, điểm, critical answer, debug exercise, teach-back, kết quả và evidence path an toàn trong `docs/learning/progress/`.

### Ngoại lệ bootstrap tài liệu học ban đầu

Agent được chuẩn bị tài liệu học trước khi đánh giá human owner trên chính tài liệu đó.

- PR bootstrap chỉ được merge trước gate khi diff chỉ có source comment và knowledge mirror tương ứng; không đổi runtime behavior, schema, service contract, manifest behavior, test, dependency hoặc config.
- PR body phải khai báo `Learning Material Bootstrap`, learner, Jira follow-up và `Runtime behavior changed: NO`.
- Sau khi material merge, member phải học, làm gate, debug thật và teach-back trước khi technical work tiếp theo được PASS.
- Ngoại lệ không áp dụng cho feature, bug fix, refactor, security change hoặc PR trộn behavior với documentation.

### PASS, FAIL và mentor mode

PASS cần đủ tất cả:

- điểm tối thiểu 80%;
- đúng mọi câu security, authorization và data integrity;
- trace được một flow IDTS end-to-end liên quan;
- hoàn tất một debug exercise thật hoặc có kiểm soát;
- teach-back bằng lời của chính member.

Khi FAIL, member vẫn được học và làm việc có giám sát. Mentor mode chỉ mở dần trợ giúp: hint trước, rồi file đầu tiên, rồi breakpoint đầu tiên, cuối cùng mới walkthrough đầy đủ nếu vẫn cần. Không merge behavior PR hoặc chuyển Jira Done trước khi retest tương đương đạt. Không đưa đáp án mẫu đầy đủ trước khi người học thử teach-back.

### Chất lượng source comment

- Retrofit đúng inventory 72 file trong `docs/learning/runtime-comment-retrofit.md`.
- Source comment dùng tiếng Việt UTF-8 ngắn gọn; identifier, API, entity và thuật ngữ SAP/CAP/Fiori giữ nguyên.
- Mỗi entry point hoặc decision block không hiển nhiên phải giải thích các ý phù hợp: trigger/caller, mục đích, input quan trọng, quyết định, output/side effect, dependency tiếp theo và breakpoint.
- Chỉ có comment chung ở đầu file thì không đạt.
- Không comment import, dấu ngoặc, phép gán hoặc cú pháp hiển nhiên. Không thêm comment có thể hiện ra UI hoặc làm lộ secret/hạ tầng private.
- JSON/properties không chèn được comment phải được giải thích đầy đủ trong mirror và cross-file map.

### Chất lượng knowledge mirror

Mỗi mirror song ngữ phải có English và Vietnamese đầy đủ tương đương về:

- mô hình tư duy cho người mới;
- caller -> symbol hiện tại -> callee;
- walkthrough theo function/symbol thật;
- input, output, side effect và lý do khối code tồn tại;
- liên kết khác folder, ghi đúng file và symbol;
- request lifecycle và database/external boundary;
- thứ tự breakpoint, biến cần xem và thứ tự chạy mong đợi;
- failure path và ảnh hưởng khi sửa.

Line number chỉ là thông tin phụ, không được làm anchor chính. QA phải đối chiếu symbol và flow claim với source thật.

### Debug Lab

Mỗi Debug Lab phải cầm tay chỉ việc cho người mới: thao tác UI chính xác, request thấy trong Browser Network, file/function đầu tiên, chuỗi breakpoint tiếp theo, biến cần xem, tác động database/external, một failure exercise an toàn và câu hỏi teach-back. Lab skip điểm chuyển file hoặc ghi symbol không tồn tại thì không đạt material QA.

### Evidence PR và Jira

- Mỗi PR liên quan mở hoặc merge từ 13/07/2026 phải hoàn tất phần `Ownership Knowledge Gate`, trừ PR bootstrap material hợp lệ.
- PR check phải reject thiếu evidence, điểm dưới 80%, hoặc critical/debug/teach-back có FAIL.
- Trước khi Jira Done, phải có Jira comment `Ownership Knowledge Gate: PASS`, link PR/evidence và progress entry khớp nhau.
- Jira administrator có thể bypass bằng tay về mặt kỹ thuật; agent vẫn phải từ chối transition nếu thiếu evidence.
