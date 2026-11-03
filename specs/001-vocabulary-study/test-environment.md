# Môi trường kiểm thử Từ vựng riêng

Không sửa `bu-nihon/.env.local`, `.env.production` hoặc `backend/.env` đang sử dụng.
Các biến dưới đây chỉ tồn tại trong cửa sổ PowerShell kiểm thử.

| Phần | Địa chỉ riêng |
| --- | --- |
| PostgreSQL | `127.0.0.1:55432/bu_kanji_vocabulary_test` |
| Backend | `http://127.0.0.1:4301` |
| Frontend | `http://127.0.0.1:4310` |

## 1. Bật PostgreSQL kiểm thử

Máy kiểm tra chưa có `docker`, `psql`, `pg_ctl`, `initdb` trong PATH. Thư mục
`C:/Program Files/PostgreSQL` tồn tại nhưng không có executable tìm thấy bên trong.
Cả 5432, 5434 và 55432 đều trả ECONNREFUSED trong lần kiểm tra này.

Cách dùng cấu hình đã chuẩn bị: cài [Docker Desktop cho Windows](https://docs.docker.com/desktop/setup/install/windows-install/),
bật engine Linux containers, rồi chạy từ root repo:

```powershell
docker compose -f backend/docker-compose.vocabulary-test.yml up -d
docker compose -f backend/docker-compose.vocabulary-test.yml ps
```

Chờ dịch vụ db hiển thị healthy. Compose này có project, user, database, volume và port
riêng; chỉ bind loopback, không đọc các giá trị từ file `.env` ứng dụng và không chạy API.
`local_test_only` là mật khẩu mẫu dành riêng database local kiểm thử, không dùng production.

Nếu không dùng Docker, cài [PostgreSQL cho Windows](https://www.postgresql.org/download/windows/)
(PostgreSQL 16 tương ứng image repo), cho server riêng lắng nghe port 55432, tạo role
`vocabulary_test` với mật khẩu mẫu trên và database `bu_kanji_vocabulary_test` do role này sở hữu.
Không trỏ các bước sau vào database hiện tại hoặc production.

## 2. Migration và tài khoản kiểm thử

Cửa sổ PowerShell chuẩn bị, tại root repo:

```powershell
Set-Location backend
$env:DATABASE_URL='postgresql://vocabulary_test:local_test_only@127.0.0.1:55432/bu_kanji_vocabulary_test'
$env:DATABASE_SSL='false'
npm run migrate
```

Chỉ tiếp tục nếu exit code bằng 0. Chạy lại `npm run migrate` để kiểm tra không áp dụng trùng.
Migration runner có lịch sử/checksum/transaction; T023 vẫn cần kiểm tra lịch sử và rollback
thực tế trên database kiểm thử, không suy ra đã đạt từ việc đọc source.

```powershell
$env:TEST_DATABASE_URL=$env:DATABASE_URL
node test/seed-vocabulary-users.cjs
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
npm run test:integration
```

Xóa biến DATABASE_URL trong cửa sổ chuẩn bị trước integration test là cần thiết: suite từ chối
TEST_DATABASE_URL trùng DATABASE_URL để tránh nhầm database ứng dụng. Không xóa file `.env`.

Seed script chỉ chấp nhận database local có đúng tên và port ở trên; không đọc file `.env`.
Nó tạo hai tài khoản đã xác minh email nên không gửi OTP/Resend thật:

| Tài khoản | Mật khẩu kiểm thử |
| --- | --- |
| `vocabulary.a@example.test` | `VocabularyTest!2026` |
| `vocabulary.b@example.test` | `VocabularyTest!2026` |

Chưa chạy seed thành công trong lần này vì chưa có database. Không dùng tài khoản này trên hosting.

## 3. Backend production local

Cửa sổ PowerShell khác, tại root repo:

```powershell
Set-Location backend
$env:DATABASE_URL='postgresql://vocabulary_test:local_test_only@127.0.0.1:55432/bu_kanji_vocabulary_test'
$env:DATABASE_SSL='false'
$env:NODE_ENV='production'
$env:PORT='4301'
$env:FRONTEND_URL='http://127.0.0.1:4310'
$env:CORS_ORIGIN='http://127.0.0.1:4310'
$env:COOKIE_DOMAIN=''
$env:JWT_ACCESS_SECRET=[guid]::NewGuid().ToString('N')+[guid]::NewGuid().ToString('N')
$env:JWT_REFRESH_SECRET=[guid]::NewGuid().ToString('N')+[guid]::NewGuid().ToString('N')
npm run build
npm run start:prod
```

Phải thấy server khởi động, và `/api/health` trả database connected. Production giữ Secure
cookie; dùng Chrome/Edge local loopback hoặc HTTPS kiểm thử nếu browser áp dụng chính sách
Secure khác. Không hạ chính sách cookie production để che lỗi cấu hình triển khai.
Google OAuth kiểm thử cần provider/callback riêng; không dùng redirect URI production local.

## 4. Frontend riêng

Cửa sổ PowerShell khác, tại root repo:

```powershell
Set-Location bu-nihon
$env:NEXT_PUBLIC_API_URL='/api'
$env:API_PROXY_TARGET='http://127.0.0.1:4301'
npm run build
npm run start -- --hostname 127.0.0.1 --port 4310
```

Nếu npm/PowerShell không chuyển tiếp tham số đúng, dùng lệnh tương đương:

```powershell
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 4310
```

Mở `http://127.0.0.1:4310/vocabulary`. Đây là bản build local kiểm thử,
không phải URL deploy; backend phải chạy và health phải đạt trước khi nghiệm thu dữ liệu.

## 5. Browser và IME

Chrome/Edge đã có executable trên máy nhưng công cụ điều khiển phiên hiện trả `browsers: []`;
thử mở Chrome trả `Browser is not available: chrome`. Cần kết nối/cấp browser automation
cho phiên làm việc để trình duyệt xuất hiện trong danh sách công cụ. Việc chỉ có Chrome
được cài trên Windows chưa cung cấp quyền điều khiển browser cho phiên này.

Để thử IME thật, Windows cần có ngôn ngữ/bàn phím Japanese và Microsoft IME.
Chạy hai lượt riêng: bàn phím English cho romaji trực tiếp, Japanese IME cho composition.
Không coi dispatch sự kiện mô phỏng hoặc dán hiragana là đã thử IME thật.

Nghiệm thu theo `spec.md` và `quickstart.md`: đăng nhập A → N3 → ba bộ →
ăn/たべる/食べる → reload → Tự luận → gõ từng phím taberu → thấy たべる trước Enter → đúng.
Sau đó C01–C14, ba câu 2 đúng/1 sai/retry, Flashcard, mất mạng/form, A/B, refresh/logout,
375×812/1366×768, sáng/tối, keyboard và /kanji tìm/lọc/chi tiết.

## 6. Dừng môi trường

Dừng frontend/backend bằng Ctrl+C trong đúng cửa sổ của chúng; đóng các cửa sổ kiểm thử
để bỏ biến môi trường riêng. Từ root repo:

```powershell
docker compose -f backend/docker-compose.vocabulary-test.yml stop
```

Lệnh stop giữ dữ liệu để kiểm tra persistence. Không dùng `down -v` nếu còn cần dữ liệu kiểm thử.
Hướng dẫn deploy thật ở `backend/DEPLOYMENT.md`; luôn thay API_PROXY_TARGET bằng origin Render
thật và build lại frontend khi phát hành.
