# Bắt đầu deploy Bu Kanji

Phạm vi đợt này: Kanji + Từ vựng cá nhân + đăng nhập. Không đổi các file .env đang dùng.

## Trạng thái source

| Chức năng | Source hiện tại | Điều kiện để dùng online |
| --- | --- | --- |
| Kanji danh sách/tìm/lọc/chi tiết | Đã có, giữ dữ liệu hiện tại | Frontend Vercel |
| Thư mục/bộ/thẻ, Flashcard/Tự luận | Đã triển khai | Backend + PostgreSQL + tài khoản đăng nhập |
| Đăng ký không OTP, đăng nhập mật khẩu | Đã có API/UI | PostgreSQL và JWT; không cần Resend |
| Gửi lại OTP, quên/đặt lại mật khẩu | Đã có API/UI | Dịch vụ email hoạt động |
| Refresh/logout/cookie, owner checks | Đã có | /api proxy đúng domain; phải nghiệm thu full stack |
| Google login | Đã có, tùy chọn | OAuth client/callback; ẩn khi chưa cấu hình |
| Những mục khác trong menu | Ngoài đợt triển khai này | Không được coi là đã hoàn thiện toàn sản phẩm |

Build/unit test không chứng minh email gửi được hay tài khoản Google hoạt động.
Vẫn cần nghiệm thu lưu/reload dữ liệu, A/B, hiragana/IME và mobile trên môi trường online.

## 1. Đưa bản sửa lên Git

Commit/push source hiện tại lên nhánh Vercel/Render sẽ dùng. Không commit .env thật.
Vercel trước đó lỗi `@vercel/turbopack-next/internal/font/google/font` ở Noto Sans JP.
Đã bỏ loader next/font/google trùng với Google Fonts CSS sẵn có; vẫn giữ Inter/Noto Sans JP
trong CSS. Font do browser tải, không còn cần tải/chuyển đổi font trong bước build.
Nếu browser không tải được Google Fonts, font dự phòng của CSS vẫn sử dụng được.

## 2. Tạo tài khoản Render và triển khai Blueprint

Repo đã có render.yaml tạo hai tài nguyên cùng region Singapore:

