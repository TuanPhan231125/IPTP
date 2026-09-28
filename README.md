# VibePlayer

Ứng dụng iPhone có YouTube mobile toàn màn hình và thư viện nhạc/video local. Vuốt từ mép trái YouTube để mở Local; Local đọc trực tiếp folder trong Tệp → Trên iPhone, không sao chép cả thư viện vào ứng dụng.

Repository của dự án: [TuanPhan231125/IPTP](https://github.com/TuanPhan231125/IPTP).

## Trạng thái

YouTube không bị app chặn quảng cáo, không tải video vào Tệp và không được TPUGSOUND ép phát nền. Phát nền và quản lý video áp dụng cho media local. Xem [kế hoạch hiện tại](AI-HANDOFF/CURRENT-PLAN.md) và [nhật ký thay đổi](AI-HANDOFF/CHANGELOG.md) để biết kết quả build/kiểm thử thực tế.

## Chạy phần web

```sh
npm ci
npm test
npm run dev
```

Trình duyệt có chế độ nghe thử bằng nhạc mẫu Internet. Việc chọn folder iPhone và nghe nền cần bản iOS native.

## Build và lấy IPA

Workflow **Build Unsigned iOS IPA** chạy trên macOS của GitHub khi đẩy thay đổi mã lên `main`; cũng có thể chạy thủ công trong [Actions](https://github.com/TuanPhan231125/IPTP/actions).

Sau khi workflow thành công, tải artifact **VibePlayer-unsigned-ipa**, giải nén ZIP để lấy **App.ipa**, rồi ký/cài bằng Sideloadly. Không đổi tên ZIP mã nguồn thành IPA.

[Hướng dẫn GitHub, tải IPA và cài iPhone](HUONG-DAN-GITHUB-VA-TAI-IPA.md).

## Bàn giao giữa các AI

Đọc [AGENTS.md](AGENTS.md) và [AI-HANDOFF](AI-HANDOFF/README.md) trước khi tiếp tục công việc. Cập nhật kế hoạch và nhật ký khi thay đổi mã hoặc xác minh thêm kết quả.
