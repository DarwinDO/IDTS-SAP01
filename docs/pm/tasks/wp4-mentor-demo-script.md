# WP4 Mentor Demo Script

## English Overview

Purpose: a more complete, human-sounding mentor demo script for the current IDTS functional baseline.

Speakers:

- `NhanT`: primary narrator for Tester and coordination steps
- `SangVN`: primary narrator for Developer steps

Coverage:

- create bug
- upload attachment
- add comment
- assign developer
- mark in review
- start progress
- resolve
- send to retest
- close bug
- request more information
- resubmit to developer
- reject bug
- move to pending assignment
- reassign
- review history and notifications

## Kịch bản Demo

## 1. Mục tiêu buổi demo

Mục tiêu của buổi demo là cho mentor thấy:

- hệ thống đã đi được happy flow chính từ lúc tạo bug đến lúc đóng bug,
- các nhánh follow-up quan trọng như `Need More Information` và `Rejected` cũng đã có đường đi tiếp rõ ràng,
- comment, attachment, history, notification đều đã gắn vào flow nghiệp vụ chứ không đứng riêng lẻ.

## 2. Phân vai khi nói

- `NhanT` là người nói chính ở các bước thuộc vai trò Tester hoặc bước điều phối.
- `SangVN` là người nói chính ở các bước thuộc vai trò Developer.
- Nếu cần một thao tác mang nghĩa PM như `Move to Pending Assignment` hoặc `Close Bug`, vẫn có thể để `NhanT` nói và thao tác, chỉ cần nói rõ đây là bước điều phối.

## 3. Cách chia demo để mượt

Không nên cố nhồi tất cả vào một bug duy nhất. Nên chia thành 3 phần:

1. **Bug A - Happy flow chính**  
   Create -> Assign -> In Review -> In Progress -> Resolved -> Retest Required -> Closed

2. **Bug B - Luồng thiếu thông tin**  
   Assigned -> Need More Information -> Tester bổ sung -> Resubmit to Developer

3. **Bug C - Luồng phân loại/gán sai**  
   Assigned -> Rejected -> Move to Pending Assignment -> Reassign

Như vậy flow rõ, người xem dễ theo dõi, và mỗi bug chỉ minh họa một nhóm tình huống.

## 4. Chuẩn bị trước khi demo

### 4.1. Chuẩn bị dữ liệu

- Chuẩn bị sẵn một file minh chứng nhỏ để upload.
- Chuẩn bị sẵn một bug đang ở trạng thái phù hợp cho luồng `Need More Information`.
- Chuẩn bị sẵn một bug đang ở trạng thái phù hợp cho luồng `Rejected`.

### 4.2. Chuẩn bị tài khoản

- `NhanT`: dùng cho Tester
- `SangVN`: dùng cho Developer

Nếu cần thao tác điều phối như PM, có thể dùng thêm tài khoản PM ở phần bấm nút, nhưng phần lời vẫn giữ chỉ 2 người nói là `NhanT` và `SangVN`.

## 5. Kịch bản chính để nói

### 5.1. Mở đầu

**NhanT:**  
"Bên em xin demo luồng chức năng chính hiện tại của hệ thống IDTS. Phần này sẽ đi từ lúc Tester tạo bug, đính kèm minh chứng, gán developer, sau đó Developer xử lý, rồi cuối cùng quay lại phần retest, đóng bug, và kiểm tra lịch sử cũng như thông báo."

**SangVN:**  
"Trong lúc demo, bọn em cũng sẽ mở thêm hai nhánh phụ để cho thấy hệ thống không chỉ có happy flow chính, mà còn xử lý được các tình huống thiếu thông tin và gán sai người xử lý."

## 6. Demo 1 - Bug A: Happy flow chính

### Bước 1 - Mở danh sách bug

**NhanT:**  
"Đầu tiên em vào màn hình danh sách bug để cho thấy dữ liệu hiện có và các filter chính. Ở đây em bấm Go để tải danh sách."

**Điểm cần thao tác:**  
- mở List Report
- bấm `Go`

**Điểm cần nói ngắn:**  
- dữ liệu đã lên được danh sách
- đây là entry point của Tester

### Bước 2 - Tạo bug mới

