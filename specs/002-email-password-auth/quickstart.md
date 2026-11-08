# Quickstart: Validation guide

Phần hướng dẫn dưới đây dành cho triển khai; báo cáo các kiểm tra đã chạy nằm ở cuối tài liệu.
Contract: [contracts/auth.md](contracts/auth.md). Schema: [data-model.md](data-model.md).

## Prerequisites

- Node 22 theo deployment, npm, Docker/PostgreSQL 16; frontend port 3000, backend 3001.
- Chỉ dùng database local/test riêng, không dùng DATABASE_URL production.
- Tạo backend/.env từ .env.example nếu chưa có, đặt JWT_ACCESS_SECRET/JWT_REFRESH_SECRET
  khác nhau và AUTH_RATE_LIMIT_SECRET ngẫu nhiên riêng. Không ghi giá trị secret vào tài liệu/log.
- FRONTEND_URL/CORS_ORIGIN=http://localhost:3000, COOKIE_SECURE=false cho local HTTP.
- Khi chạy backend trên host với compose db: POSTGRES_HOST=127.0.0.1,
  POSTGRES_PORT=5434 mặc định compose; user/password/db khớp cấu hình local.
  Hoặc dùng DATABASE_URL local tương ứng, không trộn biến trỏ sang môi trường khác.
- Không cấu hình RESEND_API_KEY/RESEND_FROM_EMAIL cho kịch bản bắt buộc no-mail.
- Frontend NEXT_PUBLIC_API_URL=/api; API_PROXY_TARGET=http://127.0.0.1:3001.
- AUTH_LOGIN_EMAIL_LIMIT=5, AUTH_LOGIN_IP_LIMIT=30, AUTH_LOGIN_WINDOW_SECONDS=900;
  local không trust forwarded IP. Production chỉ cấu hình AUTH_TRUSTED_PROXY_CIDRS đã xác minh.

## Start local after implementation

Terminal 1, từ root dự án (nếu dependencies đã cài đúng lockfile, có thể bỏ npm ci):

```powershell
Set-Location 'C:\Bu nihon\backend'
npm ci
docker compose up -d db
npm run migrate
npm run start:dev
```

Terminal 2:

```powershell
Set-Location 'C:\Bu nihon\bu-nihon'
npm ci
npm run dev
```

Migrate chỉ chạy sau khi xác nhận biến DB trỏ local. Không sửa migration 001–004.
Trong dev, xác minh TypeORM synchronize không xóa expression index mới sau restart.
Mở http://localhost:3000 và kiểm tra `/api/health` trước luồng tài khoản.

## Automated checks after each implementation group

Các lệnh script sau đã tồn tại:

```powershell
Set-Location 'C:\Bu nihon\backend'
npm run test:auth
npm run test:deployment
npm run build
```

Các test file sau dự kiến được tạo trong triển khai, chạy sau khi đã có chúng và build backend:

```powershell
Set-Location 'C:\Bu nihon\backend'
node --test --test-isolation=none test/auth.http.test.cjs
node --test --test-isolation=none test/auth.integration.cjs
```

Auth HTTP/integration mới phải đọc TEST_DATABASE_URL từ môi trường, từ chối dùng DB production
hoặc trùng DATABASE_URL, tạo schema cô lập rồi cleanup schema đó trong finally.
Thiếu TEST_DATABASE_URL thì skip có báo rõ, không được tính là đạt kiểm tra PostgreSQL.
Không dùng repository giả để kết luận transaction/unique constraint/limiter đa tiến trình đạt.
Clock phải điều khiển được trong test cửa sổ hạn mức, không chờ thật 15 phút.

Frontend:

```powershell
Set-Location 'C:\Bu nihon\bu-nihon'
npm run lint
npm run typecheck
npm run build
```

Mở rộng test auth theo node:test hiện có cho schema/service nếu cần; không thêm test framework
chỉ để kiểm tra thay đổi form. Không sửa lỗi lint/build ngoài phạm vi mà chưa ghi rõ phát hiện.

