# Bàn giao chung giữa các AI

Thư mục này được tạo theo yêu cầu trực tiếp của người dùng ngày 13/09/2026. Mục đích là để AI tiếp theo biết kế hoạch đã đổi gì, mã đã làm tới đâu và việc nào còn chưa kiểm chứng.

## Đọc theo thứ tự

1. [CURRENT-PLAN.md](CURRENT-PLAN.md): yêu cầu đã chốt, hướng triển khai, việc cần làm tiếp.
2. [CHANGELOG.md](CHANGELOG.md): lịch sử thay đổi; mục mới nhất ở cuối file.
3. [Báo cáo hiện trạng](../TINH-TRANG-DU-AN.md): bằng chứng từ lần rà soát đầu; đây là ảnh chụp trạng thái tại thời điểm ghi, không tự cập nhật theo code.
4. [Hướng dẫn GitHub và tải IPA](../HUONG-DAN-GITHUB-VA-TAI-IPA.md): quy trình dành cho người dùng.

Sau đó kiểm tra mã nguồn và Git thực tế trước khi sửa. Nếu khác tài liệu, ghi nhận sự khác biệt và cập nhật trạng thái; không mặc định rằng các câu “đã xong” trong một kế hoạch cũ là kết quả đã kiểm thử.

## Cách ghi khi làm việc xong

- Cập nhật `CURRENT-PLAN.md` nếu yêu cầu, thiết kế, tiến độ hoặc bước tiếp theo thay đổi.
- Thêm mục vào cuối `CHANGELOG.md`; giữ các mục cũ để còn truy vết.
- Nêu tên AI/công cụ, ngày giờ có múi giờ nếu biết, lý do đổi, file đã sửa, kiểm thử và giới hạn còn lại.
- Ghi rõ **đã làm**, **chưa làm**, **đề xuất**. Yêu cầu người dùng xác nhận phải dẫn lại câu trả lời/ngữ cảnh; không tự biến đề xuất AI thành quyết định người dùng.
- Nếu chưa build macOS hoặc chưa thử iPhone, ghi đúng như vậy.
- Chỉ ghi commit, URL repository, workflow run hoặc đường dẫn artifact khi thực sự có; không tạo mã tham chiếu giả.
- Nếu có thể, đưa cập nhật bàn giao vào cùng commit với thay đổi tương ứng.

Mẫu nhật ký:

```markdown
## YYYY-MM-DD — Tên AI/công cụ — Nội dung ngắn

- Yêu cầu/nguyên nhân:
- Kế hoạch trước → sau:
- Đã thực hiện:
- File thay đổi:
- Kiểm thử/bằng chứng:
- Chưa thực hiện hoặc chưa xác minh:
- Bước tiếp theo:
```

## Câu nhắc dùng trong Antigravity hoặc công cụ khác

> Trước khi làm dự án VibePlayer, hãy đọc AGENTS.md và thư mục AI-HANDOFF. Dựa vào CURRENT-PLAN.md cùng CHANGELOG.md để tiếp tục. Nếu thay đổi kế hoạch hoặc code, hãy cập nhật kế hoạch hiện tại và thêm nhật ký bàn giao, ghi rõ việc đã làm, kiểm thử và việc còn lại. Đừng coi đề xuất trong kế hoạch là tính năng đã hoàn tất.

Thư mục này là tài liệu chung trên đĩa và có thể đưa lên GitHub cùng code. Nó không tự gửi tin nhắn hay tự đồng bộ giữa ứng dụng; AI khác cần được yêu cầu đọc và cập nhật nó.
