# Vibe Player — Spec kỹ thuật cho AI Vibe-coding

## 1. Tổng quan dự án

App nghe nhạc/video cá nhân trên iPhone, viết bằng web tech + Capacitor, build và sideload không cần Mac. Người dùng trỏ tới file/folder nhạc-video trên máy, app tự nhận diện là audio hay video để hiển thị đúng chế độ phát. Có trợ lý AI hỏi gu nhạc rồi gợi ý bài mới, mở nghe qua YouTube ngay trong app.

**Chỉ dùng cho 1 người dùng (chính chủ), không phát hành App Store, không cần hỗ trợ nhiều thiết bị/nhiều tài khoản.**

## 2. Ràng buộc & quyết định kỹ thuật đã chốt

| Hạng mục | Quyết định |
|---|---|
| Máy dev | Windows, không có Mac, không có Xcode |
| Cách phân phối lên iPhone | Build .ipa chưa ký qua GitHub Actions → ký lại bằng Sideloadly với Apple ID miễn phí |
| Framework | Capacitor (bọc web app HTML/CSS/JS hoặc React thành app native iOS) |
| Cách truy cập file nhạc | **Trỏ tới folder gốc** bằng security-scoped bookmark (KHÔNG copy file vào app) — xem rủi ro ở mục 7 |
| Backend | Railway (Node.js + Postgres) — **tài khoản đã có sẵn, đã có Gemini API key sẵn sàng, không cần hướng dẫn tạo mới** |
| Phạm vi bản đầu tiên | Không cố định — AI tự quyết định làm tới phase nào trước dựa theo độ phức tạp thực tế khi code (xem lộ trình ở mục 6), miễn là mỗi phase bàn giao phải chạy/sideload test được độc lập |

## 3. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────┐
│   Ứng dụng trên iPhone (Capacitor)           │
│  ┌─────────────────────┐ ┌─────────────────┐ │
│  │ Thư viện nhạc/video   │ │ WebView YouTube │ │
│  │ (trỏ folder ngoài,    │ │ (content-block  │ │
│  │  security-scoped      │ │  + đăng nhập     │ │
│  │  bookmark)             │ │  Google)         │ │
│  └─────────────────────┘ └─────────────────┘ │
└───────────────────┬───────────────────────────┘
                     │ HTTPS
                     ▼
        ┌───────────────────────────┐
        │ Railway backend             │
        │ Node.js + Postgres           │
        │ Giữ API key an toàn          │
        │ Lưu playlist / mood profile  │
        │ / lịch sử nghe                │
        └─────────────┬──────────────┘
              ┌────────┴────────┐
              ▼                 ▼
       ┌────────────┐   ┌──────────────────┐
       │ Gemini API  │   │ YouTube Data API  │
       │ Gợi ý theo  │   │ Tìm video & tạo    │
       │ vibe        │   │ playlist           │
       └────────────┘   └──────────────────┘
