# IDTS-94 SangVN Ownership Knowledge Gate — AI review flow

Date: 2026-07-24

Member: SangVN

Flow: AI assistance — Handoff Summary and Smart Assign explanation review

Result: PASS

Score: 3/3 (100%)

Critical answers: PASS

Debug exercise: PASS after mentoring and an equivalent retest

Teach-back: PASS

## English evidence

The deterministic runner selected three AI-flow questions with:

```text
npm run learning:gate -- sangvn ai 2026-07-24 -
```

SangVN completed the assessment using their own answers:

1. Traced an AI review from the contextual UI action through the OData action contract in `srv/service.cds`, handler registration in `srv/service.js`, authorization and conditional update in `srv/ai/review.js`, and the persisted `AiSuggestions` row.
2. Explained to a beginner that AI output is advisory, a human chooses Accept/Reject/Ignore, the review is persisted in `AiSuggestions`, and real Bug or assignment changes must use a separate protected business action.
3. Selected repeat review as a negative case and explained that a non-`PENDING` suggestion returns HTTP `409`, keeps the first review decision, and does not mutate `Bugs`.

Critical data-integrity result:

- A successful review updates only `reviewState`, `reviewedBy`, and `reviewedAt` on `AiSuggestions`.
- Reviewer identity comes from the authenticated CAP request/session and is matched to an active `Users` row; it is not trusted from client payload.
- Review does not change Bug status, assignee, next processor/current action owner, classification, comments, or history.

Controlled debug exercise:

- Initial attempt incorrectly evaluated `ACCEPTED !== PENDING` as false.
- Mentor mode substituted the concrete values and explained the `true || false` branch.
- Equivalent retest used `reviewState = REJECTED` with an unexpired suggestion.
- SangVN correctly concluded that the condition is true, the `UPDATE` is not reached, HTTP `409` is returned, and database state remains unchanged.

No credential, token, private endpoint, raw provider output, or personal email is recorded in this evidence.

## Bằng chứng tiếng Việt

Script deterministic đã chọn ba câu hỏi cho flow AI bằng lệnh:

```text
npm run learning:gate -- sangvn ai 2026-07-24 -
```

SangVN hoàn thành phần đánh giá bằng câu trả lời của chính mình:

1. Trace thao tác review AI từ action theo context trên UI, qua hợp đồng OData trong `srv/service.cds`, đăng ký handler trong `srv/service.js`, kiểm tra quyền và conditional update trong `srv/ai/review.js`, rồi tới row `AiSuggestions` được lưu.
2. Giải thích cho người mới rằng AI chỉ đưa gợi ý, con người chọn Accept/Reject/Ignore, kết quả review được lưu trong `AiSuggestions`, còn mọi thay đổi thật trên Bug hoặc assignment phải đi qua business action riêng có bảo vệ.
3. Chọn trường hợp review lặp làm negative case và giải thích suggestion không còn `PENDING` phải trả HTTP `409`, giữ quyết định review đầu tiên và không mutate `Bugs`.

Kết quả critical về toàn vẹn dữ liệu:

- Review thành công chỉ cập nhật `reviewState`, `reviewedBy` và `reviewedAt` trên `AiSuggestions`.
- Danh tính reviewer lấy từ CAP request/session đã xác thực rồi đối chiếu với row `Users` đang active; không tin dữ liệu reviewer do client gửi.
- Review không đổi status, assignee, next processor/current action owner, classification, comments hoặc history của Bug.

Bài debug có kiểm soát:

- Lần đầu SangVN đọc nhầm `ACCEPTED !== PENDING` thành false.
- Mentor mode thay giá trị cụ thể và giải thích nhánh `true || false`.
- Bài retest tương đương dùng `reviewState = REJECTED` với suggestion chưa hết hạn.
- SangVN kết luận đúng: điều kiện là true, không chạy tới `UPDATE`, trả HTTP `409` và database giữ nguyên.

Evidence này không chứa credential, token, endpoint private, raw provider output hoặc email cá nhân.
