# Hướng dẫn tạo file .ipa để sideload lên iPhone (không cần Mac)

## Bối cảnh / Mục tiêu

- Máy phát triển: **Windows** (không có Mac, không có Xcode).
- Mục tiêu cuối: tạo ra file `.ipa` để cài lên iPhone cá nhân qua **Sideloadly** (dùng Apple ID miễn phí, không cần tài khoản Apple Developer Program trả phí $99/năm).
- App là **tiện ích/quản lý cá nhân**, dùng riêng, không phát hành lên App Store, không cần gửi cho người khác qua TestFlight.

Vì Apple chỉ cho phép build/sign app iOS bằng công cụ chạy trên macOS (Xcode, `xcodebuild`, `codesign`), pipeline dưới đây dùng **GitHub Actions** (có máy macOS ảo, miễn phí) để build ra file `.ipa` **chưa ký (unsigned)**, sau đó ký lại bằng **Sideloadly** ngay trên máy Windows với Apple ID miễn phí.

## Kiến trúc tổng thể

```
Code web app (HTML/CSS/JS hoặc React)
        │
        ▼
Capacitor (đóng gói thành project iOS native)
        │
        ▼
Push code lên GitHub
        │
        ▼
GitHub Actions (macOS runner) → xcodebuild archive (CODE_SIGNING_ALLOWED=NO)
        │
        ▼
File .ipa CHƯA KÝ (artifact tải về từ GitHub Actions)
        │
        ▼
Sideloadly (trên Windows) → ký bằng Apple ID miễn phí → cài vào iPhone
```

## Yêu cầu môi trường trên máy Windows

| Công cụ | Mục đích | Link |
|---|---|---|
| Node.js (LTS) | Chạy npm, build web app, Capacitor CLI | https://nodejs.org |
| Git for Windows | Đẩy code lên GitHub | https://git-scm.com |
| Tài khoản GitHub | Nơi lưu code + chạy GitHub Actions | https://github.com |
| Sideloadly | Ký và cài .ipa vào iPhone qua USB | https://sideloadly.io |
| iTunes hoặc Apple Devices app | Driver kết nối iPhone với Windows | Microsoft Store hoặc apple.com |
| Apple ID thường (miễn phí) | Dùng để ký app trong Sideloadly | Tài khoản Apple ID sẵn có |

**Không cần**: Mac, Xcode, tài khoản Apple Developer Program trả phí.

## Cấu trúc project

Ứng dụng nên được viết như một **web app thuần** (HTML/CSS/JS, hoặc framework như React/Vue nếu build ra static files), sau đó Capacitor bọc thành app native:

```
myapp/
├── www/                  # (hoặc dist/, thư mục chứa index.html, JS, CSS đã build)
│   ├── index.html
│   ├── app.js
│   └── style.css
├── capacitor.config.json
├── package.json
├── ios/                  # được tạo tự động bởi `npx cap add ios`
└── .github/
    └── workflows/
        └── build-ios.yml
```

Dữ liệu người dùng nên lưu **local trên thiết bị** (localStorage, IndexedDB) vì đây là app cá nhân, không cần backend/server.

## Các bước khởi tạo project

```bash
mkdir myapp && cd myapp
npm init -y
npm install @capacitor/core @capacitor/cli
npx cap init "TenApp" "com.example.tenapp"
```

Đặt code web app (index.html, js, css) vào thư mục `www/` (hoặc thư mục được khai báo trong `capacitor.config.json` ở trường `webDir`).

Thêm nền tảng iOS:

```bash
npx cap add ios
npx cap sync ios
```

Lệnh này tạo thư mục `ios/App/` chứa project Xcode — không cần mở bằng Xcode, chỉ cần tồn tại để GitHub Actions build hộ.

Mỗi khi sửa code web app, chạy lại:

```bash
npx cap sync ios
```

rồi commit + push lên GitHub để trigger build mới.

## Đẩy code lên GitHub

```bash
git init
git add .
git commit -m "init"
git remote add origin <URL_REPO_GITHUB_CUA_BAN>
git branch -M main
git push -u origin main
```

Có thể để repo **private** (GitHub Actions với macOS runner có giới hạn phút miễn phí/tháng cho private repo, nhưng đủ dùng cho build cá nhân không thường xuyên).

## GitHub Actions workflow — build .ipa chưa ký

Tạo file `.github/workflows/build-ios.yml`:

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

Cách chạy: vào tab **Actions** trên GitHub repo → chọn workflow **Build Unsigned iOS IPA** → **Run workflow** → chờ vài phút → tải file `App.ipa` trong mục **Artifacts**.

### Điểm quan trọng của workflow

- `CODE_SIGNING_ALLOWED=NO`: bắt buộc, để `xcodebuild` không cố tìm certificate/provisioning profile (vốn không có vì không dùng tài khoản Developer trả phí).
- `-sdk iphoneos` + `-destination 'generic/platform=iOS'`: build cho **thiết bị thật** (arm64), không phải Simulator — bắt buộc để Sideloadly cài được lên iPhone.
- `-configuration Release`: nên dùng Release thay vì Debug để tránh lỗi "integrity could not be verified" khi sideload trên iOS bản mới.

## Ký và cài bằng Sideloadly

1. Mở Sideloadly trên Windows.
2. Kết nối iPhone bằng cáp USB (đảm bảo đã cài driver qua iTunes/Apple Devices).
3. Kéo file `App.ipa` (chưa ký) vào Sideloadly.
4. Nhập Apple ID + mật khẩu (Apple ID thường, miễn phí) vào ô đăng nhập.
5. Nhấn **Start** — Sideloadly sẽ tự tạo certificate + provisioning profile và ký lại app, rồi cài vào máy.
6. Trên iPhone: vào **Cài đặt > Cài đặt chung > VPN & Quản lý thiết bị**, chọn profile vừa cài, nhấn **Trust (Tin cậy)**.
7. Mở app từ màn hình chính để kiểm tra.

## Giới hạn cần biết (Apple ID miễn phí)

- App tự hết hạn sau **7 ngày**, phải mở lại Sideloadly để ký lại (không cần build lại từ GitHub Actions, chỉ cần ký lại file .ipa cũ).
- Tối đa **3 app** được ký cùng lúc bằng 1 Apple ID miễn phí trên 1 thiết bị.
- Muốn tự động làm mới mà không cần cắm dây mỗi tuần: cân nhắc dùng thêm **AltStore/AltServer** (làm mới qua WiFi).

## Troubleshooting thường gặp

| Lỗi | Nguyên nhân khả dĩ | Cách xử lý |
|---|---|---|
| Build lỗi "scheme App not found" | Tên scheme trong Xcode project khác `App` | Kiểm tra tên chính xác trong `ios/App/App.xcworkspace`, sửa lại `-scheme` |
| "Unable to Install... integrity could not be verified" khi sideload | Build ở configuration Debug thay vì Release | Đổi `-configuration Debug` → `Release` trong workflow |
| Thiếu icon/asset khi build | Chưa cấu hình App Icon trong Xcode project | Có thể bỏ qua khi test, bổ sung sau bằng `@capacitor/assets` hoặc chỉnh trong `ios/App/App/Assets.xcassets` |
| GitHub Actions hết phút macOS (private repo) | Giới hạn phút miễn phí/tháng đã dùng hết | Chuyển repo sang public, hoặc chờ reset chu kỳ tháng sau |
