# Native code VibePlayer

Mã đang dùng nằm trong `ios/App/App/`: FolderAccessStore.swift, FolderPickerPlugin.swift, NativeAudioPlugin.swift và VibeBridgeViewController.swift.

Các file Swift/Objective-C còn lại trong thư mục `ios-plugins/` là bản tham khảo cũ. Không copy chúng vào app: cơ chế hiện tại dùng CAPBridgedPlugin bằng Swift và phát trực tiếp bằng AVPlayer, không dùng GCDWebServer.

Main.storyboard phải mở VibeBridgeViewController; controller này đăng ký FolderPicker và NativeAudio trong capacitorDidLoad. Mỗi file Swift phải có trong Sources của target App.

CI chạy AppTests/NativeBridgeTests.swift thông qua scripts/configure-ios-tests.rb để xác nhận storyboard thật, plugin exports và vòng gọi JavaScript/native, trước khi đóng gói IPA.

Đọc AI-HANDOFF/CURRENT-PLAN.md ở gốc repository trước khi thay đổi kiến trúc.