```

Nguyên tắc quan trọng: **file media không bao giờ đi qua backend** — chỉ metadata (tên playlist, tag, mood profile, lịch sử nghe) mới được đồng bộ lên Railway. Điều này giữ chi phí server thấp và đảm bảo dữ liệu quan trọng (không phải file nặng) luôn còn dù app bị cài lại từ đầu.

## 4. Chi tiết tính năng

### 4.1 Thư viện nhạc/video local

- Dùng `UIDocumentPickerViewController` (qua Capacitor Filesystem hoặc plugin native tùy chỉnh) để người dùng chọn folder chứa nhạc/video.
- Lưu **security-scoped bookmark** (`NSURL.bookmarkData(options: .withSecurityScope, ...)`) để lần sau mở app không cần chọn lại folder.
- Khi app khởi động: gọi `startAccessingSecurityScopedResource()` trên bookmark đã lưu trước khi đọc file. Nếu bookmark lỗi (xem mục 7), hiện màn hình yêu cầu chọn lại folder — làm gọn nhẹ, không mất dữ liệu playlist/metadata vì đã đồng bộ server riêng.
- Quét các file có đuôi `.mp3 .m4a .wav .aac` (audio) và `.mp4 .mov .m4v` (video) trong folder được chọn (kể cả subfolder nếu có).
- Đọc metadata bằng thư viện `jsmediatags` (đọc ID3 tag: tên bài, nghệ sĩ, album, ảnh bìa) — chạy thuần JS, không cần native.

### 4.2 Hai chế độ phát

- **File audio-only** → hiển thị UI đĩa than xoay tròn (xem mục 4.3).
- **File video** → hiển thị trình phát video toàn màn hình bình thường.
- **Chế độ "chỉ nghe" cho file video**: KHÔNG cần tách/transcode audio riêng. Tạo `AVPlayer` phát file video như bình thường nhưng không gắn `AVPlayerLayer` vào view nào — audio track vẫn phát qua loa/tai nghe, phần hiển thị thay bằng UI đĩa xoay giống chế độ audio-only. Có toggle để người dùng chuyển qua lại giữa "xem MV" và "chỉ nghe" cho cùng 1 file video.

### 4.3 Vinyl UI (đĩa than xoay)

- Ảnh bìa (cover art từ ID3 tag, hoặc thumbnail đầu video nếu là file video ở chế độ chỉ-nghe) làm mặt đĩa.
- Animation CSS xoay tròn liên tục khi đang phát, dừng lại (không giật) khi pause.
- Tùy chỉnh (lưu theo từng bài hoặc theo setting chung, đồng bộ lên server):
  - Tốc độ xoay
  - Có/không có tay cầm kim (tonearm) đè lên đĩa
  - Màu viền đĩa / theme sáng-tối

### 4.4 Backend Railway

- Stack: Node.js (Express) + Postgres (Railway addon).
- Chỉ phục vụ 1 người dùng → traffic cực nhẹ, nằm gọn trong gói Hobby $5/tháng của Railway.
- Vai trò:
  1. Proxy gọi Gemini API và YouTube Data API — **API key chỉ tồn tại trong biến môi trường của Railway, không bao giờ nhúng vào code client/app** (ai giải nén .ipa ra sẽ không lấy được key).
  2. CRUD cho: playlists, tags, mood profile, listening history, vinyl UI settings.
- Bảng dữ liệu gợi ý:
  - `mood_profile` (gu nhạc, ngôn ngữ, nghệ sĩ yêu thích — nhập 1 lần lúc onboarding)
  - `playlists` (tên, danh sách bài — có thể là file local hoặc video YouTube được AI gợi ý)
  - `listening_history` (bài gì, lúc nào, từ nguồn nào)
  - `ui_settings` (tuỳ chỉnh đĩa xoay)

### 4.5 AI gợi ý nhạc theo tâm trạng (Gemini)

Flow:
1. Onboarding (chạy 1 lần, sau đó lưu vào `mood_profile` trên server): hỏi gu nhạc, ngôn ngữ, vài nghệ sĩ/bài hát yêu thích.
2. Người dùng chat nhanh khi muốn nghe gì đó mới ("hôm nay muốn nghe chill", hoặc chọn 1 bài local làm mẫu) → gửi lên backend.
3. Backend build prompt gồm `mood_profile` + input hiện tại, gọi Gemini xin về danh sách tên bài + nghệ sĩ có vibe tương tự (Gemini gợi ý dựa trên kiến thức về thể loại/gu nhạc, KHÔNG phân tích file audio thật).
4. Backend query **YouTube Data API** (search endpoint) để lấy video ID tương ứng từng bài gợi ý, ghép thành 1 playlist, trả về app.
5. App mở playlist đó trong WebView YouTube (mục 4.6).

### 4.6 WebView YouTube: chặn quảng cáo + đăng nhập

- Nhúng `WKWebView` riêng (cần viết 1 Capacitor plugin native nhỏ bằng Swift, vì webview mặc định của Capacitor dùng để chạy chính app, không phải để browse trang ngoài).
- Áp dụng `WKContentRuleList` (API content-blocking chính thức của Apple, cùng cơ chế Safari Content Blocker dùng) để lọc bớt phần tử quảng cáo trên trang YouTube.
- Đăng nhập Google: `WKWebView` tự giữ cookie session như Safari, đăng nhập 1 lần là nhớ cho các lần mở sau (trừ khi cache app bị xoá).
- **Lưu ý cần biết**: chặn quảng cáo trên YouTube nằm ngoài Điều khoản dịch vụ của YouTube. Đây không phải hành vi xâm nhập/hack hệ thống, chỉ là áp dụng content-filtering rule hợp lệ của Apple lên 1 webview, nhưng Google có thể thay đổi cơ chế phía họ theo thời gian khiến rule cần cập nhật định kỳ.

## 5. Pipeline build & deploy (không cần Mac)

### 5.1 Yêu cầu công cụ trên Windows

| Công cụ | Mục đích |
|---|---|
| Node.js (LTS) | Chạy npm, Capacitor CLI |
| Git for Windows | Đẩy code lên GitHub |
| Tài khoản GitHub | Lưu code + chạy GitHub Actions (build macOS runner miễn phí) |
| Sideloadly | Ký và cài .ipa vào iPhone qua USB |
| iTunes / Apple Devices app | Driver kết nối iPhone với Windows |
| Apple ID thường (miễn phí) | Dùng để ký app trong Sideloadly |

**Không cần**: Mac, Xcode, tài khoản Apple Developer Program trả phí.

### 5.2 Cấu trúc project

```
vibeplayer/
├── www/                      # web app: index.html, JS, CSS (hoặc build output React)
├── ios/                      # tạo tự động bởi `npx cap add ios`
│   └── App/App/
│       └── (Swift plugin tùy chỉnh cho WebView + content blocker nếu có)
├── server/                   # backend Railway riêng (Node.js + Express + Postgres)
│   ├── index.js
│   ├── routes/
│   └── package.json
├── capacitor.config.json
├── package.json
└── .github/workflows/build-ios.yml
```

Khởi tạo:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "VibePlayer" "com.example.vibeplayer"
npx cap add ios
npx cap sync ios
```

Mỗi lần sửa code web app, chạy lại `npx cap sync ios` rồi commit + push để trigger build mới.

