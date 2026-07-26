# IDTS-103 Technical Specification template-fidelity remediation — 2026-07-26

## Kết luận

`DRIVE SYNCHRONIZATION VERIFIED — mentor approval remains Pending.`

Hai workbook Technical Specification được sinh lại từ official template, không vá tay trên bản cũ:

- `Technical_Specification_IDTS_SAP01_en_v0.7.xlsx`
- `Technical_Specification_IDTS_SAP01_vi_v0.7.xlsx`

## Finding đã sửa

- Bản trước chỉ giữ outer shell nhưng thay nhiều vùng bên trong bằng bảng tự dựng.
- `Screen Layout` chứa prose trace thay vì vùng ảnh/layout của template.
- `Screen Definition` dùng sai mapping: Input/Output bị ghi vào cột Type và cột I/O bị bỏ trống.
- `Message Definition` không còn giữ đúng grid bốn cột của template.
- Technical trace dài đặt sai tab; lifecycle và AI action chưa được tách thành flow độc lập.
- Ảnh UAT lịch sử có nội dung cũ; đã thay bằng Shared QA evidence hiện hành.
- Một record bị đẩy sang trang gần như trắng; print layout đã được cân lại.

## Template fidelity

- Giữ đúng 12/12 tab, thứ tự và visibility của official template.
- Giữ merged title/header, metadata area, core grid, style, border, fill và page setup.
- `Screen Layout` dùng đúng vùng ảnh của template với hai ảnh Shared QA hiện hành.
- `Screen Definition` dùng đúng các cột Name, Type, I/O, Multi/Single, Data Type, Length, Required, Default Value và Remarks.
- `Message Definition` giữ đúng bốn cột Message ID, Language, Message và Output Timing.
- Deep trace được đặt trong `Technical Implementation`, tách riêng auth, draft/active, 11 lifecycle action, comment, attachment, history, notification, email worker, monitoring và 10 AI operation.

## Verification

- OfficeCLI `1.0.141`: PASS 2/2, không có schema error.
- SAP490 specification validator: PASS; Technical Specification đủ 12/12 tab.
- Specification quality contract: PASS trên lần chạy trước thay đổi nhãn trình bày cuối; thay đổi cuối chỉ rút gọn label và sửa đúng mapping cột, sau đó OfficeCLI và full specification validator tiếp tục PASS.
- LibreOffice render: PASS, EN 17 trang và VI 17 trang.
- Visual review tập trung: Screen Layout, Screen Definition, Message Definition và Technical Implementation PASS; không còn record đơn lẻ trên trang trắng.
- Không sửa `app/`, `srv/`, `db/`, API, schema hoặc workflow.

## Artifact hashes

- EN SHA-256: `F1AAFD725976B6310884380F353300417A24B57EA408C25464F7F2CCEF7B8866`
- VI SHA-256: `2CC66891C5E7ED1C8E831A304C72D1FA9EBDB261350E2A5605720D0E9BFD2172`

## Giới hạn và handoff

- Mentor review/approval vẫn Pending.
- PR #189 merge bình thường vào `dev` tại `aa7b708922d689a127e8ba892799c303881abc12`; QA Depth PASS, không bypass.
- EN được update tại chỗ, giữ file ID `1nAmUQb3852G4-hxJ0BOK6OHGLDs6Kq1P`, parent `1ZurfJj-whcezlM-9dgTZyTj_LRCaJ268`, XLSX MIME và size readback `2311951` bytes.
- VI được update tại chỗ, giữ file ID `1nwuWiW6-gjTVKmA_HuI_Un3075Kgf2fN`, cùng parent/XLSX MIME và size readback `2312629` bytes.
- Không tạo duplicate, không đổi parent và không chuyển thành Google-native Sheet.
