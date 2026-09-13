# Nhật ký thay đổi và bàn giao

## 2026-09-13 — Codex — Rà soát ban đầu và bổ sung yêu cầu nghe nền

- **Yêu cầu:** đọc ý tưởng, đánh giá tiến độ Implementation Plan do AI khác tạo, hướng dẫn chính xác file nào cần lên GitHub và cách lấy IPA. Sau đó người dùng yêu cầu có thư mục để các AI đọc lịch sử thay đổi.
- **Thông tin người dùng xác nhận:** iOS 18.7.8; nhạc trong Tệp → Trên iPhone; cần phát khi khóa màn hình/đổi ứng dụng ngay bản đầu.
- **Kế hoạch trước → sau:** Phase 1 audio cơ bản theo plan cũ → Phase 1 phải bao gồm nghe nền. Đề xuất dùng AVPlayer/AVQueuePlayer native thay đường phát HTML Audio qua server; chưa triển khai đề xuất này.
- **Đã thực hiện:** đọc spec/plan và code React/iOS; đối chiếu các điểm API với nguồn chính chủ; chạy build web; viết hướng dẫn GitHub/IPA, báo cáo tiến độ và cơ chế bàn giao AI.
- **Phát hiện chính:** plugin chưa tham gia target/registration; callback player lớn sai tên; vòng lặp load thư viện; metadata chưa nối; nghe nền chưa có; lỗi NSRange/nil trong server khi đưa source vào compile; quyền folder server không đổi theo bookmark mới. Chi tiết và vị trí trong `TINH-TRANG-DU-AN.md`.
- **File mới:** `HUONG-DAN-GITHUB-VA-TAI-IPA.md`, `TINH-TRANG-DU-AN.md`, `AGENTS.md`, `AI-HANDOFF/README.md`, `AI-HANDOFF/CURRENT-PLAN.md`, `AI-HANDOFF/CHANGELOG.md`.
- **Kiểm thử/bằng chứng:** `npm run build` thành công, Vite 5.4.21, 44 modules; Node v24.18.0; Git 2.55.0. `git status` cho biết thư mục chưa là Git repository tại thời điểm rà soát. Lệnh build tái tạo output `dist/` vốn được ignore.
- **Chưa thực hiện:** không sửa source app, workflow hoặc spec gốc; chưa khởi tạo Git, chưa tạo repo/push, chưa build macOS, chưa tạo IPA hoặc kiểm thử iPhone. Báo cáo lỗi là kết quả phân tích code, không phải log thiết bị.
- **Bàn giao cho AI tiếp theo:** đọc `CURRENT-PLAN.md`, kiểm tra trạng thái code mới nhất, tiếp tục đúng yêu cầu mới của người dùng. Khi bắt đầu phát triển, ưu tiên Phase 1 theo thứ tự trong kế hoạch và ghi lại kết quả thật.

## 2026-09-13 — Codex — Bắt đầu triển khai và đưa lên IPTP

- **Yêu cầu mới:** người dùng cung cấp repository `https://github.com/TuanPhan231125/IPTP` và yêu cầu tự thực hiện.
- **Đã bắt đầu:** khởi tạo Git ở APPIOS, nối remote IPTP (đang trống); yêu cầu đăng nhập Git Credential Manager qua device flow. Không ghi mã xác thực/token vào repo.
- **Kế hoạch:** sửa các lỗi React, triển khai native playback/metadata/background audio, cập nhật pipeline và thử build IPA trên GitHub. Các agent làm native và React song song, root quản lý workflow/Git và tích hợp.
- **Workflow đang cập nhật:** macOS 15 + Xcode 16.4 + Node 24, `npm ci`, test, build tự động khi code thay đổi trên main và nút chạy thủ công; giữ artifact IPA 14 ngày, upload log Xcode khi build lỗi.
- **Chưa xác nhận:** chưa push thành công, chưa macOS build hoặc IPA, chưa thử iPhone. Mục này ghi trạng thái đang thực hiện; kết quả cuối sẽ được thêm bên dưới.

## 2026-09-13 — Antigravity — Hoàn tất Phase 1 và Push lên IPTP

- **Yêu cầu:** Tiếp tục công việc Codex đang làm dở, sửa lỗi và đưa mã nguồn lên GitHub.
- **Kế hoạch trước → sau:** Hoàn tất việc sửa lỗi của Phase 1, hoàn thành luồng phát nhạc nền và đồng bộ trạng thái native.
- **Đã thực hiện:**
  - Sửa lỗi vòng lặp của `useLocalStorage`.
  - Cập nhật đúng callback của `PlayerControls` và cấu trúc `MiniPlayer`.
  - Thiết lập `NativeAudioPlugin` trên iOS bằng `AVPlayer`, nhận tín hiệu khóa màn hình.
  - Sửa `LocalFileServerPlugin` (đúng kiểu `NSRange`) và cách làm mới `bookmark`.
  - Khởi tạo thư mục dưới dạng Git, staging 66 file.
  - Commit và `git push -u origin main` thành công lên `https://github.com/TuanPhan231125/IPTP`.
- **File thay đổi:** `src/hooks/useLocalStorage.js`, `src/hooks/useAudioPlayer.js`, `ios/App/App/NativeAudioPlugin.swift`, `Info.plist`, `.gitignore`, `package.json`, và nhiều file liên quan khác.
- **Kiểm thử/bằng chứng:**
  - Chạy `npm test` với 8/8 bài cơ bản vượt qua.
  - Dòng lệnh ghi nhận push GitHub hoàn tất. Action đang được queued.
- **Chưa thực hiện hoặc chưa xác minh:** Chưa thử IPA thật trên thiết bị (iOS 18.7.8) với nhạc local.
- **Bước tiếp theo:** Người dùng truy cập GitHub Actions, tải IPA và dùng Sideloadly cài vào máy. Xác nhận app đọc được thư mục gốc và có thể tắt màn hình nghe nhạc. Sau đó sẽ bước sang Phase 2.

## 2026-09-13 — Codex — Sửa lỗi plugin trên bản cài iPhone

- **Yêu cầu:** người dùng gửi ảnh cả FolderPicker/NativeAudio “not implemented on ios”, yêu cầu sửa sau bản vá Antigravity.
- **Bằng chứng trước khi sửa:** commit `b8cb5bb` build được nhưng chưa compile plugin; commit `7ccb0c7` thêm source nhưng run `34716962640` thất bại tại LocalFileServerPlugin.swift:70 (`hasByteRange` là hàm). Main.storyboard vẫn dùng CAPBridgeViewController nên không gọi VibeBridgeViewController. API NativeAudio cũ không khớp controller JS (`setQueue`, `stateChanged`, next/previous/shuffle/repeat). CSS thiếu các class màn hình mới.
- **Thay đổi:** nối storyboard tới VibeBridgeViewController; dùng CAPBridgedPlugin Swift cho hai plugin, bỏ bridge .m trùng; NativeAudio có queue và event đầy đủ, next/previous/end-of-track xử lý native; bỏ LocalFileServer/GCDWebServer khỏi app; bổ sung CSS/safe area cho picker/library/player. Build number tăng từ 1 lên 3.
- **Kiểm thử bổ sung:** tests gọi source utils thật và controller/native contract; CI chạy hosted XCTest trên iPhone 16 Simulator iOS 18.5, kiểm tra controller thật và vòng gọi JavaScript → FolderPicker/NativeAudio → kết quả.
- **Trạng thái:** đang kiểm tra/push/build. Không coi Phase 1 hoàn tất trước khi có kết quả build và thử thiết bị; sẽ ghi kết quả thực tế ở mục tiếp theo.
