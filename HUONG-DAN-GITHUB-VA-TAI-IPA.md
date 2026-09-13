# VibePlayer: đưa mã lên GitHub và lấy file IPA

Hướng dẫn dành cho thư mục `C:\Users\DINH TUAN\OneDrive\Desktop\APPIOS`, kiểm tra ngày 13/09/2026.

Repository đang dùng là **[TuanPhan231125/IPTP](https://github.com/TuanPhan231125/IPTP)**. Mã đã được push; bạn không cần tạo repository hoặc khởi tạo Git lại. Để tải bản mới, bắt đầu từ bước 4–6 bên dưới. Xem [kế hoạch hiện tại](AI-HANDOFF/CURRENT-PLAN.md) và [nhật ký](AI-HANDOFF/CHANGELOG.md) để biết commit/build nào đã được kiểm chứng. Thử nhạc local và nghe nền trên iPhone vẫn là bước cần thực hiện trước khi chốt Phase 1.

## 1. Cần up những gì?

Đưa **nội dung dự án APPIOS** lên một repository (kho mã nguồn). Dùng Git để giữ nguyên cấu trúc thư mục và tự bỏ qua file được khai báo trong `.gitignore`.

| File/thư mục đang có | Đưa lên? | Mục đích |
|---|---|---|
| `src/` | Có | Giao diện và logic React |
| `ios/` | Có, trừ phần được `.gitignore` bỏ qua | Project iOS, mã Swift, cấu hình, icon |
| `.github/workflows/build-ios.yml` | Bắt buộc | Hướng dẫn GitHub tạo IPA |
| `package.json`, `package-lock.json` | Bắt buộc | Danh sách và phiên bản thư viện |
| `capacitor.config.json`, `vite.config.js`, `index.html` | Bắt buộc | Cấu hình đóng gói app |
| `.gitignore`, `ios/.gitignore` | Có | Quy tắc bỏ qua file |
| `ios-plugins/` | Có ở hiện trạng này | Bản nguồn/tham khảo plugin do AI trước để lại; không tự được biên dịch từ đây |
| Các file `.md` | Có | Ý tưởng, hướng dẫn và báo cáo |
| `AI-HANDOFF/`, `AGENTS.md` | Có | Kế hoạch và nhật ký chung cho Codex/Antigravity |
| `node_modules/` | Không | GitHub cài lại thư viện |
| `dist/` | Không | GitHub build lại phần web |
| `ios/App/Pods/`, `ios/App/build/` | Không | Thư viện và kết quả build trên macOS |
| `ios/App/App/public/` và config được Capacitor tạo | Không | Workflow chạy `cap sync` để tạo lại |
| Nhạc cá nhân, mật khẩu, API key, file `.ipa` tải về | Không | Không phải mã nguồn cần build |

Hai file `.gitignore` hiện có bỏ qua thư viện/build, `.env`, `.env.*` (ngoại trừ `.env.example`), `.ipa`, chứng chỉ và `.local-tools/`. IPA là kết quả tải về, không cần đưa vào lịch sử Git.

Trên trang Code của repository, phải thấy `src`, `ios`, `.github`, `package.json` ngay ở tầng đầu tiên. Đừng tạo thêm một tầng `APPIOS/` bao ngoài chúng, cũng đừng chỉ upload một file ZIP chứa dự án: workflow cần nằm đúng ở `.github/workflows/` tại gốc repository.

## 2. Tạo repository trên màn hình GitHub bạn đang mở

Phần này là hướng dẫn cho lần tạo dự án mới. Với IPTP đã tồn tại, bỏ qua bước 2 và 3.

1. Bấm nút xanh **Create repository** ở bên trái ảnh bạn gửi, hoặc mở [trang tạo repository](https://github.com/new).
2. **Owner**: chọn tài khoản của bạn.
3. **Repository name**: nhập `vibeplayer`.
4. Chọn **Private** để giữ mã riêng tư.
5. Để trống **Add README**; chọn **None** cho `.gitignore` và license. Dự án trên máy đã có nội dung sẵn.
6. Bấm **Create repository**.
7. Ở trang kế tiếp, chọn **HTTPS** và sao chép URL repository. URL có dạng `https://github.com/TEN_TAI_KHOAN/vibeplayer.git`.

Các lựa chọn tạo repository được đối chiếu với [hướng dẫn GitHub](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository).

Private repo có hạn mức GitHub Actions miễn phí tùy gói tài khoản; runner macOS tiêu thụ hạn mức nhanh hơn Linux. Không nên hiểu tài liệu cũ là miễn phí không giới hạn. Có thể xem hạn mức trong phần Billing của tài khoản. [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

## 3. Đưa thư mục APPIOS lên bằng PowerShell

Máy này đã có Git và Node.js khi kiểm tra, nên có thể dùng ngay. Mở Start, tìm **PowerShell**, rồi chạy từng khối dưới đây. Nếu lệnh báo lỗi, dừng tại lệnh đó để xử lý.

**Bước A — mở đúng thư mục và khởi tạo Git (chỉ lần đầu):**

```powershell
Set-Location -LiteralPath 'C:\Users\DINH TUAN\OneDrive\Desktop\APPIOS'
git init -b main
```

**Bước B — đặt tên người tạo bản lưu:**

Thay hai giá trị ví dụ bằng tên và email Git của bạn. Đây là thông tin ghi trên commit, không phải mật khẩu đăng nhập. Có thể dùng email noreply được GitHub cung cấp trong Settings → Emails nếu muốn giữ email cá nhân riêng tư.

```powershell
git config user.name "TEN_CUA_BAN"
git config user.email "EMAIL_GIT_CUA_BAN"
```

Hai lệnh chỉ áp dụng cho dự án này. [Giải thích tên Git](https://docs.github.com/en/get-started/git-basics/setting-your-username-in-git).

**Bước C — chọn file để lưu và xem danh sách:**

```powershell
git add .
git diff --cached --name-only
```

Dấu chấm nghĩa là xét toàn bộ nội dung dự án hiện tại; `.gitignore` tự lọc file. Trong danh sách phải có `.github/workflows/build-ios.yml`, `src/...`, `ios/App/App.xcodeproj/project.pbxproj`, `ios/App/Podfile`, `package.json`. Không nên có `node_modules`, nhạc hay file chứa key.

**Bước D — tạo bản lưu trên máy:**

```powershell
git commit -m "Luu ma nguon VibePlayer ban dau"
```

**Bước E — kết nối và đẩy lên GitHub:**

Thay toàn bộ URL ví dụ bằng URL vừa sao chép ở bước 2.

```powershell
git remote add origin 'https://github.com/TEN_TAI_KHOAN/vibeplayer.git'
git push -u origin main
```

Trình tự này dựa trên [hướng dẫn đưa code có sẵn lên GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github).

Nếu Git mở cửa sổ đăng nhập, chọn đăng nhập bằng trình duyệt và hoàn tất trên GitHub. Git for Windows thường dùng Git Credential Manager để xử lý đăng nhập và 2FA. [Hướng dẫn xác thực Git](https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git).

Cuối cùng, tải lại trang repository bằng F5. Các file hiện trên tab **Code** là đã đưa lên thành công. `git commit` chỉ lưu trên máy; `git push` mới gửi lên GitHub.

## 4. Chạy build để tạo IPA

Workflow **Build Unsigned iOS IPA** tự chạy khi push thay đổi code, tests hoặc workflow lên `main`. Chỉ thay tài liệu sẽ không tự build. Bạn cũng có thể chạy thủ công như sau.

Sau khi phần iOS đã được sửa và đẩy lên:

1. Mở repository `vibeplayer`.
2. Chọn tab **Actions**.
3. Nếu GitHub yêu cầu bật Actions, bật cho repository này.
4. Bên trái chọn **Build Unsigned iOS IPA**.
5. Bấm **Run workflow** → chọn nhánh **main** → bấm **Run workflow** trong menu.
6. Mở lượt chạy vừa tạo; chờ trạng thái hoàn tất. Dấu xanh nghĩa là workflow thành công, dấu đỏ nghĩa là có lỗi.

Nút chạy thủ công cần file workflow có trong nhánh mặc định của repository. [Hướng dẫn chạy workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

Workflow chạy: cài thư viện → Node tests → build web → đồng bộ Capacitor/CocoaPods → kiểm tra hai plugin trên iOS Simulator → build iOS Release cho thiết bị thật → đóng gói `App.ipa` → Artifacts. Các bước macOS chạy trên GitHub, không cần `pod install` hoặc `xcodebuild` trên Windows.

Workflow hiện dùng **macOS 15, Xcode 16.4 và Node 24**. Artifact IPA được giữ 14 ngày; nên lưu bản cần dùng về máy.

## 5. Chính xác tải IPA ở đâu?

Khi workflow thành công:

1. Vào **Actions** → mở lượt chạy thành công vừa rồi.
2. Ở trang tổng quan lượt chạy (**Summary**), kéo xuống mục **Artifacts**.
3. Bấm **VibePlayer-unsigned-ipa**. Đây là tên được khai báo trong workflow của dự án.
4. Trình duyệt tải một file ZIP, thường vào **Downloads**.
5. Bấm chuột phải file ZIP → **Extract All… / Giải nén tất cả…** → **Extract**.
6. Mở thư mục vừa giải nén. Lấy file **App.ipa** bên trong.

```text
Artifacts: VibePlayer-unsigned-ipa
          ↓ tải xuống
VibePlayer-unsigned-ipa.zip
          ↓ giải nén ZIP bên ngoài
App.ipa
          ↓ đưa vào Sideloadly
iPhone
```

Bạn phải đăng nhập GitHub và có quyền đọc repository để tải artifact. [Hướng dẫn tải artifact](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts).

**Không đổi tên ZIP bên ngoài thành `.ipa`. Không giải nén tiếp `App.ipa`.** File **Code → Download ZIP** chỉ chứa mã nguồn, không phải IPA cài lên iPhone. Workflow hiện không đưa IPA vào mục Releases.

## 6. Cài lên iPhone bằng Sideloadly

1. Tải và cài từ [Sideloadly chính thức](https://sideloadly.io/). Với Windows, làm theo yêu cầu iTunes/iCloud bản web mà trang này liệt kê.
2. Cắm iPhone bằng USB, mở khóa máy, chọn **Tin cậy máy tính này** nếu được hỏi.
3. Mở Sideloadly, kiểm tra đã thấy iPhone.
4. Kéo **App.ipa** vào Sideloadly.
5. Điền Apple ID, nhấn **Start** và hoàn tất đăng nhập/2FA ngay trong quy trình Sideloadly.
6. Khi cài xong: trên iPhone vào **Cài đặt → Cài đặt chung → VPN & Quản lý thiết bị**, chọn tài khoản nhà phát triển và **Tin cậy** nếu được yêu cầu.

[FAQ Sideloadly](https://sideloadly.io/faq) có hướng dẫn kết nối, tin cậy và cài đè ứng dụng.

Trên iOS 18.7.8, nếu máy yêu cầu **Developer Mode**, vào **Cài đặt → Quyền riêng tư & Bảo mật → Chế độ nhà phát triển**, bật rồi khởi động lại và xác nhận theo máy. Tùy trạng thái thiết bị, mục này có thể chỉ xuất hiện sau khi cài ứng dụng phát triển. [Apple hướng dẫn Developer Mode](https://developer.apple.com/videos/play/wwdc2022/110344/).

Apple ID miễn phí thường ký app dùng trong 7 ngày. Sau đó cần ký lại; nếu không sửa code có thể dùng lại IPA đã tải. Sideloadly cũng có chức năng tự làm mới. Muốn giữ dữ liệu khi cài đè, dùng cùng Apple ID và cùng bundle ID; tránh gỡ app trước. Hết hạn chữ ký không nên được diễn giải thành việc iOS chắc chắn tự xóa app và dữ liệu. [Giới hạn và cài đè trong FAQ](https://sideloadly.io/faq).

## 7. Những lần cập nhật sau

Khi code đã được chỉnh xong, mở PowerShell tại APPIOS rồi chạy:

```powershell
npm run build
git add .
git diff --cached --name-only
git commit -m "Cap nhat VibePlayer"
git push
```

Sau đó lặp lại bước 4–6. Workflow tự build web và sync iOS, nên không cần upload `dist/` hoặc tự chạy CocoaPods trên Windows. Không cần tạo repository mới mỗi lần sửa.

## 8. Nếu bị kẹt

| Hiện tượng | Làm gì tiếp |
|---|---|
| Không thấy workflow trong Actions | Kiểm tra file `.github/workflows/build-ios.yml` nằm ở gốc repo, trong nhánh mặc định |
| Không có nút Run workflow | Chọn đúng workflow bên trái, kiểm tra nhánh mặc định và quyền ghi repository |
| Build đỏ | Mở lượt chạy → job `build` → bước bị đỏ; lấy thông báo lỗi đầu tiên có ý nghĩa cùng các dòng xung quanh |
| Build đỏ và không có IPA | Cần sửa lỗi build rồi chạy lại; workflow hiện chỉ upload IPA nếu đóng gói thành công |
| `remote origin already exists` | Chạy `git remote -v` xem URL; nếu sai, sửa bằng `git remote set-url origin 'URL_DUNG'` |
| `nothing to commit` | Không có thay đổi mới để lưu; kiểm tra `git status`, tiếp tục push nếu còn commit chưa gửi |
| Push bị `non-fast-forward` | Repo trên GitHub có nội dung khác; lấy thông báo để xử lý, không dùng force push theo phỏng đoán |
| Sideloadly không thấy điện thoại | Kiểm tra cáp, mở khóa/Tin cậy và driver theo FAQ chính thức |

Luôn tải IPA từ lượt chạy thành công được ghi trong AI-HANDOFF. Một lượt build đỏ không tạo ra bản IPA đã sửa; việc tải lại artifact của lượt xanh cũ sẽ vẫn lấy app cũ. Cài đè bằng cùng Apple ID/bundle ID trong Sideloadly để giữ dữ liệu hiện có.