## End-to-end acceptance matrix

| Scenario | Steps | Expected |
|---|---|---|
| Tự đăng nhập/no-mail | Đăng ký email mới, không có Resend; gọi /me rồi reload | 201 user, cookie, modal đóng, nhận diện đúng, emailVerified=false, không gửi thư |
| Giới hạn dữ liệu | Email trống/sai; password 7/8/128/129 ký tự | Sai bị chặn; signup 8 và 128 hợp lệ, password không trim |
| Email canonical | Thử chữ hoa và khoảng trắng hai đầu qua HTTP và form | Cùng tài khoản, chỉ một email canonical |
| Duplicate/race | Gửi hai register cùng canonical email đồng thời | Một 201, một 409, một user/identity/session; không ghi đè |
| Rollback | Inject lỗi ghi identity/session hoặc ký JWT trong test | Không user/identity/session dở dang, không cookie thành công |
| Hash | Hai account cùng password; kiểm tra DB test | Hash Argon2id khác nhau có salt, verify đúng/sai, không plaintext |
| Account cũ | Login password cũ chưa verify; kiểm tra tiến trình học | Đúng tài khoản/dữ liệu, không yêu cầu mail |
| Login sai | Email lạ, password sai, Google-only | Cùng 401/message, không phiên mới |
| Hạn mức email | Trong cửa sổ sạch, thử 5 lần cùng email, lần 6 kể cả đúng password | Lần 6 trả 429 + Retry-After; hết cửa sổ lại được thử |
| Hạn mức IP | 30 requests với email khác nhau cùng IP, request 31 | 31 bị 429, không phụ thuộc account có tồn tại |
| Concurrent quota | Nhiều login song song qua hai instance chung DB | Tổng số được phép không vượt quota, không race |
| Restart/quota | Tiêu quota rồi restart một instance | Quota không reset; DB lỗi trả 503, không bypass |
| Proxy spoof | Thay X-Forwarded-For ở truy cập trực tiếp và qua rewrite | Không đổi quota tùy ý; hai IP thật tách quota theo cấu hình tin cậy |
| Session | Reload, refresh, dùng lại refresh cũ, logout rồi reload | Giữ user, rotate, token cũ bị từ chối, logout về guest |
| Lỗi mạng | Mất response register sau commit, thử /me hoặc login | Không tự replay; không account bản sao, không báo thành công giả |
| Regression | Google/reset với và không có cấu hình cần thiết | Hành vi cũ, không tự liên kết email chưa xác thực |
| Accessibility | Keyboard-only, focus/lỗi/loading; viewport điện thoại | Field/nút có nhãn, hoàn thành được, không bị che/tràn |

Giữa các ca limiter dùng schema test/clock điều khiển hoặc đợi hết cửa sổ; không thêm bypass
production để làm test thuận tiện. Không xóa account thật hoặc log secret để kiểm chứng.

## Production validation gate

- Node 22 build/test đạt; migration trên bản sao dữ liệu và preflight canonical duplicate đạt.
- Thử cookie HttpOnly/Secure/SameSite/path qua HTTPS và Next rewrite, không chỉ gọi backend trực tiếp.
- Xác minh IP topology proxy thật, header giả không bypass; nếu gom IP mọi khách thì chưa đạt.
- Benchmark hash dưới tải hạn mức: bộ nhớ/process không OOM và người dùng hoàn thành SC-002.
- Không log password/token/raw limiter key; limiter cleanup trong 24 giờ, không giữ vô hạn.
- Phát hành frontend/backend phối hợp vì register đổi response; giữ migration bổ sung khi rollback.
- Báo kết quả từng nhóm: đạt, thất bại hoặc chưa chạy kèm lý do. Chỉ đánh dấu hoàn tất khi
  acceptance và hồi quy liên quan đạt; bước lập kế hoạch không chạy các lệnh triển khai ở trên.

## Implementation verification — 2026-11-08

### Baseline and scope

