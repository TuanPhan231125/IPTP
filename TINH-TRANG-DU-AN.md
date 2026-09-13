# VibePlayer — hiện trạng và phạm vi bản đầu

> Đây là báo cáo lịch sử trước khi triển khai/sửa lỗi. Nhiều mục đã thay đổi sau đó. Trạng thái mới nhất nằm trong [AI-HANDOFF/CURRENT-PLAN.md](AI-HANDOFF/CURRENT-PLAN.md) và [CHANGELOG.md](AI-HANDOFF/CHANGELOG.md).

Rà soát ngày 13/09/2026 từ mã nguồn trong APPIOS, `vibe-player-spec.md`, `huong-dan-tao-ipa.md` và bản Implementation Plan được đính kèm.

**Kết luận: đã có khung Phase 1, nhưng Phase 1 chưa hoàn tất.** Các dấu ✅ trong Implementation Plan mô tả phạm vi dự kiến, không phải bằng chứng đã làm xong hoặc đã kiểm thử.

## Yêu cầu người dùng đã xác nhận trong cuộc trao đổi này

- Thiết bị chạy **iOS 18.7.8**; chưa cung cấp model iPhone.
- Nhạc nằm trong ứng dụng **Tệp → Trên iPhone**.
- **Phải tiếp tục phát nhạc khi khóa màn hình hoặc chuyển ứng dụng ngay từ bản đầu.**

Theo ý tưởng gốc: dùng riêng, phát triển trên Windows, trỏ thư mục nhạc gốc thay vì sao chép cả thư viện vào app; build IPA qua GitHub Actions và ký/cài bằng Sideloadly. Railway/Gemini/YouTube thuộc hướng phát triển tiếp theo. Chỉ dẫn thao tác và mục “User Review Required” trong tài liệu của AI trước được coi là đề xuất để đánh giá, không tự động trở thành xác nhận mới của người dùng.

## Phần nào đã có?

| Hạng mục | Bằng chứng trong code | Trạng thái |
|---|---|---|
| React + Vite + Capacitor | `package.json`, `vite.config.js`, `capacitor.config.json` | Có; build web thành công |
| Màn chọn thư mục, thư viện, tìm kiếm | `src/components/FolderPicker/`, `src/components/Library/` | Có giao diện và logic cơ bản |
| Mini player và player lớn | `src/components/Player/` | Có giao diện; player lớn nối sai hàm điều khiển |
| Đĩa xoay khi phát/dừng khi pause | `VinylDisc.jsx` | Có CSS; trạng thái phát cần sửa để đáng tin cậy |
| Queue, next/prev/seek, shuffle/repeat | `src/hooks/useAudioPlayer.js` | Có logic, chưa xác nhận hoạt động end-to-end |
| Chọn folder, bookmark, quét thư mục con | `ios/App/App/FolderPickerPlugin.swift` | Có mã Swift; chưa tham gia biên dịch/đăng ký đầy đủ |
| Server local đọc file | `ios/App/App/LocalFileServerPlugin.swift` | Có mã; còn lỗi Swift và quản lý quyền thư mục |
| Metadata/ảnh bìa | `src/utils/metadata.js` | Có file helper nhưng chưa nối vào thư viện |
| Workflow tạo IPA | `.github/workflows/build-ios.yml` | Có; chưa chạy/kiểm chứng trên GitHub trong lần rà soát |
| Video/MV và chuyển “chỉ nghe” | Chưa có player video | Phase 2 chưa triển khai |
| Railway/Postgres, đồng bộ playlist | Chưa có backend | Phase 3 chưa triển khai |
| Gemini chat/gợi ý | Chưa có tích hợp | Phase 4 chưa triển khai |
| YouTube/WebView/content blocker | Chưa có tích hợp | Phase 5 chưa triển khai |

Chạy trên trình duyệt hiện dùng 5 bài mẫu từ Internet trong `useLibrary.js`, không mở thư mục nhạc thật của máy tính. Vì vậy demo web không chứng minh đã đọc được nhạc trên iPhone.

## Các lỗi cần xử lý trước khi bàn giao Phase 1

