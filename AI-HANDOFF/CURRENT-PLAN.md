# Kế hoạch hiện tại — VibePlayer

Cập nhật: 13/09/2026, Codex. Người dùng đã cung cấp repository IPTP và yêu cầu tự thực hiện. Đang sửa Phase 1, chuẩn bị push và build IPA; chưa có kết quả iOS để xác nhận.

## Yêu cầu làm căn cứ

| Nội dung | Trạng thái / nguồn |
|---|---|
| App nghe nhạc/video cá nhân, Windows, Capacitor, IPA qua GitHub Actions/Sideloadly | Ý tưởng người dùng trong `vibe-player-spec.md` |
| Đọc folder gốc, không copy toàn bộ nhạc vào app, không gửi media lên backend | Ý tưởng gốc |
| iOS 18.7.8 | Người dùng xác nhận trong cuộc trao đổi 13/09/2026 |
| Nhạc trong Tệp → Trên iPhone | Người dùng xác nhận trong cuộc trao đổi 13/09/2026 |
| Khóa màn hình/đổi ứng dụng vẫn phát ngay bản đầu | Người dùng trả lời “Có, cần ngay từ bản đầu” |
| Giữ lịch sử để Codex/Antigravity biết thay đổi | Người dùng yêu cầu thư mục bàn giao AI |
| Tự đưa dự án lên GitHub và thực hiện các bước tạo bản dùng thử | Người dùng cung cấp `https://github.com/TuanPhan231125/IPTP` và yêu cầu “tự làm giúp tôi luôn” |

Chưa biết model iPhone hoặc quy mô thư viện. Hai thông tin này chưa cản trở việc sửa các lỗi đã xác định. Railway/Gemini có sẵn tài khoản/key theo spec; chưa có backend trong code và không cần người dùng cung cấp key cho công việc rà soát/build local này.

## Kế hoạch đã đổi gì so với bản AI trước?

**Phạm vi bắt buộc đã bổ sung:** nghe nền phải có trong Phase 1. Bản cũ chủ yếu đề xuất HTML Audio + HTTP server local và chưa triển khai audio session/background mode.

**Đề xuất kỹ thuật của Codex, chưa triển khai:** React tiếp tục làm giao diện; AVPlayer/AVQueuePlayer native quản lý phát, queue và quyền đọc file. Thêm audio session, background audio, trạng thái và điều khiển màn hình khóa. Đánh giá bỏ GCDWebServer khỏi đường phát audio nếu không còn cần. Đây là lựa chọn triển khai có cơ sở từ yêu cầu nghe nền, không phải câu trả lời xác nhận một thư viện cụ thể từ người dùng.

**Bản bàn giao tiếp theo được đề xuất:** Phase 1 nghe nhạc local ổn định trên iOS 18.7.8, có IPA dùng thử. Video/MV, Railway, Gemini và YouTube tiếp tục ở các phase sau; chưa đánh dấu chúng đã làm.

## Trạng thái thực tế gần nhất

- Build web bằng `npm run build`: thành công, Vite 5.4.21, 44 modules.
- Giao diện và hook player: đã có code; còn callback sai và vòng lặp quét thư viện.
- Folder picker/local server: có source Swift nhưng chưa thêm vào target/đăng ký đúng Capacitor 6.
- Metadata: chưa tích hợp, dữ liệu thật vẫn dùng tên file và bìa trống.
- Nghe nền: chưa triển khai.
- Workflow: có, chạy thủ công; runner `macos-14` cần cập nhật.
- Git: thư mục chưa được khởi tạo thành repository tại lần kiểm tra; chưa push.
- Build iOS, IPA, Sideloadly/iPhone: chưa thực hiện/xác minh.

## Việc tiếp theo khi tiếp tục phát triển

1. Kiểm tra lại code thực tế và nhật ký mới nhất trước khi sửa.
2. Sửa callback player và vòng lặp quét/màn hình thư viện.
3. Hoàn thiện folder picker native, giữ/cập nhật quyền và tích hợp metadata.
4. Triển khai player native cùng nghe nền, queue, lock-screen controls; kiểm tra gián đoạn/rút tai nghe.
5. Cập nhật workflow và nối nguồn iOS đúng target/registration. Nếu giữ local server, xử lý các lỗi đã nêu trong báo cáo.
6. Đưa code lên repository người dùng chọn; build macOS, tải artifact, thử IPA trên iOS 18.7.8.
7. Chỉ đánh dấu Phase 1 hoàn tất sau kiểm thử thiết bị theo tiêu chí trong báo cáo.

Yêu cầu hiện tại đã chuyển sang thực hiện trên repository IPTP. Git đã được khởi tạo ở APPIOS với remote đúng repository trống người dùng cung cấp. Đang chờ người dùng hoàn tất đăng nhập Git Credential Manager, song song triển khai player native/React và workflow. Các kết quả rà soát phía trên là mốc trước khi sửa, chưa phải báo cáo hoàn tất triển khai.

## Tài liệu liên quan

- [Hiện trạng chi tiết và tiêu chí kiểm thử](../TINH-TRANG-DU-AN.md)
- [Cách đưa code lên GitHub và lấy IPA](../HUONG-DAN-GITHUB-VA-TAI-IPA.md)
- [Ý tưởng gốc](../vibe-player-spec.md)
- [Hướng dẫn IPA gốc](../huong-dan-tao-ipa.md)
- [Nhật ký bàn giao](CHANGELOG.md)
