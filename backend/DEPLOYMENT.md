# Deploy Bu Kanji: Vercel + Render

Nếu chưa có backend/database/email service, bắt đầu với
[DEPLOYMENT-START-HERE.md](../DEPLOYMENT-START-HERE.md). Blueprint hiện tạo cả PostgreSQL
và API để triển khai thử; gói database Free chỉ là trial, cần chọn gói lâu dài khi production.

Frontend root `bu-nihon`; backend root `backend`. Dữ liệu PostgreSQL bền vững, không lưu
trong filesystem Render. Cấu hình chuẩn: browser → Vercel `/api` → Render `/api`.
Chưa có URL/backend được tạo bởi tài liệu này; thay mọi placeholder trước khi triển khai.

## 1. Database và migration

Tạo managed PostgreSQL riêng; lấy connection string từ provider. Sao lưu database hiện có.
Production không bật synchronize. Trong root `backend`, cài dependency bằng `npm ci`,
thiết lập DATABASE_URL và DATABASE_SSL theo provider rồi chạy:

```sh
npm run migrate
npm run build
```

Runner tự đọc `.env` local, hoặc env của shell/hosting; không in connection string.
Chạy lần lượt `001_initial_auth.sql` rồi `002_vocabulary.sql`, transaction toàn bộ,
khóa chống chạy đồng thời và lưu checksum trong `schema_migrations`; chạy lại bỏ qua bản đã áp dụng.
SQL auth ban đầu dùng CREATE IF NOT EXISTS nên có thể ghi nhận database đã được khởi tạo từ
migration cũ, nhưng phải kiểm tra schema hiện có tương thích trước khi chạy. Không reset bảng.
Nếu migration đã ghi nhận bị sửa, runner từ chối; thêm file số mới thay vì sửa migration cũ.

Start command Render mới `npm run start:render` tự kiểm tra biến và migrate trước khi start.
Render Shell/one-off hoặc máy vận hành kết nối database cũng dùng `npm run migrate` trong
root backend. Không giả định gói hosting có pre-deploy; nếu dùng pre-deploy có thể đặt
`npm run migrate`, nhưng phải xác minh quyền/tính năng hosting. Lần đầu health có thể chưa
healthy trước khi migrate; hoàn tất migrate rồi deploy/restart. Khi rollback chỉ rollback
code tương thích; không tự drop bảng hoặc dữ liệu người dùng.

## 2. Render backend

Có thể dùng blueprint `render.yaml` ở root repo hoặc tạo Node Web Service thủ công:

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Install + Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `npm run start:render` |
| Health Check Path | `/api/health` |
| Node | 22 LTS |

PORT do Render cấp, server bind 0.0.0.0. Không dùng Dockerfile development để production.
Thiết lập biến theo `.env.production.example`:

- NODE_ENV=production, DATABASE_URL, DATABASE_SSL theo provider.
- JWT_ACCESS_SECRET và JWT_REFRESH_SECRET: bí mật ngẫu nhiên khác nhau, giữ ổn định qua deploy.
- FRONTEND_URL và CORS_ORIGIN: đúng origin frontend, không dấu `/` cuối;
  CORS có thể gồm nhiều origin chính xác phân tách dấu phẩy. Không dùng wildcard.
- COOKIE_DOMAIN để trống, COOKIE_SECURE=true. Giữ HttpOnly, SameSite=Lax.
- RESEND_API_KEY và RESEND_FROM_EMAIL: cấu hình sender đã xác minh để email hoạt động.
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET và GOOGLE_CALLBACK_URL nếu dùng Google OAuth.
  Callback phải là `https://FRONTEND-DOMAIN/api/auth/google/callback`, không phải origin Render.

Blueprint tạo PostgreSQL riêng và nối DATABASE_URL tự động; không quản lý domain hay Resend.
Kiểm tra gói/chi phí trong dashboard; không cần nâng gói chỉ để chạy migration vì start command
đã chạy migration trước khi khởi động API.

## 3. Vercel frontend

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Root Directory | `bu-nihon` |
| Install | `npm ci` |
| Build | `npm run build` |
| Start | Vercel quản lý; local production dùng `npm run start` |

Đặt trước build:

```dotenv
NEXT_PUBLIC_API_URL=/api
API_PROXY_TARGET=https://YOUR-BACKEND.onrender.com
```

API_PROXY_TARGET chỉ là origin, không thêm `/api`, không có path/query, không phải domain
frontend. Rewrite giữ nguyên đường dẫn/query và chuyển cookie/request tới backend.
Frontend và backend là hai dịch vụ nhưng browser chỉ gọi origin frontend. Cookie host-only
được browser gắn vào frontend, tránh phụ thuộc cookie bên thứ ba. Không đổi sang bearer
localStorage hoặc SameSite=None để khắc phục cấu hình sai.

Không copy `.env.local` hoặc `.env.production` bí mật lên git. Các `.env.example` chỉ có mẫu.
Môi trường Preview phải có origin/API/database test phù hợp và không trộn dữ liệu production.
Mỗi lần đổi API_PROXY_TARGET hoặc NEXT_PUBLIC_API_URL phải build/deploy lại frontend.

## 4. Google và domain tùy chỉnh

Đăng ký đúng callback frontend `/api/auth/google/callback` tại Google Console.
OAuth nonce/return path được giữ trong cookie HttpOnly; callback quay về bộ từ vựng nếu mục
tiêu hợp lệ, fallback `/kanji`. Email login giữ route hiện tại.
Nếu dùng domain riêng, cập nhật đồng bộ FRONTEND_URL, CORS_ORIGIN, GOOGLE_CALLBACK_URL
và Console. Vẫn ưu tiên `/api` proxy, COOKIE_DOMAIN trống. Không dùng `.vercel.app`
làm cookie domain chung hoặc kỳ vọng cookie frontend gửi trực tiếp sang `.onrender.com`.

## 5. Kiểm tra trước khi xác nhận deploy

Ghi URL thực tế và từng kết quả vào `specs/001-vocabulary-study/validation.md`:

1. Backend build; frontend lint/build. Phân biệt lỗi baseline và lỗi feature.
2. `/api/health` tại origin Render và tại frontend proxy trả database connected.
3. Đăng nhập qua frontend, cookie HttpOnly/Secure/Lax, reload và refresh giữ phiên;
   logout xóa cookie; thử khi browser chặn cookie bên thứ ba.
4. Tạo N3, ba bộ, thẻ ăn/たべる/食べる; reload vẫn có; mở URL bộ tab mới.
5. Tự luận bàn phím Anh: taberu hiển thị たべる trước Enter, chấm đúng.
   Chạy toàn bộ C01–C14, đặc biệt nn, selection, Backspace và IME thật.
6. Flashcard/tiến độ, 3 câu 2 đúng 1 sai →66,7%, làm lại chỉ câu sai.
7. Tài khoản B không đọc/ghi được folder/set/card của A; origin lạ mutation bị từ chối;
   đăng xuất/chuyển user không còn cache hay lượt học của user cũ.
8. Xác nhận xóa counts; stale preview không xóa; mất mạng giữ form, báo lỗi.
9. 375×812 và 1366×768, sáng/tối, keyboard; /kanji tìm/lọc/chi tiết vẫn hoạt động.
10. Google login sai state bị từ chối; thành công quay lại bộ; returnTo ngoài bị chặn.

Nếu thiếu tài khoản hosting, chỉ bàn giao cấu hình/hướng dẫn và báo chưa deploy.
Không coi HTTP 200 trang shell, unit tests hoặc health là đã nghiệm thu đầy đủ tính năng.