- Nhánh `main`, Node local v24.15.0; deployment hiện dùng Node 22. Không đổi dependency.
- Trước triển khai đã có thay đổi `.specify/memory/constitution.md` và dòng subtitle signup
  trong `LoginModal.tsx`; giữ nguyên các nội dung này.
- Ignore files Git/Docker/ESLint đã có và che node_modules, dist/build, log, credentials;
  package private không cần npmignore phục vụ xuất bản.
- Các checklist chất lượng chỉ đọc: requirements.md 16/16 đạt. Không chỉnh marker checklist.
- Không chạy migration, gửi mail, gọi Google hoặc deploy vào môi trường production.

### Implemented

- Register trả 201 `{ user }` và cookie sau một transaction user + identity + refresh session;
  frontend nhận user, xóa password và đóng modal ngay, không gọi login lần hai.
- Argon2id explicit m=65536 KiB/t=3/p=4, salt riêng, hỗ trợ hash cũ; email trim/lower trước
  validation và unique canonical index. Không tự nâng emailVerified hoặc liên kết Google.
- Limiter PostgreSQL: 5/email, 30/IP, 900 giây, tính cả thành công; reservation nguyên tử,
  HMAC key, Retry-After/429, lỗi kho trả 503, cleanup hourly không phụ thuộc traffic.
- Proxy chỉ tin IP/CIDR được cấu hình rõ; chống header giả khi truy cập trực tiếp.
- Form dùng Zod/TanStack mutation retry=false; không replay register/login, chống gửi trùng,
  xử lý lỗi/cooldown/recovery và có nhãn/focus cho bàn phím. Giữ validation quên mật khẩu cũ.
- Bổ sung biến secret/limiter/proxy vào ví dụ cấu hình và Render blueprint; preflight kiểm
  secret hạn mức riêng với JWT. Không chứa giá trị secret thật trong tài liệu.

### Executed checks

| Check | Result | Scope / limitation |
|---|---|---|
| `backend: npm run test:auth` | 11 passed, 3 skipped | 14 cases; skip ba ca PostgreSQL server thật khi thiếu TEST_DATABASE_URL |
| `backend: npm run test:deployment` | 4 passed | Cấu hình DB/JWT/origin và secret hạn mức |
| `node --test --test-isolation=none test/body-parsers.test.cjs test/vocabulary.test.cjs test/vocabulary-import.test.cjs` | 16 passed | Hồi quy JSON parser, quyền dữ liệu, import và capabilities |
| `node --experimental-strip-types --test --test-isolation=none src/lib/auth/schemas.test.ts` trong frontend | 2 passed | Email và biên độ dài signup/login |
| `node --test --test-isolation=none test/auth-api.test.cjs` trong frontend | 5 passed | Không replay, Retry-After, lỗi, network recovery và response không hợp lệ |
| `frontend: npm run typecheck` / `npx tsc --noEmit` | passed | TypeScript strict |
| `frontend: npm run build` | passed | Build production cuối; lần đầu sandbox lỗi spawn EPERM, chạy ngoài sandbox đạt |
| ESLint các tệp auth đã sửa | 0 errors, 1 warning | Warning api.ts điều hướng Google đã tồn tại trước thay đổi |
| `frontend: npm run lint` | failed: 15 errors, 19 warnings | Lỗi ở Kanji pages/components và useJapaneseTTS không sửa trong tính năng này |
| `git diff --check` | passed | Kiểm tra whitespace |

Các test SQL local dùng PGlite với TypeORM/Argon2 thật, không dùng repository giả để kết luận
transaction: tạo account, unique race, rollback khi identity/session insert, ký JWT hoặc hash refresh
lỗi; không lưu refresh hash rỗng. PGlite thay uuid-ossp bằng gen_random_uuid trong fixture,
không sửa migration 001–004. Có kiểm dev synchronize giữ index canonical và dữ liệu user cũ.
HTTP test dùng cùng cấu hình HTTP với ứng dụng: Origin/CORS, validation, cookie flags/TTL,
Secure production, /me, logout/refresh, login 401 chung, request email 6/IP 31 trả 429 và DB lỗi 503.
Google/reset được kiểm với provider/mail fixture; chưa xác minh dịch vụ bên ngoài thực tế.

