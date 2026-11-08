# Implementation Plan: Đăng ký và đăng nhập email/mật khẩu

**Branch**: `main` | **Date**: 2026-11-08 | **Spec**: [spec.md](spec.md)

**Input**: `specs/002-email-password-auth/spec.md` và yêu cầu mới: tự đăng nhập sau đăng ký,
băm an toàn, xử lý email trùng và giới hạn thử đăng nhập. Chỉ lập kế hoạch.

## Summary

Mở rộng NestJS AuthModule và LoginModal hiện có, không tạo hệ thống xác thực khác.
Đăng ký lưu User, AuthIdentity và RefreshSession trong một transaction, rồi trả `{ user }`
và set cookie như đăng nhập. Giữ `emailVerified=false`, không gọi dịch vụ thư.
Giữ Argon2id, bổ sung constraint email chuẩn hóa và limiter dùng PostgreSQL.
Frontend cập nhật Zustand, xóa mật khẩu và đóng modal sau đăng ký thành công.

Đặc tả đã đồng bộ chỉ thị mới: FR-006 chuyển từ đăng nhập thủ công sang tự đăng nhập;
FR-014/015 bổ sung hạn mức và băm chuyên dụng. Không triển khai source trong giai đoạn này.

## Technical Context

**Language/Version**: TypeScript strict; Next.js 16.4.5/React 19.2.4; NestJS 11;
Node local v24.15.0, cấu hình Render Node 22. Kiểm tra trên Node 22 trước phát hành.

**Primary Dependencies**: TypeORM 0.3, pg 8, argon2 0.44, Nest JWT 11,
class-validator 0.14/class-transformer 0.5; Zustand 5, TanStack Query 5, Zod 4.
Giữ dependency hiện có, không thêm Redis hay thư viện auth mới.

**Storage**: PostgreSQL 16; users, auth_identities, refresh_sessions hiện có;
index email chuẩn hóa và bảng auth_login_limits mới qua migration kế tiếp (dự kiến 005).

**Testing**: node:test, assert, crypto thật; mở rộng `backend/test/auth.test.cjs`,
thêm integration PostgreSQL và HTTP auth. Frontend lint, typecheck, build và kiểm tra trình duyệt.

**Target Platform**: Web máy tính/điện thoại; Next rewrite `/api` sang NestJS;
PostgreSQL dùng chung giữa các tiến trình; HTTPS và cookie Secure trên production.

**Project Type**: Web application frontend + backend.

**Performance Goals**: Hoàn tất đăng ký và nhận diện trong 2 phút theo SC-002;
benchmark chi phí Argon2id dưới tải hạn mức để xác nhận đủ bộ nhớ trên máy chạy thật.
Không tuyên bố thông lượng chưa đo; không giảm tham số băm để đạt số đo.

**Constraints**: Không xác thực email; giữ account/tiến trình học, Google/reset;
không lưu token ở localStorage; không thay migration đã áp dụng; không tin header IP tùy ý.

**Scale/Scope**: Hai luồng đăng ký/đăng nhập trong modal sẵn có, session lifecycle hiện có;
limiter hoạt động với tối thiểu hai tiến trình cùng database. Không xây trang tài khoản mới.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Trước nghiên cứu | Sau thiết kế / bằng chứng |
|---|---|---|
| I. Sửa đúng phạm vi | PASS: chỉ auth và tài liệu liên quan | PASS: không refactor luồng học/Google/reset |
| II. Kiểm tra mỗi thay đổi | PASS: xác định tiêu chí trước sửa | PASS: mỗi nhóm ở dưới có kiểm tra riêng |
| III. Bảo toàn ngoài phạm vi | PASS: đọc trạng thái git | PASS: migration bổ sung, giữ dữ liệu, test hồi quy |
| IV. Giải pháp đơn giản | PASS: tái dùng AuthModule | PASS: Postgres/Argon2/cookie sẵn có, không dependency mới |
| V. Bằng chứng bàn giao | PASS: phân biệt kế hoạch và triển khai | PASS: quickstart chỉ rõ kiểm tra tương lai, không tuyên bố đã chạy |

Không có vi phạm cần ngoại lệ. `LoginModal.tsx` và constitution có thay đổi sẵn trước planning;
không ghi đè chúng. `setup-plan.ps1` báo BRANCH `002-email-password-auth` theo feature pointer;
`git branch --show-current` thực tế là `main`, không checkout/tạo branch ở bước này.

## Project Structure

### Documentation (this feature)

```text
specs/002-email-password-auth/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/auth.md
└── checklists/requirements.md
```

`tasks.md` được tạo ở bước `$speckit-tasks`, không tạo trong lệnh này.

### Source Code (repository root)

```text
backend/
├── src/bootstrap.ts
├── src/auth/
│   ├── auth.service.ts / auth.controller.ts / auth.module.ts
│   ├── dto/register.dto.ts / login.dto.ts
│   ├── entities/user.entity.ts / auth-identity.entity.ts / refresh-session.entity.ts
│   └── login-limit.service.ts / entities/login-limit.entity.ts (dự kiến)
├── database/migrations/005_email_password_auth.sql (dự kiến)
├── test/auth.test.cjs
└── test/auth.integration.cjs / auth.http.test.cjs (dự kiến)
bu-nihon/
├── src/components/auth/LoginModal.tsx
├── src/lib/api.ts / store.ts
├── src/lib/auth/schemas.ts / service.ts (dự kiến)
└── src/providers/AuthProvider.tsx
```

