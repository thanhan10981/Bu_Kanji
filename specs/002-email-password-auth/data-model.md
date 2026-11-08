# Data Model: Email/password authentication

## User — bảng users hiện có

| Field | Quy tắc |
|---|---|
| id | UUID, giữ nguyên danh tính và liên kết tiến trình học |
| email | Bắt buộc, email hợp lệ; đầu vào trim/lower trước validation |
| passwordHash | Nullable cho Google-only; select:false; mật khẩu Argon2id có salt |
| emailVerified | false khi đăng ký mật khẩu, không tự đổi khi đăng nhập |
| displayName | Giữ mặc định phần trước @ hiện có |
| avatarUrl | Nullable, giữ hành vi cũ |
| createdAt / updatedAt | Timestamp hiện có |

Giữ UNIQUE email cũ; thêm named unique expression index dự kiến
`UQ_users_email_normalized` trên lower(btrim(email)). Tra cứu/precheck dùng cùng biểu thức.
Không đổi id/email/dữ liệu học của account cũ. Bản ghi có email chuẩn hóa trùng hoặc identity
mâu thuẫn phải được báo và dừng migration; không tự gộp. Index expression phải được bảo toàn
khi TypeORM synchronize phát triển và khi tạo schema test, ví dụ khai báo index synchronize:false.

## AuthIdentity — bảng auth_identities hiện có

Fields: id UUID; provider password hoặc google; providerAccountId; userId FK → User CASCADE.
UNIQUE (provider, providerAccountId) giữ nguyên. Password identity mới dùng email chuẩn hóa;
không tự liên kết identity Google với password account dựa trên email chưa xác thực.

User 1 → N identities. Đăng ký mật khẩu mới tạo đúng một password identity.

## RefreshSession — bảng refresh_sessions hiện có

Fields: id UUID; userId FK → User CASCADE; tokenHash select:false; expiresAt; revokedAt nullable;
createdAt. User 1 → N sessions. Refresh token băm, không lưu token gốc; access token không lưu DB.
TTL access 15 phút, refresh 30 ngày giữ nguyên; refresh rotation/logout theo hành vi cũ.

Đăng ký mới tạo user, identity và session trong cùng transaction. Không commit session có
hash rỗng. Lỗi lưu/ký token/băm refresh rollback cả ba; cookies chỉ ghi sau commit.
Không có token hoặc passwordHash trong public User DTO.

## AuthLoginLimit — bảng auth_login_limits mới

| Field | Kiểu / quy tắc |
|---|---|
| scopeKey | text PRIMARY KEY; email: hoặc ip: + HMAC-SHA256 của giá trị canonical |
| attempts | integer >= 1, không vượt limit cho phép trong cửa sổ |
| windowStartedAt | timestamptz, thời gian DB ở request đầu cửa sổ |
| expiresAt | timestamptz, windowStartedAt + 900 giây mặc định, index cleanup |

Không FK vào User: email không tồn tại cũng có quota. Không lưu raw email/IP/password/token.
Secret HMAC đồng nhất giữa các instance; thay secret làm reset quota nên không rotate tùy tiện
trong cửa sổ đang hoạt động. Email trim/lower; IP canonical IPv4/IPv6 và IPv4-mapped IPv6 phải
được xử lý nhất quán từ nguồn tin cậy theo research.

Một login có cấu trúc hợp lệ yêu cầu hai scope: email (limit 5), IP (limit 30), kể cả login đúng.
Transaction reserve khóa hai scope theo thứ tự xác định để tránh deadlock; kiểm tra hết hạn rồi
reserve cả hai hoặc không cái nào. Request vượt quota không gia hạn expiresAt. Request được phép
commit quota trước bước kiểm tra password; lỗi password không rollback quota đã tiêu.
HTTP 429 có Retry-After theo quota bị chặn có thời gian hết hạn muộn nhất.

Lỗi kho limiter → 503. Hết hạn cho phép cửa sổ mới. Cleanup theo batch giới hạn và index,
xóa dữ liệu hết hạn trong tối đa 24 giờ; quota logic không phụ thuộc cleanup đúng thời điểm.

## State Transitions

- Guest → registering → transaction commit + cookie → authenticated (emailVerified=false).
- Register validation/conflict/storage/signing failure → guest, không account/session dở dang.
- Commit thành công nhưng response mất mạng → trạng thái client chưa rõ; không tự retry register.
  `/me` có cookie thì khôi phục; nếu không có cookie cho đăng nhập thủ công; gửi lại không tạo bản sao.
- Guest → login quota reservation → credentials valid → session + cookie → authenticated.
- Quota exhausted → temporary 429 → hết cửa sổ → có thể thử lại; không khóa User vĩnh viễn.
- Authenticated → access expires → refresh rotation → authenticated; refresh không hợp lệ → guest.
- Authenticated → logout → refresh revoked + cookies cleared → guest. Không thay chính sách JWT cũ.

## Validation and Migration Boundaries

Signup password 8–128, login 1–128 để tương thích; giữ nguyên khoảng trắng/case password.
Backend DTO chuẩn hóa email trước IsEmail, whitelist/forbidNonWhitelisted giữ nguyên.
Không sửa migration 001–004; migration mới chỉ thêm bảng/index và preflight có lỗi rõ.
Không chạy migrate trên production trong bước kế hoạch. Test rollback trên lỗi insert identity,
insert/update session và signing. Race test PostgreSQL thật; mock repository không đủ chứng minh.