**NhanT:**  
"Em tạo một bug mới. Ở bước này em nhập đầy đủ các trường bắt buộc như tiêu đề, mô tả, mức độ ưu tiên, mức độ nghiêm trọng, các bước tái hiện, kết quả thực tế và kết quả mong muốn."

**NhanT:**  
"Phần classification em chọn đúng cặp hợp lệ để hệ thống hiểu bug này đang nằm ở đâu và sau đó có thể lọc developer phù hợp."

**Điểm cần thao tác:**  
- bấm `Create`
- nhập dữ liệu
- chọn `Application Component`
- chọn `Defect Category`

### Bước 3 - Upload attachment và thêm comment

**NhanT:**  
"Ngay trong lúc tạo bug, em đính kèm luôn một file minh chứng. Đây là điểm quan trọng vì bug report trong thực tế thường cần screenshot, log hoặc file mô tả kèm theo."

**NhanT:**  
"Sau đó em thêm một comment ngắn để ghi chú bối cảnh phát hiện lỗi. Như vậy khi Developer mở bug ra thì không chỉ thấy dữ liệu form mà còn thấy trao đổi ngắn gọn ngay trên bug."

**Điểm cần thao tác:**  
- upload file
- save bug
- vào section `Comments`
- bấm `Add Comment`

### Bước 4 - Gán developer

**NhanT:**  
"Sau khi bug đã được tạo xong, em dùng chức năng Assign Developer để gán người xử lý. Ở đây em chọn SangVN."

**NhanT:**  
"Điểm em muốn nhấn mạnh là phần value help hiện hiển thị theo thông tin nghiệp vụ dễ đọc, không còn kiểu kỹ thuật khó theo dõi."

**Điểm cần thao tác:**  
- bấm `Assign Developer`
- chọn `SangVN`
- submit action

### Bước 5 - Developer review

**SangVN:**  
"Bây giờ em chuyển sang vai trò Developer. Khi mở đúng bug được assign cho mình, em thấy các action xử lý dành cho developer hiện ra theo đúng ngữ cảnh."

**SangVN:**  
"Đầu tiên em chuyển bug sang In Review để thể hiện rằng em đã bắt đầu kiểm tra thông tin."

**Điểm cần thao tác:**  
- đổi persona sang `SangVN`
- mở lại Bug A
- bấm `Mark In Review`

### Bước 6 - Bắt đầu xử lý

**SangVN:**  
"Sau khi đã review xong và thông tin đủ rõ, em chuyển sang Start Progress để thể hiện bug đang được xử lý thực sự."

**SangVN:**  
"Điểm cần thấy ở đây là sau khi bấm action, trạng thái trên Object Page đổi ngay, không cần reload thủ công."

**Điểm cần thao tác:**  
- bấm `Start Progress`

### Bước 7 - Resolve bug

**SangVN:**  
"Khi xử lý xong, em chuyển bug sang Resolved. Với bước này hệ thống yêu cầu note giải trình để đảm bảo khi nhìn lại thì mọi người biết developer đã xử lý theo hướng nào."

**Điểm cần thao tác:**  
- bấm `Resolve Bug`
- nhập note ngắn
- submit

### Bước 8 - Retest và đóng bug

**NhanT:**  
"Sau khi developer đã resolve, em quay lại vai trò kiểm tra. Nếu cần thêm một vòng xác nhận thì em chuyển bug sang Retest Required. Sau khi kiểm tra kết quả ổn, em đóng bug."

**NhanT:**  
"Như vậy bug đã đi hết luồng chính từ tạo mới cho đến đóng."

**Điểm cần thao tác:**  
- quay lại persona Tester hoặc PM
- bấm `Send to Retest`
- sau đó bấm `Close Bug`

## 7. Demo 2 - Bug B: Luồng Need More Information

### Mở đầu nhánh phụ

**NhanT:**  
"Tiếp theo em mở một bug chuẩn bị sẵn để demo tình huống developer thấy thông tin chưa đủ."

### Bước 1 - Developer yêu cầu bổ sung

**SangVN:**  
"Ở bug này, em đang là developer được assign nhưng thông tin chưa đủ rõ để xử lý tiếp. Em dùng Request More Information và ghi lý do cụ thể."

**Điểm cần thao tác:**  
- mở Bug B
- đổi sang `SangVN`
- bấm `Request More Information`
- nhập reason

