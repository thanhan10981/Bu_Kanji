# Nghiệm thu thực tế — lần kiểm tra mới nhất

Ngày: 2026-11-03. Phạm vi: bốn mục người dùng yêu cầu; chỉ DB test, chưa deploy production.

## Kết quả môi trường thực tế

| Kiểm tra | Trạng thái | Bằng chứng |
| --- | --- | --- |
| Checklist yêu cầu | PASS | requirements.md có 16 mục checked, 0 unchecked; không đổi checklist |
| Khởi động PostgreSQL test bằng Compose | BLOCKED | Đã chạy `docker compose -f backend/docker-compose.vocabulary-test.yml up -d`; PowerShell trả CommandNotFoundException, không nhận diện docker |
| Docker Desktop | BLOCKED | Không có docker trong PATH; không thấy executable ở Program Files hoặc LocalAppData được kiểm tra |
| DB test 127.0.0.1:55432 | BLOCKED | TCP trả ECONNREFUSED; chưa có DB test hoạt động |
| Migration và seed A/B | BLOCKED | Không chạy tiếp bước phụ thuộc khi DB chưa khởi động; chưa tạo tài khoản A/B trên DB thật |
| Frontend 4310 | PASS | Process frontend từ lần trước vẫn phục vụ; GET /vocabulary HTTP 200 |
| Full-stack health | BLOCKED | GET http://127.0.0.1:4310/api/health HTTP 500; chưa có backend khỏe để nghiệm thu |
| Browser điều khiển | BLOCKED | getState trả apps=[], browsers=[]; createBrowserTab chrome trả Browser is not available: chrome |

## Bốn mục nghiệm thu

| Mục | Trạng thái | Kết quả thực tế và phần chưa chạy |
| --- | --- | --- |
| 1. A đăng nhập → N3 → bộ → ăn/たべる/食べる → reload còn thẻ | BLOCKED | Không có DB test/tài khoản A và browser điều khiển; chưa tạo hoặc lưu thẻ trong lượt này |
| 2. Tự luận: taberu hiển thị たべる trực tiếp, Enter đúng; IME Nhật | BLOCKED | Không có browser; chưa quan sát DOM, gõ phím, Enter hoặc IME thật; không dùng unit test cũ thay nghiệm thu |
| 3. B mở URL bộ của A bị từ chối | BLOCKED | Chưa có tài khoản A/B hoặc bộ test trên DB; chưa xác minh từ chối qua browser |
| 4. Mobile và /kanji cũ | BLOCKED | GET /kanji và /kanji/食 đều HTTP 200. Chưa kiểm tra mobile, tìm/lọc/chi tiết bằng thao tác browser; HTTP shell không đủ để đánh dấu toàn mục PASS |

Không đánh dấu task hoàn tất: T021, T023, T024, T025 vẫn mở. Không có kết quả FAIL
của một luồng tính năng đã chạy; các luồng chưa thể chạy do điều kiện môi trường.
Không sửa source ứng dụng trong lượt này. Giữ nguyên các file .env đang sử dụng.

## Thao tác cần thực hiện để mở khóa

1. Cài Docker Desktop cho Windows nếu chưa có; mở Docker Desktop và chờ engine chạy.
   Dùng Linux containers để chạy image postgres:16-alpine của Compose.
2. Mở PowerShell mới sau khi cài đặt và chạy tại `C:/Bu nihon`:

   ```powershell
   docker version
   docker compose version
   docker compose -f backend/docker-compose.vocabulary-test.yml up -d
   docker compose -f backend/docker-compose.vocabulary-test.yml ps
   ```

   Cần thấy phần Server của docker version kết nối được và dịch vụ db healthy.
   Nếu Docker chưa hiện trong PATH nhưng đã cài theo đường dẫn mặc định, dùng:

   ```powershell
   & 'C:/Program Files/Docker/Docker/resources/bin/docker.exe' version
   ```

   Đường dẫn này chưa tồn tại trong lần kiểm tra hiện tại.
3. Cấp/kết nối browser automation cho phiên làm việc để getState có browser surface.
   Chỉ cài hoặc mở Chrome trên Windows không bảo đảm công cụ trong phiên này được điều khiển nó.
   Phiên hiện không cung cấp browser surface; không có lệnh trong repo khắc phục quyền này.
   Có thể kiểm thử thủ công bằng Chrome tại http://127.0.0.1:4310/vocabulary sau khi backend khỏe,
   hoặc dùng một phiên đã được cung cấp công cụ điều khiển browser để agent nghiệm thu.
4. Để thử IME thật, thêm Japanese/Microsoft IME trong Windows; thử riêng lượt English
   và lượt Japanese. Không thay IME bằng thao tác paste hoặc sự kiện mô phỏng.

Các lệnh migration, seed tài khoản, backend 4301 và frontend 4310 nằm trong
[test-environment.md](test-environment.md). Chỉ tiếp tục khi DB healthy;
không đổi sang database production để bỏ qua điều kiện này.

Nguồn cài đặt: [Docker Desktop cho Windows](https://docs.docker.com/desktop/setup/install/windows-install/).