### 5.3 Build .ipa chưa ký qua GitHub Actions

File `.github/workflows/build-ios.yml`:

```yaml
name: Build Unsigned iOS IPA

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install

      - name: Sync Capacitor
        run: npx cap sync ios

      - name: Build unsigned archive
        run: |
          cd ios/App
          xcodebuild -workspace App.xcworkspace \
            -scheme App \
            -configuration Release \
            -sdk iphoneos \
            -destination 'generic/platform=iOS' \
            -archivePath $PWD/build/App.xcarchive \
            CODE_SIGNING_ALLOWED=NO \
            archive

      - name: Package as ipa
        run: |
          cd ios/App/build
          mkdir Payload
          cp -r App.xcarchive/Products/Applications/App.app Payload/
          zip -r App.ipa Payload

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: App-unsigned-ipa
          path: ios/App/build/App.ipa
```

Điểm quan trọng: `CODE_SIGNING_ALLOWED=NO` (không cần cert), `-sdk iphoneos` + `generic/platform=iOS` (build cho thiết bị thật, không phải Simulator), `-configuration Release` (tránh lỗi "integrity could not be verified" khi sideload).

Chạy: tab **Actions** trên GitHub → chọn workflow → **Run workflow** → tải `App.ipa` từ **Artifacts**.

### 5.4 Ký và cài bằng Sideloadly

1. Kết nối iPhone qua USB.
2. Kéo `App.ipa` vào Sideloadly.
3. Đăng nhập Apple ID miễn phí → Sideloadly tự tạo certificate + provisioning profile, ký lại, cài vào máy.
4. Trên iPhone: **Cài đặt > Cài đặt chung > VPN & Quản lý thiết bị** → Trust profile vừa cài.
5. App hết hạn sau 7 ngày (giới hạn Apple ID miễn phí) → mở lại Sideloadly ký lại file .ipa cũ (không cần build lại trừ khi có code mới).

## 6. Lộ trình triển khai đề xuất

AI tự quyết định tốc độ/gộp phase tùy độ phức tạp thực tế, miễn mỗi phase bàn giao đều build + sideload test được:

1. **Phase 1** — Import nhạc local (bookmark folder) + player audio cơ bản + đĩa xoay tĩnh (chưa cần tuỳ chỉnh)
2. **Phase 2** — Chế độ video/MV + toggle "chỉ nghe" cho file video
3. **Phase 3** — Dựng Railway backend (Node.js + Postgres), đồng bộ playlist/history/settings hai chiều
4. **Phase 4** — Tích hợp Gemini mood chat (onboarding + gợi ý theo vibe)
5. **Phase 5** — WebView YouTube (plugin native) + content blocker + tích hợp YouTube Data API

## 7. Rủi ro & lưu ý kỹ thuật cần biết

| Rủi ro | Chi tiết | Cách giảm nhẹ |
|---|---|---|
| Security-scoped bookmark có thể mất hiệu lực | Vì đã chọn cách trỏ folder gốc thay vì copy file, bookmark gắn với chữ ký ứng dụng — mỗi lần Sideloadly ký lại bằng chứng chỉ mới (kể cả khi chỉ re-sign, chưa chắc đổi code) có khả năng làm bookmark cũ không dùng được | App cần tự phát hiện bookmark lỗi khi khởi động, hiện màn hình yêu cầu chọn lại folder một cách nhẹ nhàng — không mất playlist/history vì đã sync server |
| Certificate Apple ID miễn phí hết hạn sau 7 ngày | Nếu quên ký lại, iOS có thể tự gỡ app → mất luôn dữ liệu local (Documents) nếu có | Toàn bộ dữ liệu quan trọng (không phải file media) nên ưu tiên đồng bộ server ngay khi thay đổi, không chỉ dựa vào local |
| Giới hạn 3 app cùng lúc với 1 Apple ID miễn phí | Không liên quan trực tiếp code, nhưng ảnh hưởng testing nếu máy đang sideload nhiều app khác | Gỡ bớt app cũ không cần thiết khi test |
| Chặn quảng cáo YouTube ngoài ToS của Google | Có thể cần cập nhật content-blocker rule theo thời gian nếu Google thay đổi cấu trúc trang | Thiết kế rule dễ update (file JSON riêng, không hardcode logic rải rác) |
| WebView YouTube cần plugin native riêng | Không làm được thuần bằng web/JS trong Capacitor mặc định | Viết 1 Capacitor plugin Swift nhỏ, chỉ cần build lại phần native này khi thay đổi, phần UI/logic khác vẫn thuần JS |

## 8. Biến môi trường cần dùng

Trên Railway (đã có sẵn tài khoản + Gemini key, chỉ cần cấu hình):

```
GEMINI_API_KEY=<key có sẵn từ Google AI Studio>
YOUTUBE_API_KEY=<API key riêng cho YouTube Data API v3, tạo trong cùng Google Cloud project>
DATABASE_URL=<Railway tự cấp khi thêm Postgres addon>
```

Trên client (app): KHÔNG chứa bất kỳ API key nào — mọi cuộc gọi AI/YouTube đều đi qua endpoint riêng trên Railway backend.