### Bước 2 - Tester bổ sung và resubmit

**NhanT:**  
"Sau khi nhận được yêu cầu, em quay lại vai trò Tester. Em cập nhật thêm comment hoặc attachment, sau đó dùng Resubmit to Developer để đưa bug quay lại cho developer."

**NhanT:**  
"Ý nghĩa của bước này là bug không bị đứng lại ở trạng thái thiếu thông tin, mà có đường quay lại rõ ràng."

**Điểm cần thao tác:**  
- đổi sang `NhanT`
- thêm comment hoặc attachment
- bấm `Resubmit to Developer`
- nhập update summary

## 8. Demo 3 - Bug C: Luồng Reject và Reassign

### Mở đầu nhánh phụ

**NhanT:**  
"Bug tiếp theo dùng để minh họa trường hợp bug được gán hoặc phân loại chưa đúng."

### Bước 1 - Developer reject

**SangVN:**  
"Ở bug này, em là developer nhưng em nhận thấy classification hoặc assignment chưa phù hợp, nên em dùng Reject Bug và ghi rõ lý do."

**Điểm cần thao tác:**  
- mở Bug C
- đổi sang `SangVN`
- bấm `Reject Bug`
- nhập reason

### Bước 2 - Điều phối lại

**NhanT:**  
"Sau khi bug bị reject, em quay lại phần điều phối. Lúc này hệ thống không xem reject là điểm kết thúc, mà phải có bước follow-up tiếp theo."

**NhanT:**  
"Ở đây em sẽ chuyển bug sang Pending Assignment, sau đó gán lại đúng người xử lý hoặc gán lại theo classification đã chỉnh."

**Điểm cần thao tác:**  
- đổi sang persona điều phối
- bấm `Move to Pending Assignment`
- sau đó `Assign Developer` lại

## 9. Demo 4 - Kiểm tra comment, attachment, history, notification

### Comment và attachment

**NhanT:**  
"Sau ba luồng vừa rồi, em mở lại phần Comments và Attachments để cho thấy mọi trao đổi và minh chứng đều bám theo bug, không bị tách ra ngoài."

### History

**SangVN:**  
"Tiếp theo là phần History. Ở đây có thể thấy các mốc chính như assign, đổi trạng thái, request thêm thông tin, reject, resubmit. Mục tiêu là khi nhìn vào thì người dùng hiểu luồng xử lý chứ không phải chỉ thấy log kỹ thuật."

### Notifications

**NhanT:**  
"Cuối cùng là Notifications. Phần này cho thấy các mốc cần follow-up đã được hệ thống ghi nhận lại để người tiếp theo biết mình cần làm gì."

## 10. Câu chốt cuối buổi demo

**NhanT:**  
"Tóm lại, hiện tại hệ thống đã đi được luồng chính từ tạo bug đến đóng bug, đồng thời cũng xử lý được hai nhánh follow-up quan trọng là thiếu thông tin và reject để điều phối lại."

**SangVN:**  
"Điểm bọn em muốn nhấn mạnh là các chức năng hiện tại không đứng rời rạc, mà đã được nối thành flow hoàn chỉnh: có dữ liệu đầu vào, có xử lý theo vai trò, có comment và attachment hỗ trợ, có history và notification để theo dõi xuyên suốt."

## 11. Phiên bản rút gọn nếu mentor ít thời gian

Nếu thời gian ngắn, chỉ chạy 4 đoạn sau:

1. Bug A: Create + upload attachment + add comment
2. Bug A: Assign Developer + In Review + Start Progress
3. Bug A: Resolve + Retest Required + Close
4. Bug B hoặc Bug C: chọn một nhánh phụ để minh họa follow-up

## 12. Lưu ý khi nói để tự nhiên hơn

- Không đọc tên field quá nhiều.
- Ưu tiên nói theo ý nghĩa nghiệp vụ: "ghi nhận lỗi", "bổ sung minh chứng", "chuyển cho developer", "điều phối lại".
- Khi chuyển persona, nói ngắn gọn: "bây giờ em chuyển sang góc nhìn developer".
- Nếu có thao tác chờ load, tranh thủ giải thích ý nghĩa bước vừa làm.
- Nếu mentor hỏi sâu về kỹ thuật, mới giải thích thêm về validation, history hoặc notification.
