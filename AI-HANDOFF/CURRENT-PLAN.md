# Kế hoạch hiện tại — TPUGSOUND

## Đợt mở rộng 13/09/2026 — đang thực hiện

Người dùng xác nhận làm cả local, Railway, Gemini và YouTube. Project Railway được cung cấp: `871d544c-4630-42b4-ac03-38f7f014be3e`. Không ghi secret vào repo hoặc bàn giao.

Trạng thái mới nhất:

- Commit `edaf0f5` đã push lên `main`.
- GitHub Actions run `34769028210` của workflow **Build Unsigned iOS IPA** đã thành công; artifact thật là `TPUGSOUND-unsigned-ipa`.
- Backend test run `34768882758` đã thành công, gồm HTTP tests và PostgreSQL service thật trong CI.
- Railway project hiện báo **Trial expired**; cả service `IPTP` và `Postgres` đều **Service offline**, endpoint `https://iptp-production.up.railway.app/health` đang trả 404 vì service không chạy. Cần người dùng chọn plan Railway hoặc chuyển host trước khi xác minh cloud thật.
- Người dùng vẫn cần tự thêm `APP_PASSWORD`, `GEMINI_API_KEY`, `YOUTUBE_API_KEY` vào Railway; không đưa các giá trị này vào cuộc trò chuyện hay repo.
- UI web/mobile đã được kiểm tra bằng trình duyệt; native bridge đã được kiểm tra bằng iOS Simulator trong CI. Chưa thử bản IPA mới trên iPhone thật iOS 18.7.8.

1. Đổi tên hiển thị TPUGSOUND, giữ `com.vibeplayer.app` để cài đè; thay emoji bằng SVG thống nhất.
2. Nhiều folder, quét sâu, định danh ổn định; ẩn/bỏ ẩn bền vững; codec do AVFoundation kiểm tra, hiển thị lý do tệp không phát được.
3. Queue sửa thứ tự/phát tiếp/xóa, playlist/yêu thích/lịch sử, video native dùng chung AVPlayer và chế độ chỉ nghe, tùy chỉnh đĩa.
4. Backend Express/Postgres, đồng bộ metadata có xác thực/xử lý xung đột; Gemini + tìm YouTube qua server, không nhúng key trong IPA. Cấu hình endpoint trong app để sau này không cần build lại.
5. YouTube riêng biệt với local player; cần phân biệt khả năng đăng nhập/chặn quảng cáo của dịch vụ ngoài, không hứa các hành vi chưa kiểm chứng.
6. Test Node, UI mobile, native Simulator, archive IPA; ghi chính xác phần chưa được thử trên iPhone thật.

Trạng thái: bản nền Antigravity `4f4ca79` đã có CI xanh theo log bàn giao; chưa triển khai các mục mở rộng tại thời điểm ghi. Các phần dưới đây là lịch sử bản nền.

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
