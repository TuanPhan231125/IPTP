# Kế hoạch hiện tại — VibePlayer

Cập nhật 13/09/2026 bởi Codex. Đang sửa lỗi người dùng gặp trên iPhone; chưa xác nhận Phase 1 hoàn tất.

## Yêu cầu đã chốt

- iOS 18.7.8, nhạc trong Tệp → Trên iPhone.
- Đọc folder gốc và thư mục con; không copy thư viện vào app, không gửi media lên backend.
- Nghe khi khóa màn hình/đổi ứng dụng ngay Phase 1.
- Người dùng cho phép tự sửa, push và build trên https://github.com/TuanPhan231125/IPTP.
- Codex/Antigravity phải cập nhật thư mục AI-HANDOFF khi bàn giao.

## Phát hiện mới từ bản cài và log GitHub

- Bản b8cb5bb build thành công nhưng thiếu source plugin trong target.
- Bản vá 7ccb0c7 có thêm source, nhưng build 34716962640 thất bại tại LocalFileServerPlugin.swift.
- Main.storyboard vẫn mở CAPBridgeViewController mặc định, nên không đăng ký hai plugin local.
- NativeAudio Swift và controller JS khác API/event; giao diện thiếu CSS cho các class mới.
- Kết luận “Hoàn tất Phase 1” trong nhật ký Antigravity là nhận định tại thời điểm đó, chưa được kiểm thử thiết bị xác nhận.

## Bản sửa hiện đang thực hiện

- Storyboard dùng VibeBridgeViewController; FolderPicker/NativeAudio dùng CAPBridgedPlugin Swift.
- NativeAudio giữ queue và xử lý next/previous/end-of-track trong Swift, event stateChanged và API đúng controller JS; giữ quyền đọc qua FolderAccessLease.
- Bỏ GCDWebServer/LocalFileServer và các bridge .m trùng khỏi app. Các file trong ios-plugins chỉ còn là tham khảo cũ, không copy vào build.
- Thêm CSS picker/library/player, safe area; tăng build number lên 3.
- 12/12 Node tests và npm run build đã qua trên Windows.
- CI bổ sung hosted XCTest chạy app trên Simulator iOS 18.5, xác nhận storyboard, plugin exports và JavaScript gọi hai plugin thật.

## Bước còn lại

1. Push bản sửa, kiểm tra kết quả XCTest và archive iOS trên GitHub. Sửa tiếp nếu có lỗi.
2. Tải đúng IPA của commit đã kiểm tra; ghi run/commit/artifact thật vào CHANGELOG.
3. Người dùng cài đè bằng Sideloadly, thử chọn folder/metadata/playback và nghe nền trên iOS 18.7.8.
4. Chỉ chốt Phase 1 sau kiểm thử thiết bị. Video, Railway, Gemini, YouTube vẫn thuộc phase sau.

[Nhật ký](CHANGELOG.md) · [Hướng dẫn IPA](../HUONG-DAN-GITHUB-VA-TAI-IPA.md)
