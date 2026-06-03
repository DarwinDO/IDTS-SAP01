# Detection Logic - IDTS Intent Classification

Adapted from the upstream Ask Why skill by Phuc NT / BA Zone / Digital School. Use this file when the user's wording is ambiguous or the request may hide a bigger business problem.

Vietnamese: File này được điều chỉnh từ Ask Why skill gốc của Phuc NT / BA Zone / Digital School. Dùng khi wording của user chưa rõ hoặc request có thể đang che giấu một vấn đề nghiệp vụ lớn hơn.

## Intent Types

| Intent | IDTS signals | First response |
| --- | --- | --- |
| Feature Request | "add AI duplicate check", "add dashboard", "add bulk assign" | Ask what problem the feature solves, who is affected, and how success is measured. |
| Complaint | "Reject status is wrong", "assignment is confusing", "diagram is not enough" | Separate symptom from root cause and ask for the expected business behavior. |
| Operational Pain | "PM cannot see overdue bugs", "Reporter checks duplicates manually" | Quantify effort, frequency, owner, and failure impact. |
| Workaround | "we use Excel", "we use comments to track request info" | Ask why the workaround exists and what breaks if it is removed. |
| KPI Goal | "reduce duplicate bugs", "reduce pending assignment time" | Ask which process behavior drives the KPI and what baseline/target exists. |
| Solution Bias | "use AI", "make it like Jira", "integrate SAP Cloud ALM" | Treat the named solution as a hypothesis; identify the underlying problem first. |
| Process Issue | unclear handoff between Reporter, Developer, PM | Map as-is steps, actors, decisions, and exception paths before designing to-be flow. |
| Reporting Need | workload, overdue, rejected, nextProcessor, status report | Ask who consumes the report, what decision it drives, and whether dashboard/filter/notification is best. |
| Compliance/Audit Concern | history log, evidence, authorization, traceability | Ask what must be traceable, who audits it, and which rule/control must be satisfied. |

Vietnamese:

| Intent | Tín hiệu trong IDTS | Cách phản hồi đầu tiên |
| --- | --- | --- |
| Feature Request | "thêm AI duplicate check", "thêm dashboard", "bulk assign" | Hỏi feature giải quyết vấn đề gì, ai bị ảnh hưởng và đo thành công bằng gì. |
| Complaint | "Reject status sai", "assignment khó hiểu", "diagram chưa đủ" | Tách symptom khỏi root cause và hỏi behavior nghiệp vụ mong muốn. |
| Operational Pain | "PM không thấy overdue", "Reporter check duplicate thủ công" | Làm rõ effort, tần suất, owner và hậu quả khi lỗi. |
| Workaround | "dùng Excel", "dùng comment để track request info" | Hỏi vì sao workaround tồn tại và nếu bỏ workaround thì điều gì hỏng. |
| KPI Goal | "giảm bug trùng", "giảm pending assignment time" | Hỏi hành vi process nào ảnh hưởng KPI và baseline/target là gì. |
| Solution Bias | "dùng AI", "làm giống Jira", "tích hợp SAP Cloud ALM" | Xem solution là giả thuyết; tìm vấn đề gốc trước. |
| Process Issue | handoff Reporter/Developer/PM chưa rõ | Vẽ as-is steps, actor, decision và exception trước khi thiết kế to-be. |
| Reporting Need | workload, overdue, rejected, nextProcessor, status report | Hỏi ai dùng report, quyết định nào dựa vào report và dashboard/filter/notification có phù hợp hơn không. |
| Compliance/Audit Concern | history log, evidence, authorization, traceability | Hỏi cần trace gì, ai audit và control/rule nào cần thỏa. |

## Solution Bias Script

English: "Before I scope that solution, I want to confirm it is solving the right IDTS problem. What is broken today, who experiences it, and how would we measure that the change worked?"

Vietnamese: "Trước khi scope solution đó, mình muốn xác nhận nó đang giải quyết đúng vấn đề của IDTS. Hiện tại điều gì đang hỏng, ai gặp vấn đề đó, và mình đo việc cải thiện bằng chỉ số nào?"

## Safe Default Question

English: If intent is unclear, ask: "What business problem is this request trying to solve, and which IDTS role feels the pain most: Reporter, Developer, PM, or mentor/supervisor?"

Vietnamese: Nếu intent chưa rõ, hỏi: "Request này đang giải quyết vấn đề nghiệp vụ nào, và role nào trong IDTS đang đau nhất: Reporter, Developer, PM hay mentor/supervisor?"