- bu-kanji-api: Node 22, root backend, build npm ci --include=dev && npm run build.
- bu-kanji-db: PostgreSQL 16, database/user riêng; DATABASE_URL tự nối bằng fromDatabase.
- JWT_ACCESS_SECRET/JWT_REFRESH_SECRET được Render sinh riêng, không cần tự dán secret mẫu.
- FRONTEND_URL/CORS_ORIGIN đặt sẵn https://bu-kanji.vercel.app; sửa nếu domain thực khác.
- Database chỉ cho kết nối mạng riêng trong blueprint; không mở public IP để tiện debug.
- TLS vẫn bật. Render private Postgres dùng chứng chỉ tự ký, nên blueprint đặt
  DATABASE_SSL_REJECT_UNAUTHORIZED=false riêng cho kết nối này. Migration và API dùng chung
  cấu hình TLS; nhà cung cấp ngoài dùng mặc định true khi có chứng chỉ hợp lệ.
  [Render internal TLS](https://render.com/docs/postgresql-creating-connecting).

Trong Render: New → Blueprint → kết nối repo/nhánh → kiểm tra render.yaml → xem tài nguyên
và gói → triển khai. Không cần Docker local để chạy backend/database trên Render.

**Blueprint hiện chọn Free cho lần thử nghiệm đầu tiên.** Render Free Postgres hết hạn sau
30 ngày, không phải cơ sở dữ liệu lâu dài cho người dùng thật. Trước phát hành production,
chọn database/gói lưu trữ lâu dài và xem chi phí trong dashboard. Không coi gói trial là
đã đảm bảo vận hành production.

Nguồn: [Blueprints](https://render.com/docs/infrastructure-as-code),
[giới hạn Free](https://render.com/docs/free).

### Lần khởi động đầu tiên

Start Command: `npm run start:render`.

Lệnh này kiểm tra DB/JWT/origin → chạy migration có lịch sử/khóa/transaction → khởi động API.
Nếu thiếu cấu hình, log chỉ tên biến cần sửa, không in secret. Nếu migration thất bại,
API không khởi động với schema thiếu. Mỗi lần khởi động lại bỏ qua migration đã áp dụng.
Không cần dùng Render Shell để chạy migration cho lần deploy mới này.

Chờ health `/api/health` trả database connected. Lưu URL API Render thực tế để dùng bước 3.
Không tự nhập URL mẫu YOUR-BACKEND.onrender.com như một URL thật.

## 3. Vercel frontend

Project Settings → Environment Variables, chọn môi trường muốn triển khai:

```dotenv
NEXT_PUBLIC_API_URL=/api
API_PROXY_TARGET=https://TEN-API-THAT.onrender.com
```

Để bật chat và nhập từ vựng bằng AI, thêm hai biến **server** trên Vercel:

```dotenv
CHATMOCK_BASE_URL=https://chatmock.vothanhan.dev/v1
CHATMOCK_GATEWAY_SECRET=<nhập khóa thật trực tiếp trong Vercel>
```

Không dùng `NEXT_PUBLIC_` cho khóa. Deploy backend Render bản mới trước để migration
`003_ai_usage.sql` tạo bảng hạn mức và `004_ai_imports.sql` lưu tiến độ nhập file 100 MB
(start command `npm run start:render` tự chạy migration).
Người dùng đăng nhập website để dùng AI; Vercel xác thực và trừ hạn mức qua Render trước
khi gọi Chatmock. Không cần chạy local và không đặt khóa Chatmock trên Render.
Hướng dẫn chi tiết: [bu-nihon/CHATMOCK.md](bu-nihon/CHATMOCK.md).

API_PROXY_TARGET lấy từ service vừa tạo, chỉ origin, không có /api hoặc dấu query.
Không đưa DATABASE_URL/JWT/Resend/Google secret lên frontend.

Vercel Settings → Build and Deployment:

| Setting | Giá trị |
| --- | --- |
| Root Directory | bu-nihon |
| Framework | Next.js |
| Install Command | npm ci |
| Build Command | npm run build |
| Node | 22 |

Redeploy sau khi đặt biến. Với bản deploy từng lỗi font, chọn redeploy không dùng Build Cache
để loại artifact lỗi cũ. /api của frontend phải trả cùng health như API Render.
Hai file .env.local/.env.production trên máy không thay cho các biến trong Vercel dashboard.

## 4. Đăng ký không OTP; Resend tùy chọn cho khôi phục mật khẩu

Đăng ký email/mật khẩu không yêu cầu Resend. Backend cần `AUTH_RATE_LIMIT_SECRET` riêng,
ít nhất 32 ký tự, ngoài hai JWT secret; Render blueprint mới tự sinh giá trị này.
Tạo tài khoản xong, người dùng tự đăng nhập ngay. Email được giữ ở trạng thái chưa xác thực.
Đăng ký trả `{ user }` kèm cookie sau khi lưu tài khoản và phiên trong cùng transaction.
Chạy migration 005 trước backend mới; nếu có email trùng sau chuẩn hóa thì dừng để xử lý dữ liệu
riêng, không tự gộp tài khoản. Phát hành frontend/backend phối hợp; rollback ứng dụng giữ nguyên
bảng/index bổ sung và dữ liệu tài khoản, không sửa migration cũ.

Hạn mức mặc định: `AUTH_LOGIN_EMAIL_LIMIT=5`, `AUTH_LOGIN_IP_LIMIT=30`,
`AUTH_LOGIN_WINDOW_SECONDS=900`, tính cả đăng nhập thành công. Vượt hạn mức trả 429 và
`Retry-After`; không truy cập được kho hạn mức trả 503. Bộ đếm dùng chung PostgreSQL, khóa HMAC
dùng cùng `AUTH_RATE_LIMIT_SECRET` giữa các instance. Không đổi secret tùy tiện để reset hạn mức.
Chỉ đặt `AUTH_TRUSTED_PROXY_CIDRS` sau khi xác minh proxy thật trên cả đường Vercel → Render
và truy cập API trực tiếp. Để trống dùng socket IP; nếu mọi khách bị gom cùng IP thì chưa đạt
kiểm tra phát hành. Không tin toàn bộ proxy hoặc header do khách tự gửi.
Không tự ghép Google với tài khoản mật khẩu chưa xác thực chỉ vì trùng email.
Phần Resend bên dưới chỉ cần khi muốn bật quên mật khẩu hoặc API xác thực email cũ.

Bạn có thể chọn **Google login trước** (mục 5) nếu chưa có domain gửi email; Google login
tự tạo tài khoản đã xác thực trong database và không cần Resend. Nếu muốn đăng ký bằng
email/mật khẩu thì không cần bật thêm dịch vụ. Để khôi phục mật khẩu qua email, thực hiện
phần Resend dưới đây.

Tạo tài khoản Resend, thêm domain gửi thuộc quyền quản lý của bạn, thêm bản ghi DNS theo
Resend và chờ Verified. Tạo API key rồi thêm **trên Render service → Environment**:

```dotenv
RESEND_API_KEY=KEY_THAT
RESEND_FROM_EMAIL=Bu Kanji <auth@DOMAIN_DA_XAC_MINH>
```

Save and deploy/restart backend. `/api/auth/config` chỉ trả các cờ boolean, không lộ secret;
emailRegistration luôn true; passwordReset chỉ true khi cấu hình email đủ. Sau đó thử đăng ký,
đăng nhập, quên mật khẩu và logout.

Không dùng auth@example.com hoặc onboarding@resend.dev làm người gửi thư khôi phục công khai.
Địa chỉ resend.dev chỉ dùng thử gửi tới chính tài khoản Resend; muốn gửi người khác cần domain
đã xác minh. Nguồn: [Resend sender domain](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).

Nếu chưa có domain/Resend, đăng ký và đăng nhập vẫn hoạt động; khôi phục mật khẩu qua email
bị vô hiệu hóa. Tài khoản đăng ký bằng mật khẩu không bị đánh dấu đã xác thực email.

## 5. Google login — có thể làm sau

Tạo Google OAuth Web client nếu muốn có nút Google. Đặt trên Render:

```dotenv
GOOGLE_CLIENT_ID=CLIENT_ID_THAT
GOOGLE_CLIENT_SECRET=CLIENT_SECRET_THAT
GOOGLE_CALLBACK_URL=https://bu-kanji.vercel.app/api/auth/google/callback
```

Đăng ký đúng callback trên tại Google Console. Callback phải qua domain frontend để cookie
OAuth cùng origin, không dùng URL Render trực tiếp. Nếu domain frontend khác, cập nhật cả
FRONTEND_URL, CORS_ORIGIN và callback. Thiếu cấu hình thì nút Google không hiển thị.

## 6. Kiểm tra sau khi triển khai thử

1. Health API Render và health qua frontend đều trả database connected.
2. /api/auth/config có đúng cờ theo các dịch vụ đã bật.
3. Đăng ký A không OTP → login → refresh trang vẫn đăng nhập.
4. A tạo N3, ba bộ, thẻ ăn/たべる/食べる; reload còn dữ liệu.
5. Tự luận gõ taberu bằng bàn phím English, thấy たべる trước Enter, Enter chấm đúng.
6. Thử IME Nhật, mobile, Flashcard, kết quả/retry và /kanji cũ.
7. Đăng nhập B; URL bộ A bị từ chối. Logout/chuyển user không lộ dữ liệu A.
8. Quên/reset mật khẩu nhận được email và token chỉ dùng được một lần; Google nếu đã bật.

Ghi URL thật và kết quả vào specs/001-vocabulary-study/validation.md. Chưa có quyền truy cập
tài khoản hosting trong phiên làm việc này; không khẳng định các dịch vụ đã được tạo/deploy.
