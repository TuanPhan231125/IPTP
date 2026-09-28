# Kế hoạch hiện tại — TPUGSOUND

## Định hướng đã chốt ngày 28/09/2026

Người dùng yêu cầu TPUGSOUND mở thẳng YouTube mobile toàn màn hình, giao diện giống YouTube trên điện thoại. Vuốt từ mép trái mở lại tính năng Local. Từ Local có mục YouTube để quay lại. Người dùng chấp nhận giới hạn YouTube: không chặn quảng cáo, không tải video YouTube vào Tệp và không bảo đảm phát nền YouTube.

## Đã triển khai và đã có IPA mới

- `CloudBridge` hiện có thể mở YouTube Home khi không truyền video, hoặc mở video kết quả Gemini/Khám phá trong cùng màn YouTube mobile.
- Màn native là `WKWebView` toàn màn hình, dùng data store mặc định để giữ cookie; không có thanh công cụ, nút Safari hay nút Local. Lần đầu mở có hướng dẫn ngắn; vuốt đủ xa từ mép trái sẽ trở về Local.
- Google sign-in được cho phép chạy trong WebView. Nếu navigation tới Google thất bại, app hiển thị lý do thay vì tự chuyển sang Safari. Khả năng Google cho đăng nhập vẫn cần thử trên iPhone thật.
- Đã gỡ rule chặn quảng cáo, tuỳ chọn `filterAds` trong UI/native/backend và không có chức năng tải video YouTube.
- Local vẫn giữ chọn nhiều folder từ Tệp, thư viện nhạc/video, queue, playlist, ẩn tệp, lịch sử, phát nền local. Thanh điều hướng Local có thêm YouTube.

## Kiểm thử đã chạy

- `npm test`: 17/17 qua, có test mở YouTube mobile home/video và giữ các test Local.
- `npm run build`: thành công.
- `npm test --prefix server`: 5/5 qua, 1 test PostgreSQL bị skip vì không có `DATABASE_URL` cục bộ.
- GitHub Actions run `36451578400` của **Build Unsigned iOS IPA** thành công trên commit `517f238`: Node tests, web build, Capacitor sync, XCTest Simulator, archive iOS, đóng gói và upload artifact đều xanh. Artifact thật `TPUGSOUND-unsigned-ipa` (910,823 bytes) chưa hết hạn; `native-plugin-tests` cũng đã upload.
- Chưa thử IPA này trên iPhone iOS 18.7.8.

## Việc tiếp theo

1. Tải `TPUGSOUND-unsigned-ipa` từ run `36451578400`, giải nén để lấy `App.ipa`, rồi cài đè bằng Sideloadly.
2. Kiểm tra YouTube hiển thị toàn màn hình, đăng nhập, vuốt mép trái, chọn folder và phát nền Local; báo lỗi/thông báo thực tế nếu có.
3. Railway vẫn `Trial expired`; Gemini/đồng bộ chỉ hoạt động khi user kích hoạt lại Railway hoặc chọn host mới và tự cấu hình biến môi trường cần thiết. Không ghi secret vào repo hoặc bàn giao.

[Nhật ký](CHANGELOG.md) · [Hướng dẫn IPA](../HUONG-DAN-GITHUB-VA-TAI-IPA.md)