**Structure Decision**: NestJS là nơi xác thực và lưu phiên; Next chỉ dùng client API hiện có.
Validation Zod và service tách khỏi UI, backend DTO là lớp kiểm tra có thẩm quyền.
Không cần route Next mới; giữ fallback rewrite hiện có.

## Implementation Sequence and Validation

1. **Chuẩn hóa và bảo vệ dữ liệu**: trim/lowercase email trước DTO validation, giữ password
   nguyên trạng; migration thêm unique `lower(btrim(email))`, bảng limiter và entity tương ứng.
   Preflight phát hiện email chuẩn hóa bị trùng và identity không nhất quán: dừng migration,
   không tự merge/xóa. Đối chiếu dev synchronize với schema migration; expression index phải
   được khai báo để synchronize không xóa, và chạy migration trong môi trường kiểm thử.
   **Kiểm tra**: migration trên DB rỗng và bản sao dữ liệu cũ, chạy lại không thay checksum;
   email case/space trùng, giữ tài khoản/tiến trình; chỉ một tài khoản khi đăng ký đồng thời.
2. **Đăng ký và phiên nguyên tử**: băm password trước transaction bằng explicit Argon2id
   m=65536 KiB, t=3, p=4, salt do thư viện sinh. Dùng transactional EntityManager cho mọi
   ghi user/identity/refresh session. Cho helper tạo session nhận manager khi register,
   giữ hành vi login/refresh/Google khi không truyền manager. JWT và hash refresh lỗi phải
   rollback; không commit hash refresh rỗng. Set cookies sau commit; JSON chỉ `{ user }`.
   Precheck thân thiện + bắt đúng 23505 ở constraint email/password identity để trả 409;
   lỗi database khác vẫn là lỗi dịch vụ, không ngụy trang thành email trùng.
   **Kiểm tra**: rollback khi ghi identity/session hoặc ký JWT lỗi; `/me` ngay sau register,
   no mail, emailVerified=false, hash salt khác, password cũ verify được, cookie và refresh/logout.
3. **Giới hạn đăng nhập**: reserve quota trong transaction riêng trước tra cứu/verify,
   dùng limiter theo [research.md](research.md) và [data-model.md](data-model.md).
   Cả email không tồn tại cũng dùng quota; dùng dummy hash được tạo một lần cho trường hợp
   không có passwordHash để giảm chênh lệch xử lý. Không mở transaction limiter trong lúc băm.
   **Kiểm tra**: ngưỡng, thời gian hết hạn bằng clock điều khiển, song song, hai tiến trình,
   restart giữ quota, DB lỗi không bypass; header IP giả không đổi quota.
4. **Frontend**: cập nhật kiểu response đăng ký `{ user }`, gọi setUser giống login và đóng modal,
   xóa password. Tách schema Zod/service, dùng TanStack mutation với retry=false cho auth;
   khóa submit/tab đổi luồng khi đang gửi. API giữ refresh dùng chung cho các request đọc;
   không tự refresh/replay thao tác đăng ký hay đăng nhập. Hỗ trợ Retry-After/429, lỗi tiếng Việt,
   aria label cho field, focus/error/loading và mobile. Không chỉnh artwork ngoài nhu cầu form.
   **Kiểm tra**: schema biên độ dài, gửi một lần, đăng ký tự vào tài khoản, reload/logout,
   sửa lỗi, 429, keyboard/mobile; lint/typecheck/build.
5. **Hồi quy và vận hành**: Google/reset theo config cũ; kiểm tra cache đổi user qua setUser,
   cookie qua Next rewrite trên HTTPS, Origin/CORS, deployment Node 22, tham số hash và bộ nhớ.
   Cập nhật hướng dẫn để email/password không cần Resend, bổ sung cấu hình proxy/limiter.
   **Kiểm tra**: quickstart end-to-end; mỗi nhóm sửa phải kiểm tra trước nhóm tiếp theo.

## Compatibility and Release

- Register đổi response message-only sang `{ user }` kèm cookie, giữ HTTP 201. Đây là thay đổi
  hợp đồng có chủ đích: phát hành frontend/backend phối hợp; client cũ sẽ chưa tự nhận user
  đến lần reload. Không gọi login lần hai từ frontend để giả lập tự đăng nhập.
- Login giữ 201 và `{ user }`, bổ sung lỗi 429/Retry-After. Giữ access 15 phút, refresh 30 ngày,
  cookie path và SameSite hiện có; không gửi token trong JSON.
- Migration bổ sung chạy trước backend mới, không thay 001–004. Nếu có dữ liệu trùng chuẩn hóa,
  dừng phát hành và báo cần xử lý dữ liệu riêng, không xóa tự động.
- Rollback ứng dụng theo cặp frontend/backend; bảng/index bổ sung có thể giữ lại, không xóa account
  mới hay session để rollback. Xác minh phiên vẫn tương thích trước khi đóng thay đổi.
- Proxy production: cấu hình danh sách proxy/CIDR tin cậy, xác minh đường Next/Vercel → Render
  và đường truy cập API trực tiếp. Mặc định chỉ dùng socket IP; không tin raw X-Forwarded-For.
  Nếu chưa xác minh được client IP, không đánh dấu kiểm tra hạn mức theo nguồn đã đạt.

## Complexity Tracking

Không có ngoại lệ hiến chương. Bảng limiter và index bổ sung phục vụ trực tiếp yêu cầu
đồng thời và đa tiến trình; không dùng hạ tầng cache mới hoặc khóa toàn database cho mỗi login.