### Browser evidence

- Next dev local → Nest controller/service + TypeORM → PostgreSQL nhúng, chạy Chrome headless.
- 10/10 ca signup tự đăng nhập, không gửi mail, không POST login tiếp; reload đúng account,
  logout rồi reload về guest. 5 viewport desktop 1440×1000 và 5 mobile 390×844.
- Đăng nhập sai rồi sửa thành đúng hoạt động ở desktop và mobile.
- Hai ca bổ sung thao tác signup chỉ bằng bàn phím tại width 1440 và 390, nút gửi nằm trong
  bề ngang viewport; từ submit đến nhận diện dưới 2 phút. Đã xem screenshot mobile, không che nút.
- Mô phỏng 429 Retry-After=1: hai submit liên tiếp chỉ một request, nút chờ hết hạn rồi mở,
  không tự gửi lại; 503 có alert và Escape đóng dialog. Đây là ca giả lập lỗi có chủ đích.
- Script/ảnh local: `.tmp/auth-browser-check.cjs`, `.tmp/auth-browser-edge.cjs`,
  `.tmp/auth-1440.png`, `.tmp/auth-390.png` (được ignore, không phải artifact production).

### Requirement outcomes and pending gates

| Requirement / outcome | Status |
|---|---|
| FR-001–FR-013, FR-015 | Triển khai và kiểm local đạt; không khẳng định provider production đã chạy |
| FR-014 / SC-007 | Local SQL/HTTP/concurrency/expiry/recreation đạt; test hai tiến trình PostgreSQL thật chưa chạy |
| SC-001–SC-004, SC-006, SC-008 | Local browser/HTTP/crypto đạt |
| SC-005 | Hồi quy local/fixture đạt; Google/mail bên ngoài chưa xác minh |

- Không có Docker/psql và không có listener PostgreSQL local trên 5432/5434;
  TEST_DATABASE_URL chưa được cung cấp. Ba integration test server thật skip rõ, không tính pass.
  Chưa chạy migration CLI trên bản sao dữ liệu thật hay kiểm checksum history qua runner;
  migration SQL và index đã kiểm bằng PostgreSQL nhúng.
- Chưa có môi trường HTTPS/proxy production để kiểm client IP qua Vercel/Render và cookie
  trên đường thật. Không tự deploy để hoàn thành phép kiểm. Proxy CIDR thực tế vẫn cần xác minh.
- Benchmark tham khảo Node v24.15.0, 2 hash đồng thời, 4 batch: 77/68/68/74 ms,
  RSS đỉnh đo được 183 MiB. Không thay cho Node 22 hoặc máy cấu hình tương đương Render;
  giữ task benchmark phát hành mở, không giảm tham số băm để làm phép thử đạt.
- Lint toàn dự án chưa đạt do 15 lỗi ngoài phạm vi; không tự sửa Kanji/TTS trong bản auth.
- Các gate chưa đạt vẫn để `[ ]` trong tasks.md. Chưa đánh dấu toàn bộ feature hoàn tất/phát hành.

### Run the remaining checks

1. Chuẩn bị PostgreSQL test riêng trên localhost, database name chứa `test`, khác DATABASE_URL;
   đặt TEST_DATABASE_URL trong môi trường và chạy lại `npm run test:auth` để ba ca server thật chạy.
2. Chạy migrate CLI trên bản sao dữ liệu test, đối chiếu history/checksum và preflight duplicate;
   không sửa 001–004 hoặc tự merge dữ liệu bị trùng.
3. Trước phát hành: chạy Node 22, benchmark ở cấu hình gần production và kiểm HTTPS/proxy thật.
   Cần AUTH_RATE_LIMIT_SECRET riêng, migration 005 và frontend/backend phát hành phối hợp.
4. Xử lý các lỗi lint ngoài phạm vi trong công việc riêng, rồi chạy lại gate toàn dự án.
