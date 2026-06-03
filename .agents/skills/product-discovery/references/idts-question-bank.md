# IDTS Question Bank

Use these questions as seeds, not a script. Ask only 3-5 questions per turn and adapt wording to the current conversation.

Vietnamese: Dùng các câu hỏi này như gợi ý, không đọc như script. Mỗi lượt chỉ hỏi 3-5 câu và chỉnh wording theo ngữ cảnh.

## Create Bug and Duplicate Check

English:

- What makes a bug report valid enough to submit?
- How does the Reporter search for duplicates today?
- What should happen when a similar bug is open?
- What should happen when a similar bug is closed?
- Which fields are most useful for duplicate search: title, component, category, status, environment, steps, actual result?

Vietnamese:

- Một bug report cần đủ thông tin gì mới được submit?
- Reporter hiện check duplicate bằng cách nào?
- Nếu có bug tương tự đang open thì hệ thống nên xử lý thế nào?
- Nếu có bug tương tự đã closed thì hệ thống nên xử lý thế nào?
- Field nào hữu ích nhất để search duplicate: title, component, category, status, environment, steps, actual result?

## Classification

English:

- Is SAP Module business context, technical component, or both in this scenario?
- Is SAP Module required for this bug, or can it be Not Applicable?
- Which Application Component did the bug appear in?
- Which Defect Category best describes the defect type or technical layer?
- Are all Component Category combinations valid, or should the system restrict them?

Vietnamese:

- Trong tình huống này, SAP Module là bối cảnh nghiệp vụ, technical component hay cả hai?
- Bug này có bắt buộc chọn SAP Module không, hay có thể là Not Applicable?
- Bug xuất hiện ở Application Component nào?
- Defect Category nào mô tả đúng loại lỗi hoặc tầng kỹ thuật?
- Mọi cặp Component Category đều hợp lệ hay hệ thống cần giới hạn?

## Assignment and Developer Responsibility

English:

- What responsibility mapping proves a Developer is suitable?
- Should workload affect assignment in MVP or only PM monitoring?
- What happens when no Developer matches the selected component/category?
- Can Reporter choose any Developer, or only filtered Developers?
- Who may override assignment and why?

Vietnamese:

- Mapping responsibility nào chứng minh Developer phù hợp?
- Workload có ảnh hưởng assignment trong MVP không, hay chỉ dùng cho PM monitoring?
- Nếu không có Developer match component/category thì bug đi đâu?
- Reporter có được chọn bất kỳ Developer nào không, hay chỉ chọn trong danh sách đã filter?
- Ai được override assignment và vì sao?

## Developer Review and Request More Information

English:

- What must the Developer check before accepting the bug?
- Which missing information should move the bug to Need More Information?
- Who owns the next action after Need More Information?
- How does the Reporter know what to add?
- When does the bug return to Assigned or In Review?

Vietnamese:

- Developer cần kiểm tra gì trước khi nhận xử lý bug?
- Thiếu thông tin nào thì bug chuyển sang Need More Information?
- Ai chịu trách nhiệm hành động tiếp theo sau Need More Information?
- Reporter biết cần bổ sung gì bằng cách nào?
- Khi nào bug quay lại Assigned hoặc In Review?

## Rejected Follow-up

English:

- Is the Developer rejecting the classification, the assignment, or the bug validity?
- What rejection reason is mandatory?
- Who becomes nextProcessor after rejection: Reporter/Admin, PM, or a queue?
- What correction actions are allowed after Rejected?
- Should the bug return to Assigned or Pending Assignment after correction?

Vietnamese:

- Developer đang reject classification, assignment hay tính hợp lệ của bug?
- Lý do reject nào bắt buộc phải nhập?
- Sau reject, ai là nextProcessor: Reporter/Admin, PM hay queue?
- Sau Rejected, những action correction nào được phép?
- Sau khi sửa, bug quay lại Assigned hay Pending Assignment?

## Resolve, Retest, Close, and Reopen

English:

- What does Resolved mean in IDTS: fixed in code, workaround, or response completed?
- Who decides whether retest is required?
- What evidence is needed to close a bug?
- What conditions allow Reopen after Resolved or Closed?
- Should Developer be allowed to close directly?

Vietnamese:

- Trong IDTS, Resolved nghĩa là gì: đã fix code, có workaround, hay đã phản hồi xử lý xong?
- Ai quyết định có cần retest không?
- Cần evidence gì để close bug?
- Điều kiện nào cho phép Reopen sau Resolved hoặc Closed?
- Developer có được close trực tiếp không?

## Notification, Audit, and PM Monitoring

English:

- Which events must create notification records?
- Which events must create history logs?
- What should PM see first: overdue, workload, rejected, pending assignment, or nextProcessor?
- What is the SLA or overdue rule?
- If notification delivery fails, what still must be logged?

Vietnamese:

- Event nào bắt buộc tạo notification record?
- Event nào bắt buộc tạo history log?
- PM cần thấy gì trước: overdue, workload, rejected, pending assignment hay nextProcessor?
- SLA hoặc overdue rule là gì?
- Nếu notification delivery fail, điều gì vẫn phải được log?

## Fiori UX and Authorization

English:

- Which role sees this action button?
- Should invalid actions be hidden, disabled with message, or blocked by backend only?
- Which fields need value help?
- Which fields are mandatory on create vs update?
- Which message should the user see when a transition is rejected?

Vietnamese:

- Role nào thấy action button này?
- Action không hợp lệ nên bị ẩn, disable kèm message, hay chỉ backend block?
- Field nào cần value help?
- Field nào mandatory khi create và khi update?
- User thấy message gì khi transition bị reject?
