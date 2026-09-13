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

## 2026-09-13 — Codex — Điều chỉnh cấu hình kiểm thử CI

- Commit b9f46a8 đã push; 12/12 Node tests và web build qua. Giao diện 390×844 được kiểm tra bằng trình duyệt: thư viện mở đúng, phát/tạm dừng hoạt động, không có lỗi console.
- Run 34738888608 dừng ở cấu hình test bundle chưa có PRODUCT_NAME, trước khi compile native. Đã thêm tên bundle và dùng scheme AppSmokeTests riêng để test target không tham gia archive App.
- Chưa có IPA mới tại thời điểm ghi mục này; đang chạy lại CI.

## 2026-09-13 — Codex — Sửa kiểu trạng thái bridge theo log Xcode

- Run 34738983052 đã vào compile source native và phát hiện dictionary JSObject không chấp nhận giá trị ép kiểu Any. Đã đổi trạng thái nullable sang JSValue/NSNull đúng kiểu Capacitor.
- Cập nhật hướng dẫn GitHub/IPA cho repository đã tồn tại và workflow mới; đánh dấu báo cáo rà soát đầu là tài liệu lịch sử.
- Chưa có IPA mới; tiếp tục xác minh bằng CI.

## 2026-09-13 — Antigravity — Sửa shared scheme, build IPA thành công

- **Yêu cầu:** Tiếp tục từ Codex (hết lượt lần 2). 4 lần build CI liên tiếp fail.
- **Nguyên nhân:** Xcode workspace thiếu shared scheme "App". CI chạy `xcodebuild -scheme App archive` không tìm thấy scheme.
- **Đã thực hiện:** Tạo `ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme`, push commit `4f4ca79`.
- **Kiểm thử/bằng chứng:** GitHub Actions run `34739935849` — tất cả bước thành công: 12/12 Node tests, native plugin test trên iOS Simulator, build unsigned archive (Release, iphoneos), package IPA, upload artifact.
- **Artifact:** `VibePlayer-unsigned-ipa` có sẵn trên GitHub Actions.
- **Bước tiếp theo:** Người dùng tải IPA mới, cài qua Sideloadly và test trên iOS 18.7.8.

## 2026-09-13 — Codex — TPUGSOUND, mở rộng local và dựng backend (đang làm)

- Người dùng xác nhận bao gồm Railway/Gemini/YouTube; cho URL project Railway. Đã vào được bằng phiên người dùng đăng nhập. Dịch vụ IPTP nối GitHub nhưng chưa có env tùy chỉnh/database/domain lúc kiểm tra.
- Đã viết: SVG icons, tên hiển thị TPUGSOUND (giữ com.vibeplayer.app), folder store nhiều bookmark + migrate legacy, scan nhiều định dạng + isPlayable, hidden bền vững, queue update native, video AVKit dùng cùng AVPlayer, timer/history native, playlist/favorite/tags/settings/mood UI, CloudBridge Keychain và YouTube WebView riêng.
- Backend mới server/: Express/Postgres, xác thực bằng APP_PASSWORD rồi token 30 ngày, CAS revision để không ghi đè đồng bộ âm thầm, Gemini structured output, YouTube search cache; Dockerfile/railway.json.
- Kiểm thử tại mốc này: 16/16 Node app tests, 5/5 backend HTTP tests với store/provider giả; web build thành công. Chưa test native/IPA của bản mở rộng, chưa chạy API Gemini/YouTube thật, chưa nối Postgres thật.
- Đang tiếp tục: tạo Postgres Railway, cấu hình service/domain, UI mobile QA, native CI và IPA. Đã yêu cầu người dùng tự thêm GEMINI_API_KEY, YOUTUBE_API_KEY, APP_PASSWORD vào Railway; chưa nhận xác nhận hoàn tất.
- Không đánh dấu các phase hoàn tất. Cần thử trên iPhone thật sau khi CI qua. Quảng cáo YouTube/đăng nhập embedded có giới hạn, UI ghi rõ và có Safari fallback.

## 2026-09-13 — Codex — Kiểm thử PostgreSQL qua, bổ sung runtime CI

- Commit 36028b2 đã push. Backend CI 34768882758 thành công, gồm HTTP tests và PostgreSQL thật: ghi/đọc, tranh chấp revision, kết nối lại vẫn giữ dữ liệu.
- iOS CI 34768882781 dừng trước compile vì runner không có simulator iPhone 16/iOS 18.5. Bổ sung scripts/prepare-ios-simulator.mjs để cài runtime còn thiếu và tạo thiết bị, không bỏ qua XCTest.
- UI 390x844: SVG đồng nhất; play/pause/next, đổi thứ tự queue không reset vị trí, ẩn → quét lại → reload vẫn ẩn, khôi phục, yêu thích/tag/thêm playlist đã xác minh bằng trình duyệt.
- Railway: PostgreSQL đã Online; đã thêm tham chiếu DATABASE_URL vào IPTP, đang áp dụng/deploy và tạo endpoint.
