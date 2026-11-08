# Auth HTTP and UI Contract

Base path `/api`; qua Next same-origin rewrite mặc định. Request JSON, credentials included,
Cache-Control private/no-store. CORS credentials và Origin allowlist theo bootstrap hiện có.
Cookie production chỉ qua HTTPS; không lưu access/refresh token vào localStorage.

## Public User

`{ id: string, email: string, displayName: string, avatarUrl: string | null, emailVerified: boolean }`
Không passwordHash, tokenHash, accessToken hay refreshToken trong JSON.

## POST /api/auth/register — thay đổi hợp đồng

Request `{ email: string, password: string }`; email trim/lower trước validation,
password 8–128 giữ nguyên. Không yêu cầu field khác hoặc verification code.

- 201: `{ user: PublicUser }`, đồng thời Set-Cookie access_token và refresh_token.
  emailVerified=false. Đây là phiên đã đăng nhập, không cần POST login tiếp theo.
- 400: `{ message: string | string[] }`, dữ liệu không hợp lệ, không tạo account/session.
- 409: `{ message: "Email này đã được đăng ký." }` cho duplicate canonical email hoặc
  password identity trùng đúng constraint tương ứng; không thay đổi tài khoản cũ.
- 5xx: lỗi lưu hoặc tạo session, rollback mọi ghi thuộc đăng ký, không set cookie mới.
  Phản hồi lỗi không chứa thông tin SQL/constraint bí mật hay password.

Mất response sau commit là kết quả chưa rõ đối với client, không bảo đảm rollback khi mất mạng;
client không tự gửi lại register. Dùng `/me` để kiểm tra nếu nhận cookie, hoặc login thủ công.
Phối hợp frontend/backend vì response cũ là message-only. Không giữ giả định UI chuyển về login.

## POST /api/auth/login

Request `{ email: string, password: string }`; email chuẩn hóa trước validation,
password 1–128 để giữ tương thích tài khoản cũ; không trim password.

- 201: `{ user: PublicUser }` và cùng cookie như register; không chặn email chưa xác thực.
- 400: lỗi cấu trúc/validation, không tạo session.
- 401: `{ message: "Email hoặc mật khẩu không đúng." }` cho email không tồn tại,
  sai password hoặc account không có password; không tự liên kết account.
- 429: `{ message: "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ rồi thử lại." }`,
  header `Retry-After: <integer seconds >= 1>`; không xác minh password hay tạo session.
- 503: không thể kiểm tra quota, không bypass. Các lỗi server khác không giả thành 401.

Quota mặc định: 5 requests/email và 30/IP trong cửa sổ 900 giây từ request đầu tiên,
tính mọi request login hợp lệ về cấu trúc, kể cả thành công và email không tồn tại.
Được reserve nguyên tử, dùng chung DB giữa các instance; chặn kể cả password đúng khi hết quota.
Request 6 theo email hoặc 31 theo IP bị 429 khi các request trước trong cùng cửa sổ;
thử lại sau hết hạn được phép. Không reset quota khi login đúng.
Thời gian chờ là thời gian hết hạn muộn nhất của các scope đã đầy.

## Cookie Session Contract — giữ nguyên

| Cookie | HttpOnly | SameSite | Secure | Path | TTL |
|---|---|---|---|---|---|
| access_token | true | Lax | true production | / | 15 phút |
| refresh_token | true | Lax | true production | /api/auth | 30 ngày |

Domain theo COOKIE_DOMAIN hiện có; local HTTP cho phép Secure=false ngoài production.
Đăng ký set cookie sau commit, cùng helper login; không đổi policy refresh hoặc Google.

- GET `/api/auth/me`: 200 `{ user }` khi cookie access hợp lệ, 401 nếu không có phiên hợp lệ.
- POST `/api/auth/refresh`: xoay refresh theo hiện tại, trả `{ user }` và cookie mới;
  refresh cũ không dùng lại được.
- POST `/api/auth/logout`: giữ response `{ message }`, thu hồi refresh và xóa đúng cookie paths.
- GET `/api/auth/config`: giữ emailRegistration=true không cần mail;
  passwordReset và googleLogin theo config cũ.
- Google/forgot/reset/verify-email/resend-verification hiện có không thay hợp đồng.

## UI Contract

- Signup/login trong LoginModal hiện có; nhãn/email/password/submit đọc được bằng công cụ hỗ trợ.
- TanStack mutation retry=false; chặn submit trùng/tab switch trong lúc gửi; hiển thị loading.
- Register/login thành công: lấy user → setUser → xóa password → đóng modal; giữ trang đang xem.
- AuthProvider lấy `/me` sau reload; tiếp tục xử lý refresh và auth-expired như hiện có.
- Signup/login không được tự refresh/replay bởi api.ts; read protected vẫn dùng refresh cũ.
- 400 hiển thị lỗi tiếng Việt; 409 cho quay về login; 401 không làm lộ tài khoản tồn tại;
  429 hiển thị thời gian chờ và không gửi lại tự động; 503/lỗi mạng có thao tác thử lại chủ động.
- ApiError có thể mở rộng retryAfterSeconds dạng optional để các caller hiện có không bị đổi.
  Nếu frontend khác origin, CORS expose Retry-After chỉ cho origins hiện có, không mở wildcard.
- Không thêm màn OTP hoặc yêu cầu mở mail. Password mặc định che, không giữ trong persisted state.
