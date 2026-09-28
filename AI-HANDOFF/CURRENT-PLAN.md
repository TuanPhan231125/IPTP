# Kế hoạch hiện tại — TPUGSOUND

## Định hướng đã chốt ngày 29/09/2026

Người dùng yêu cầu TPUGSOUND mở thẳng YouTube mobile toàn màn hình, giao diện giống YouTube trên điện thoại. Vuốt từ mép trái mở lại tính năng Local.
**Cập nhật 29/09:** Thêm lại chức năng chặn quảng cáo (Adblock), SponsorBlock (Spooner), và hỗ trợ phát nhạc nền khi tắt màn hình bằng kỹ thuật Visibility Hack. Người dùng chấp nhận gọi tới API của `sponsor.ajay.app`.

## Đã triển khai và đang chờ CI

- `CloudBridge` hiện có thể mở YouTube Home khi không truyền video, hoặc mở video kết quả Gemini/Khám phá trong cùng màn YouTube mobile.
- Màn native là `WKWebView` toàn màn hình. Lần đầu mở có hướng dẫn ngắn; vuốt đủ xa từ mép trái sẽ trở về Local.
- **Mới:** Đã nhúng JS injection vào `WKUserContentController` để: chặn UI quảng cáo (CSS), auto-click Skip Ad, bỏ qua SponsorBlock, và hack Page Visibility API (ghi đè `document.hidden` và chặn `visibilitychange`) để YouTube không tự dừng khi ứng dụng thu nhỏ hoặc tắt màn hình.
- **Mới:** Cấu hình thêm `AVAudioSession` category `.playback` trước khi tạo WKWebView để hệ điều hành cho phép phát nhạc nền.
- Google sign-in được cho phép chạy trong WebView. Nếu navigation tới Google thất bại, app hiển thị lý do thay vì tự chuyển sang Safari.
- Local vẫn giữ các tính năng nhạc offline.
- **Sửa CI 29/09:** GitHub Actions run `36461078538` dừng ở native XCTest với `exit code 65`. Bản vá local đã thay escape Swift sai trong CSS injection bằng raw multiline string chứa JavaScript hợp lệ; chưa có kết quả XCTest/archive mới.

## Việc tiếp theo

1. Push bản vá CI, theo dõi lại native XCTest và unsigned archive; không coi build là đã xong trước khi workflow xanh.
2. Khi CI xanh, tải `TPUGSOUND-unsigned-ipa` mới nhất, giải nén `App.ipa`, cài bằng Sideloadly.
3. Kiểm tra YouTube hiển thị toàn màn hình sát đáy, Mini Player/cử chỉ Local, tâm đĩa và phát nền trên iPhone thật.
4. Railway vẫn `Trial expired`. Cần nạp tiền hoặc đổi host nếu muốn dùng tính năng đám mây/Gemini.

[Nhật ký](CHANGELOG.md) · [Hướng dẫn IPA](../HUONG-DAN-GITHUB-VA-TAI-IPA.md)