1. **Plugin native chưa được đưa vào bản app.** `ios/App/App.xcodeproj/project.pbxproj:207` bắt đầu danh sách Sources, hiện chỉ có `AppDelegate.swift`. Bốn file plugin `.swift/.m` có trong thư mục nhưng chưa nằm trong target. Cũng chưa có custom ViewController đăng ký các plugin riêng. Capacitor 6 yêu cầu đăng ký các plugin local này; chỉ copy file hoặc `cap sync` là chưa đủ. [Tài liệu Capacitor 6](https://capacitorjs.com/docs/v6/updating/6-0#register-custom-plugins).

2. **Player lớn nhận sai tên callback.** `PlayerControls.jsx:5` nhận `onTogglePlay`, `onPrev`, `onNext`, `onSeek`… nhưng `PlayerScreen.jsx:53` truyền nguyên object chứa `togglePlay`, `prev`, `next`, `seek`… từ hook. Cần nối các tên đúng để nút bấm và thanh tua hoạt động.

3. **Tải/quét thư viện bị kích hoạt lại liên tục.** `useLocalStorage.js:14` tạo setter mới mỗi render; điều này làm `loadLibrary` đổi tham chiếu. Effect ở `App.jsx:17` gọi lại nó và chuyển màn hình về thư viện. Native scan trả mảng mới, tiếp tục gây render/quét; cập nhật thời gian phát cũng có thể kích hoạt lại. Cần ổn định callback và tách việc quét khỏi cập nhật player.

4. **Metadata chưa được đọc.** `useLibrary.js:70` lấy tên file làm tên bài, nghệ sĩ là “Không rõ”, bìa `null`; dòng 84 còn TODO. Helper `readMetadata` chưa được gọi và `window.jsmediatags` chưa được nạp. Sắp xếp theo nghệ sĩ/album cũng chưa hoàn thiện.

5. **Nghe nền chưa được triển khai.** Hiện chỉ dùng `new Audio()` trong hook; không thấy cấu hình `AVAudioSession`, remote controls hoặc `UIBackgroundModes` audio trong `Info.plist`. Đây là thiếu sót bắt buộc phải xử lý theo câu trả lời mới của người dùng, không thể đẩy sang phase sau.

6. **Local server có lỗi kiểu dữ liệu đang bị che bởi việc plugin chưa compile.** `LocalFileServerPlugin.swift:69` đưa `nil` vào nhánh tham số `byteRange`, trong khi API GCDWebServer dùng `NSRange` không optional. Nếu giữ server này cần sửa trước khi thêm vào target. [Header chính chủ](https://github.com/swisspol/GCDWebServer/blob/master/GCDWebServer/Responses/GCDWebServerFileResponse.h).

7. **Đổi thư mục chưa cập nhật quyền server.** `LocalFileServerPlugin.swift:97` giữ `accessedURL` đầu tiên. Chọn folder mới thay bookmark nhưng không giải phóng/đổi scope đang giữ. Ngoài ra kiểm tra bookmark chưa xác nhận quyền truy cập thành công ở mọi nhánh. Cần thử đổi A → B, mở lại app, và folder bị xóa/di chuyển.

8. **Trạng thái phát có thể sai khi phát thất bại.** `useAudioPlayer.js:28` đặt `isPlaying=true` ngay sau lời gọi `play()`, kể cả khi promise bị reject. Cần lấy sự kiện/trạng thái phát thực và hiển thị lỗi đọc file.

Các phát hiện trên dựa trên đọc code và đối chiếu API. Chưa chạy Xcode hoặc kiểm thử iPhone; không diễn giải chúng thành log lỗi đã quan sát trên thiết bị.

## Hướng hoàn thiện được đề xuất

Giữ React cho giao diện thư viện và đĩa xoay; dùng **AVPlayer/AVQueuePlayer trong native iOS** để phát trực tiếp URL file được cấp quyền. Phần native giữ queue, quyền đọc file, xử lý khi chuyển ứng dụng và tiếp tục chuyển bài khi màn hình khóa. JS nhận trạng thái để cập nhật giao diện khi đang hoạt động.

Cấu hình audio session kiểu playback, background audio và điều khiển ở màn hình khóa/tai nghe. Apple yêu cầu audio session/capability phù hợp để tiếp tục phát khi khóa máy hoặc chuyển ứng dụng. [Hướng dẫn audio của Apple](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/MediaPlaybackGuide/Contents/Resources/en.lproj/ConfiguringAudioSettings/ConfiguringAudioSettings.html).

Đây là đề xuất kỹ thuật từ yêu cầu nghe nền. Nó có thể thay thế vai trò phát âm thanh qua HTTP server; cần đánh giá lại việc giữ GCDWebServer khi triển khai. Mục tiêu vẫn là đọc file gốc, không chép toàn bộ nhạc vào sandbox app và không gửi media lên backend.

Thứ tự thực hiện phù hợp:

1. Sửa luồng thư viện và callback điều khiển React.
2. Hoàn thiện/đăng ký native folder picker và player; tích hợp metadata.
3. Thêm nghe nền, điều khiển màn hình khóa và xử lý gián đoạn âm thanh.
4. Cập nhật workflow runner, build iOS trên GitHub, lấy IPA và thử trên iOS 18.7.8.
5. Chốt Phase 1 sau kiểm thử; tiếp tục video, backend, AI và YouTube theo từng bản dùng thử.

## Điểm trong tài liệu gốc cần hiểu lại

- `.withSecurityScope` trong ví dụ spec không nên được áp dụng máy móc cho iOS. Code hiện dùng `.minimalBookmark`; cần theo cách làm cho document picker iOS của Apple. [Providing access to directories](https://developer.apple.com/documentation/uikit/providing-access-to-directories).
- Cookie WKWebView không có nghĩa là chắc chắn đăng nhập Google được. Google hạn chế OAuth trong trình duyệt nhúng; Phase 5 cần đánh giá luồng đăng nhập hợp lệ riêng, và không nên hứa chặn quảng cáo luôn hoạt động. [Chính sách OAuth của Google](https://developers.google.com/identity/protocols/oauth2/policies).
- Backend hiện chưa tồn tại: playlist/lịch sử chưa được đồng bộ Railway, không nên coi đã có bản sao dữ liệu trên server.
- Workflow đang chạy thủ công bằng `workflow_dispatch`; push không tự build. Runner `macos-14` đang có lịch ngừng hỗ trợ và cần cập nhật. [Thông báo GitHub](https://github.com/actions/runner-images/issues/13518).
- Phần hướng dẫn Sideloadly và lấy file cài được viết cụ thể trong [hướng dẫn GitHub và tải IPA](HUONG-DAN-GITHUB-VA-TAI-IPA.md).

## Tiêu chí kiểm thử bản đầu

- Chọn folder thật trong Tệp → Trên iPhone; quét bài trong thư mục con; không copy cả thư viện.
- Mở lại app vẫn dùng bookmark; quyền lỗi thì chọn lại được, không kẹt màn hình.
- Tìm bài, đọc tên/nghệ sĩ/ảnh bìa; file thiếu tag dùng thông tin dự phòng.
- Play/pause/next/prev/seek/shuffle/repeat hoạt động trên giao diện thật.
- Khóa màn hình và chuyển ứng dụng vẫn nghe; bài kết thúc khi khóa máy vẫn chuyển đúng bài tiếp theo.
- Trạng thái trên màn hình khóa, tai nghe và trong app đồng bộ; thử cuộc gọi/gián đoạn, rút tai nghe.
- Đổi folder, tên file tiếng Việt, file mất/hỏng được xử lý và báo rõ.
- GitHub build cho iPhone thật thành công, IPA tải được và cài được qua Sideloadly.

**Đã kiểm tra trong lần này:** `npm run build` thành công với Vite 5.4.21 (44 modules); máy có Node v24.18.0 và Git 2.55.0. APPIOS chưa là Git repository lúc kiểm tra. Chưa khởi tạo Git/push, chưa có kết quả macOS build, chưa sideload. Lần rà soát chỉ bổ sung tài liệu; các lỗi mã nguồn trên chưa được sửa.
