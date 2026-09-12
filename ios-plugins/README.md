# iOS Native Plugins cho VibePlayer

## Cách cài đặt

Sau khi chạy `npx cap add ios`, copy các file sau vào `ios/App/App/`:

1. `FolderPickerPlugin.swift`
2. `FolderPickerPlugin.m`
3. `LocalFileServerPlugin.swift`
4. `LocalFileServerPlugin.m`

## GCDWebServer dependency

Thêm dòng sau vào `ios/App/Podfile`, bên trong block `target 'App'`:

```ruby
pod 'GCDWebServer', '~> 3.5'
```

Sau đó chạy:
```bash
cd ios/App && pod install
```

## Plugins

### FolderPicker
- `checkBookmark()` — Kiểm tra bookmark folder đã lưu
- `pickFolder()` — Mở UI chọn folder
- `scanFolder()` — Quét file media trong folder đã chọn
- `clearBookmark()` — Xóa bookmark đã lưu

### LocalFileServer
- `getServerUrl()` — Lấy URL server local
- `startFileServer()` — Khởi động server phục vụ file

Server chạy tại `http://localhost:8765`
Để phát file: `http://localhost:8765/file?path=<encoded_file_path>`
