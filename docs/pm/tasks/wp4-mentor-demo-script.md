# WP4 Mentor Demo Script

## English Overview

Purpose: a short, human-sounding demo script for the Sprint 02 happy-flow review.

Speakers:

- NhanT: Tester side
- SangVN: Developer side

Focus:

- create bug,
- upload attachment,
- add comment,
- assign developer,
- developer review,
- resolve / retest / close,
- show history and notifications naturally.

## Kịch bản Demo

### Mở đầu

**NhanT:**  
“Em xin phép demo nhanh luồng happy case chính của IDTS. Em sẽ đi từ lúc Tester tạo bug, gán developer, rồi sang phần developer xử lý và cuối cùng là kiểm tra lại lịch sử cũng như thông báo.”

**SangVN:**  
“Dạ, em sẽ nói phần developer để mọi người thấy rõ là UI và backend đang đi đúng flow nghiệp vụ, không còn nút nào thừa hay chồng chéo.”

### 1. Tạo bug

**NhanT:**  
“Đầu tiên em đăng nhập bằng vai trò Tester. Em bấm Create, điền đầy đủ các field bắt buộc, chọn đúng cặp phân loại hợp lệ, rồi đính kèm một file minh chứng ngay trong lúc tạo bug.”

**NhanT:**  
“Em cũng thêm một comment ngắn để ghi chú bối cảnh phát hiện lỗi. Như vậy khi bug được mở lại sau này, mình có đủ thông tin ngay từ đầu.”

### 2. Gán developer

**NhanT:**  
“Sau khi tạo xong, em dùng Assign Developer để chọn người xử lý phù hợp. Mục tiêu ở đây là bug được chuyển sang trạng thái Assigned và có next processor rõ ràng.”

**SangVN:**  
“Điểm em muốn mọi người để ý là phần assignee giờ hiển thị tên nghiệp vụ dễ đọc, không còn cảm giác kỹ thuật thô nữa. Danh sách chọn cũng chỉ còn những developer phù hợp với classification đã chọn.”

### 3. Developer review

**SangVN:**  
“Em đăng nhập sang vai trò Developer để mở cùng bug đó. Em kiểm tra mô tả, attachment, comment, và lịch sử trước khi xử lý.”

**SangVN:**  
“Nếu bug đã đủ thông tin, em chuyển sang In Review hoặc Start Progress tùy ngữ cảnh. Nếu cần ghi chú kỹ thuật thì em thêm note, còn nếu không thì vẫn đi tiếp được theo happy flow.”

### 4. Hoàn tất xử lý

**SangVN:**  
“Khi đã xử lý xong, em chuyển bug sang Resolved. Hệ thống tự cập nhật trạng thái, lịch sử và thông báo follow-up cho đúng người cần nhận.”

**NhanT:**  
“Sau đó em kiểm tra lại như Tester. Nếu cần retest thì em chuyển sang Retest Required, còn nếu kết quả ổn thì đóng bug.”

### 5. Kết luận demo

**NhanT:**  
“Tổng kết lại, luồng demo này cho thấy mình đã đi được trọn vòng: tạo bug, gán người xử lý, developer review, cập nhật trạng thái, và ghi nhận lịch sử/thông báo đầy đủ.”

**SangVN:**  
“Và quan trọng nhất là UI bây giờ hỗ trợ đúng vai trò, đúng thời điểm, nên khi demo với mentor sẽ dễ theo dõi hơn và ít gây nhiễu hơn.”

## Lưu ý khi demo

- Giữ nhịp nói chậm, không đọc máy móc từng field.
- Ưu tiên nói theo ngữ cảnh nghiệp vụ, không nói quá nhiều tên kỹ thuật.
- Nếu mentor hỏi sâu, chỉ giải thích ngắn gọn: “field này là để phục vụ flow này”.
- Nếu buổi demo cần ngắn, chỉ chạy 4 điểm: create, assign, developer review, close.
- Nếu cần thêm phần follow-up, mới mở nhánh Need More Information / Resubmit.
