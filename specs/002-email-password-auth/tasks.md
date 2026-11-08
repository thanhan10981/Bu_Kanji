# Tasks: Đăng ký và đăng nhập email/mật khẩu

**Input**: Design documents from `specs/002-email-password-auth/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/auth.md](contracts/auth.md), [quickstart.md](quickstart.md).
**Created**: 2026-11-08
**Tests**: Có nhiệm vụ kiểm thử vì spec yêu cầu kiểm chứng FR/SC, giao dịch, hạn mức và hồi quy.
Viết các ca mới trước phần triển khai tương ứng, xác nhận thất bại vì hành vi còn thiếu;
không dùng lỗi thiếu môi trường làm bằng chứng test đã tái hiện hành vi.
**Organization**: Setup → foundation → US1 (P1) → US2 (P1) → US3 (P2) → kiểm tra xuyên suốt.

## Format: `[ID] [P?] [Story] Description`

- `[P]` chỉ công việc có thể làm đồng thời trong nhóm được chỉ định bên dưới, sau prerequisites.
- `[US1]`, `[US2]`, `[US3]` ánh xạ đúng ba User Story trong spec.
- Checkbox `[X]` chỉ công việc đã thực hiện; các gate chưa xác minh vẫn giữ `[ ]`.
- Sau mỗi thay đổi/nhóm nhất quán: rà diff, chạy kiểm tra liên quan ngay, sửa lỗi do thay đổi
  trước khi tiếp tục; ghi lệnh/kết quả/giới hạn trong `quickstart.md`, không ghi secret.

## Path Conventions

Đường dẫn tính từ root `C:\Bu nihon`: backend `backend/`, frontend `bu-nihon/`;
tài liệu tính năng `specs/002-email-password-auth/`. Tệp mới được nêu bằng đường dẫn dự kiến.
Không tạo lại framework, đổi dependency hoặc sửa migration 001–004.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Xác nhận phạm vi, giữ thay đổi sẵn có và chuẩn bị môi trường kiểm tra cô lập.

- [X] T001 Đọc `.specify/memory/constitution.md`, `bu-nihon/AGENTS.md` và các artifact tính năng; ghi baseline git, Node/dependency và các thay đổi sẵn có ở LoginModal/constitution vào `specs/002-email-password-auth/quickstart.md`, không ghi đè hoặc hoàn tác chúng.
- [X] T002 Tạo test harness dùng lại trong `backend/test/helpers/auth-harness.cjs`: TEST_DATABASE_URL riêng, từ chối DB production/trùng DATABASE_URL, schema cô lập với cleanup finally, tạo app HTTP hai instance khi cần; thiếu DB phải báo skip rõ, không coi là pass; cập nhật cách chạy trong `specs/002-email-password-auth/quickstart.md`.

**Checkpoint**: Baseline và test harness được xác minh trước khi sửa schema/source xác thực.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, chuẩn hóa và validation chung để ba luồng dùng cùng hợp đồng.
**CRITICAL**: Hoàn tất và kiểm tra phase này trước bất kỳ User Story nào.

- [ ] T003 Viết ca migration trước triển khai trong `backend/test/auth.migration.test.cjs`: DB rỗng, dữ liệu cũ, chạy lại bằng migration runner không đổi checksum, canonical duplicate/identity mâu thuẫn phải dừng không merge; index chuẩn hóa còn sau synchronize/restart, account và tiến trình học không đổi.
- [X] T004 Thêm `backend/database/migrations/005_email_password_auth.sql` sau khi xác nhận số kế tiếp: giữ UNIQUE email cũ, preflight và unique `UQ_users_email_normalized` trên lower(btrim(email)); thêm auth_login_limits với các ràng buộc “text PRIMARY KEY; email: hoặc ip: + HMAC-SHA256 của giá trị canonical”, “integer >= 1, không vượt limit cho phép trong cửa sổ”, “timestamptz, thời gian DB ở request đầu cửa sổ”, “timestamptz, windowStartedAt + 900 giây mặc định, index cleanup”; không FK vào User và không lưu raw email/IP/password/token; chỉ chạy migration trên DB local/test đã xác nhận.
- [X] T005 Đồng bộ index metadata trong `backend/src/auth/entities/user.entity.ts` để synchronize không xóa expression index; thêm `backend/src/auth/entities/login-limit.entity.ts` với scopeKey/attempts/windowStartedAt/expiresAt đúng T004, đăng ký entity trong `backend/src/auth/auth.module.ts`; giữ các ràng buộc User “UUID, giữ nguyên danh tính và liên kết tiến trình học”, “Nullable cho Google-only; select:false; mật khẩu Argon2id có salt”, “Nullable, giữ hành vi cũ” cho avatarUrl, “Timestamp hiện có” cho createdAt/updatedAt.
- [X] T006 Viết test transform/validate DTO trong `backend/test/auth.validation.test.cjs` trước khi sửa; chuẩn hóa email trong `backend/src/auth/dto/register.dto.ts` và `backend/src/auth/dto/login.dto.ts` trước IsEmail: “Bắt buộc, email hợp lệ; đầu vào trim/lower trước validation”; giữ “Signup password 8–128, login 1–128 để tương thích; giữ nguyên khoảng trắng/case password.”, whitelist/forbidNonWhitelisted; có lỗi validation tiếng Việt, không biến non-string thành email hợp lệ.
- [X] T007 Tạo Zod signup/login schemas tại `bu-nihon/src/lib/auth/schemas.ts` và kiểm tra bằng `bu-nihon/src/lib/auth/schemas.test.ts`: email trim/lower, signup 8–128, login 1–128, password nguyên trạng; sửa `bu-nihon/src/lib/api.ts` để register/login không tự refresh/replay, giữ refresh single-flight cho request được bảo vệ; kiểm tra bằng `bu-nihon/test/auth-api.test.cjs` theo node:test hiện có, không thêm framework.
- [ ] T008 Chạy `backend/test/auth.migration.test.cjs`, `backend/test/auth.validation.test.cjs` sau build và các test schema/API mới tại `bu-nihon/src/lib/auth/schemas.test.ts`, `bu-nihon/test/auth-api.test.cjs`; xác minh setup migration và DTO, rà toàn bộ diff nền tảng; ghi lệnh thực tế/kết quả trong `specs/002-email-password-auth/quickstart.md`, không coi DB skip là schema đã đạt.

**Checkpoint**: Schema/DTO/schema client nhất quán; test migration và validation có bằng chứng đạt.

## Phase 3: User Story 1 - Đăng ký rồi đăng nhập ngay (Priority: P1) — MVP

**Goal**: Account mới được tự đăng nhập ngay, không cần dịch vụ gửi thư, không ghi dữ liệu dở dang.
**Independent Test**: Tắt cấu hình gửi thư, đăng ký email mới → modal đóng → /me nhận đúng user
→ reload vẫn đăng nhập; trùng/race không tạo bản sao, lỗi giao dịch không tạo account/session dở dang.

### Tests for User Story 1

- [X] T009 [P] [US1] Viết contract test đăng ký trong `backend/test/auth.http.test.cjs`: 201 `{ user }`, cookie đúng flags/path/TTL, /me ngay sau register, emailVerified=false, không mail/OTP/token/hash trong JSON; 400/409/5xx và normalize qua HTTP đúng `specs/002-email-password-auth/contracts/auth.md`.
- [X] T010 [P] [US1] Viết integration PostgreSQL trong `backend/test/auth.integration.cjs`: hai register canonical email đồng thời chỉ một user/password identity/session; inject lỗi lưu identity/session, ký JWT hoặc băm refresh phải rollback cả ba; không commit tokenHash rỗng; duplicate không đổi account/password/tiến trình.
- [X] T011 [P] [US1] Mở rộng `backend/test/auth.test.cjs` cho password Argon2id m=65536 KiB/t=3/p=4, salt khác khi hai account cùng password, verify đúng/sai và hash cũ; register không gọi mail, public user không có passwordHash hay token.

### Implementation for User Story 1

- [X] T012 [US1] Sửa `backend/src/auth/auth.service.ts`: explicit băm password theo T011 trước transaction, lưu user/identity/session bằng cùng transactional manager; giữ User “false khi đăng ký mật khẩu, không tự đổi khi đăng nhập”, displayName “Giữ mặc định phần trước @ hiện có”; giữ AuthIdentity “id UUID; provider password hoặc google; providerAccountId; userId FK → User CASCADE.”, “UNIQUE (provider, providerAccountId) giữ nguyên.”; giữ RefreshSession “id UUID; userId FK → User CASCADE; tokenHash select:false; expiresAt; revokedAt nullable; createdAt.”, “TTL access 15 phút, refresh 30 ngày giữ nguyên”; helper session nhận manager tùy chọn, rollback mọi lỗi, precheck canonical + mapping đúng SQLSTATE 23505/constraint thành 409, không map lỗi DB khác thành trùng email.
- [X] T013 [US1] Sửa register trong `backend/src/auth/auth.controller.ts` để setSessionCookies chỉ sau commit và trả 201 `{ user }` thay message; giữ HttpOnly/SameSite=Lax/Secure production, access path `/`, refresh path `/api/auth`, domain/TTL hiện có; kiểm tra T009–T012 ngay sau nhóm backend.
- [X] T014 [P] [US1] Tạo `bu-nihon/src/lib/auth/service.ts` bọc register/login qua api và schema; kiểu `{ user: AppUser }` dùng chung, không gọi login tiếp sau register; mutation không tự retry, không persist password/token; chỉ dùng hợp đồng đã có, có thể làm song song T012–T013 sau test contracts được viết.
- [X] T015 [US1] Sửa nhánh signup trong `bu-nihon/src/components/auth/LoginModal.tsx` dùng service/schema và TanStack mutation retry=false; thành công setUser, xóa password, đóng modal, giữ trang; bỏ chuyển về login thủ công và đọc message cũ; giữ nguyên artwork/thay đổi sẵn có, password mặc định che, loading chống gửi trùng cơ bản.
- [X] T016 [US1] Xác minh tích hợp `bu-nihon/src/providers/AuthProvider.tsx` và `bu-nihon/src/lib/store.ts` với phiên sau signup: /me khôi phục khi reload, setUser xóa cache vocabulary và không persist auth/token; chỉ sửa nếu test phát hiện thiếu hành vi, không refactor store ngoài phạm vi.
- [ ] T017 [US1] Chạy backend `npm run test:auth`, HTTP/integration T009–T010 và frontend schema/API, lint/typecheck/build tại `backend/package.json`, `bu-nihon/package.json`; xác nhận không mail, không plaintext, race/rollback đạt rồi ghi bằng chứng trong `specs/002-email-password-auth/quickstart.md`.
- [X] T018 [US1] Kiểm tra UI signup và reload theo SC-001/002 trên máy tính/điện thoại: 10/10 email mới tự vào tài khoản, không Resend, không gọi login lần hai, hoàn thành trong 2 phút; ghi kết quả và giới hạn trong `specs/002-email-password-auth/quickstart.md`.

**Checkpoint**: US1 dùng được độc lập để demo local. Chưa phát hành công khai trước khi hạn mức US2
và kiểm tra cuối đạt; không giảm yêu cầu bảo mật để rút gọn MVP.

## Phase 4: User Story 2 - Đăng nhập lại và kết thúc phiên (Priority: P1)

**Goal**: Login account cũ chưa verify, giữ phiên, logout và giới hạn thử theo email/IP dùng chung DB.
**Independent Test**: Dùng account seed có mật khẩu chưa verify, không phụ thuộc signup mới;
login → reload → refresh → logout; sai thông tin bị từ chối, hết quota bị chặn tạm thời qua hai instance.

### Tests for User Story 2

- [X] T019 [P] [US2] Mở rộng `backend/test/auth.http.test.cjs`: login 201, cùng 401/message cho sai password/email lạ/Google-only; quota email request 6 và IP request 31 trả 429/Retry-After nguyên >=1, đúng password vẫn bị chặn khi hết quota, DB limiter lỗi 503, thử lại sau hết hạn; kiểm cookie/refresh/logout theo hợp đồng.
- [X] T020 [P] [US2] Mở rộng `backend/test/auth.integration.cjs` kiểm limiter bằng PostgreSQL: đồng thời qua hai tiến trình chung DB không vượt quota, restart giữ quota, reserve hai scope hoặc không scope nào, request bị chặn không gia hạn, clock DB/expiry, cleanup <=24 giờ; quota tính cả thành công/email không tồn tại và không reset khi login đúng.
- [X] T021 [P] [US2] Mở rộng `backend/test/auth.test.cjs` cho login account cũ/uppercase-space email, verify hash cũ, dummy hash được tạo một lần cho account không có password, không tiết lộ account hoặc link Google; giữ refresh rotation/logout và reset theo hành vi cũ.

### Implementation for User Story 2

- [X] T022 [US2] Tạo `backend/src/auth/login-limit.service.ts`, đăng ký trong `backend/src/auth/auth.module.ts`: mặc định email=5, IP=30, cửa sổ=900 giây từ request đầu; AUTH_RATE_LIMIT_SECRET dùng HMAC key đồng nhất, AUTH_LOGIN_* là số nguyên dương không cho tắt; transaction ngắn reserve hai scope có khóa advisory thứ tự xác định, dùng clock DB, commit quota trước verify, không kéo dài khi chặn, Retry-After theo scope đầy hết hạn muộn nhất; DB lỗi 503; cleanup batch/index trong 24 giờ không phụ thuộc traffic và lifecycle timer dừng khi app đóng.
- [X] T023 [US2] Sửa `backend/src/bootstrap.ts` để proxy trust chỉ từ AUTH_TRUSTED_PROXY_CIDRS hợp lệ, mặc định socket IP, không trust=true hoặc raw X-Forwarded-For; chuẩn hóa IPv4/IPv6/mapped IPv6 nhất quán tại `backend/src/auth/login-limit.service.ts`; test spoof ở cả trực tiếp và rewrite, giữ Origin/CORS hiện có.
- [X] T024 [US2] Tích hợp limiter vào `backend/src/auth/auth.service.ts` trước lookup/verify với IP được backend xác định; tính mọi login hợp lệ về cấu trúc, dùng dummy hash khi thiếu passwordHash, lookup canonical cả account cũ, giữ lỗi 401 chung, không chặn emailVerified=false và không reset quota khi đúng password.
- [X] T025 [US2] Cập nhật login trong `backend/src/auth/auth.controller.ts` truyền IP tin cậy, trả 429 với Retry-After và message tiếng Việt, không set cookie mới khi bị chặn; giữ 201 `{ user }`, /me/refresh/logout; chỉ expose Retry-After ở CORS allowlist hiện có tại `backend/src/bootstrap.ts`.
- [X] T026 [P] [US2] Mở rộng `bu-nihon/src/lib/api.ts` và `bu-nihon/test/auth-api.test.cjs`: ApiError thêm retryAfterSeconds optional từ Retry-After hợp lệ, giữ tương thích caller, không retry 429 hoặc replay register/login, không phát auth-expired vì login thất bại; protected reads vẫn dùng refresh single-flight.
- [X] T027 [US2] Tích hợp login qua service/schema vào `bu-nihon/src/components/auth/LoginModal.tsx`, cho password 1–128 thay minLength=8 chung của signup, đúng thì setUser/xóa password/đóng modal, sai giữ guest và thông báo chung; dùng mutation retry=false và không tự đăng ký/link Google.
- [X] T028 [US2] Xác minh và chỉ sửa khi thiếu hành vi ở `bu-nihon/src/providers/AuthProvider.tsx`, `bu-nihon/src/lib/store.ts`, `bu-nihon/src/components/layout/Header.tsx`: khôi phục /me, refresh hết access, logout thu hồi refresh/xóa cookie/setUser(null), xóa cache giữa account, giữ guest sau reload; chạy regression token cũ không refresh lại được.
- [ ] T029 [US2] Chạy tests T019–T021 và API/schema, kiểm 10/10 reload đúng user và 10/10 logout về guest, quota hai instance/restart/expiry/IP spoof theo SC-004/007; ghi số đo/kết quả và ca skip trong `specs/002-email-password-auth/quickstart.md` trước khi sang US3.

**Checkpoint**: US2 có thể kiểm độc lập bằng account seed; auth không phụ thuộc mail,
không bypass quota qua đồng thời/restart. Cấu hình IP thật vẫn phải qua gate phát hành cuối.

## Phase 5: User Story 3 - Sửa lỗi và thử lại (Priority: P2)

**Goal**: Form giải thích lỗi, tránh gửi trùng, chờ 429 và phục hồi mà không báo thành công giả.
**Independent Test**: Nhập sai → sửa → gửi lại; mô phỏng dịch vụ/mạng lỗi và hết quota
→ thấy lý do/thời gian chờ → chủ động thử lại; thao tác được bằng bàn phím và điện thoại.

### Tests for User Story 3

- [X] T030 [P] [US3] Mở rộng `bu-nihon/src/lib/auth/schemas.test.ts` cho email thiếu/sai, signup 7/8/128/129, login 1–128, không trim password và thông báo tiếng Việt; xác nhận lỗi schema trước mutation không làm request.
- [X] T031 [P] [US3] Mở rộng `bu-nihon/test/auth-api.test.cjs` cho 400/string-array message, 409, 429/Retry-After sai hoặc thiếu, 503 và response mất mạng sau commit; không refresh/replay auth hoặc gửi tự động, không coi unknown response là thành công.

### Implementation for User Story 3

- [X] T032 [US3] Sửa `bu-nihon/src/components/auth/LoginModal.tsx` nối schema/mutation với lỗi field/tiếng Việt, loading, khóa submit và tab/mode khi pending, không gửi lỗi cũ sau sửa thành công; config loading/error có retry chủ động, password luôn mặc định che khi mở lại.
- [X] T033 [US3] Sửa hiển thị 429 trong `bu-nihon/src/components/auth/LoginModal.tsx` dùng retryAfterSeconds: cho biết thời gian chờ, ngăn gửi khi chưa hết hạn, cập nhật khi hết hạn và cho thử lại chủ động; header thiếu/sai vẫn báo quá hạn mức, không retry loop và không khóa vô hạn.
- [X] T034 [US3] Hoàn thiện 409/503/lỗi mạng trong `bu-nihon/src/components/auth/LoginModal.tsx` và `bu-nihon/src/lib/auth/service.ts`: 409 cho quay lại login không đặt password mới; mất response register dùng /me khi có thể để khôi phục, nếu chưa có phiên hướng dẫn login thủ công, không tự gửi register lại hoặc báo thành công giả.
- [X] T035 [US3] Hoàn thiện accessibility trong `bu-nihon/src/components/auth/LoginModal.tsx`: label/aria cho email/password, role alert/status, focus hợp lý khi lỗi/đóng modal, thao tác keyboard, toggle mật khẩu có nhãn, bố cục điện thoại không che nút/tràn; không thay artwork hay thêm icon font.
- [ ] T036 [US3] Chạy test T030–T031, frontend lint/typecheck/build tại `bu-nihon/package.json`; kiểm UI gửi liên tiếp chỉ một request, sửa dữ liệu, 400/409/429/503 và recovery mất mạng; ghi kết quả trong `specs/002-email-password-auth/quickstart.md`.
- [X] T037 [US3] Thực hiện keyboard-only và viewport điện thoại cho cả signup/login/error/cooldown theo SC-006, kiểm nhãn đọc được và trạng thái lỗi/loading không báo sai; ghi bằng chứng trong `specs/002-email-password-auth/quickstart.md`.

**Checkpoint**: Ba User Story đủ luồng đúng/sai và phục hồi; không đánh dấu hoàn tất thay cho
các kiểm tra hồi quy/production chưa làm ở phase cuối.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Kiểm chứng toàn bộ yêu cầu, tài liệu vận hành và tính tương thích; không tự deploy.

- [X] T038 [P] Cập nhật `backend/README.md`, `backend/.env.example`, `DEPLOYMENT-START-HERE.md`, `render.yaml` cho email/password không cần Resend, biến limiter/proxy và secret riêng không chứa giá trị thật; nêu migration trước code, register đổi `{ user }`, phối hợp frontend/backend và rollback giữ schema/account mới, không thực hiện deploy.
- [X] T039 Chạy hồi quy auth/Google/reset khi có và không config, Origin/CORS, account cũ và tiến trình học theo `backend/test/auth.test.cjs`, `backend/test/auth.http.test.cjs`, `backend/test/auth.integration.cjs`; xác nhận không link email chưa chứng minh sở hữu, không password/token/hash trong response/log; ghi SC-005/008 vào `specs/002-email-password-auth/quickstart.md`.
- [ ] T040 Kiểm migration trên bản sao dữ liệu local/test và dev synchronize, so checksum 001–004 tại `backend/database/migrations/`, test index/limiter qua restart, cleanup khi không có traffic, xác minh rollback theo `specs/002-email-password-auth/plan.md` không xóa account/session/dữ liệu học.
- [ ] T041 Kiểm cookie HttpOnly/Secure/SameSite/path qua HTTPS và Next rewrite, IP topology tin cậy, header giả và hai nguồn IP thật theo `specs/002-email-password-auth/contracts/auth.md`; ghi môi trường và kết quả trong `specs/002-email-password-auth/quickstart.md`, nếu chưa có môi trường phải ghi chưa xác minh thay vì pass, không tự deploy để kiểm.
- [ ] T042 Benchmark Argon2id theo hạn mức dự kiến trên Node 22 với cấu hình máy gần môi trường chạy thật, kiểm bộ nhớ không OOM và SC-002 không quá 2 phút; ghi tham số/số đo trong `specs/002-email-password-auth/quickstart.md`, không giảm m/t/p hoặc thêm bypass để làm phép thử đạt.
- [ ] T043 Chạy toàn bộ quickstart phù hợp: backend build/test:auth/test:deployment và HTTP/integration mới, frontend schema/API/lint/typecheck/build từ `backend/package.json`, `bu-nihon/package.json`; tổng hợp FR-001–FR-015 và SC-001–SC-008 đạt/thất bại/chưa chạy vào `specs/002-email-password-auth/quickstart.md`, xử lý lỗi do thay đổi và kiểm lại.
- [ ] T044 Rà diff cuối với `.specify/memory/constitution.md`, `specs/002-email-password-auth/spec.md`, `specs/002-email-password-auth/contracts/auth.md`; xác nhận chỉ sửa auth cần thiết, giữ thay đổi người dùng, không secret, cập nhật trạng thái checkbox trung thực trong `specs/002-email-password-auth/tasks.md` và báo mọi gate chưa đạt; không đánh dấu hoàn tất khi còn kiểm tra bắt buộc chưa xác minh.

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1: T001 → T002
                  ↓
Phase 2: T003 → T004 → T005 → T006 → T007 → T008
                  ↓
Phase 3: US1 T009–T018
                  ↓
Phase 4: US2 T019–T029
                  ↓
Phase 5: US3 T030–T037
                  ↓
Phase 6: T038–T044 → bàn giao kết quả, không tự deploy
```

### User Story Dependencies

- US1 bắt đầu sau foundation; không phụ thuộc US2/US3 để kiểm signup tự đăng nhập.
- US2 được kiểm độc lập bằng account seed, nhưng triển khai sau US1 vì cùng sửa service,
  controller, modal và cùng test files; không chạy hai phase song song trên các file này.
- US3 tích hợp validation/lỗi đã có của US1 và limiter/Retry-After US2; có thể kiểm độc lập
  bằng response mô phỏng, nhưng không hoàn thành trước hai luồng chính.
- US1 MVP là demo local; đầy đủ tính năng và phát hành yêu cầu US1+US2+US3 và Phase 6 đạt.

### Within Each User Story

- US1: T009/T010/T011 → T012 → T013; T014 sau foundation và test contracts, có thể song song
  backend; T015 cần T013/T014; T016 → T017 → T018 sau tích hợp UI.
- US2: T019/T020/T021 → T022 → T023 → T024 → T025; T026 độc lập backend sau US1;
  T027 cần T025/T026, sau đó T028 → T029.
- US3: T030/T031 → T032 → T033 → T034 → T035 → T036 → T037.
- Phase 6: T038 có thể song song kiểm tra T039 khi các story đã hoàn tất; không chạy các test
  ghi chung database/schema hoặc các bước ghi cùng quickstart đồng thời. T044 sau T038–T043.
- Các test mới viết trước phần triển khai tương ứng; chạy lại ngay sau thay đổi có mục đích
  độc lập, không đợi đến task checkpoint cuối mới kiểm tra.

### Parallel Opportunities

Chỉ dùng các cặp/nhóm nêu rõ dưới đây, không suy diễn `[P]` thành được chạy trước prerequisites.
Không bắt buộc dùng agent hay nhân sự song song; tuần tự vẫn đúng thứ tự phụ thuộc.

## Parallel Example: User Story 1

```text
Sau T008: viết T009 (auth.http.test.cjs), T010 (auth.integration.cjs),
T011 (auth.test.cjs) đồng thời trên các tệp khác nhau.
Sau nhóm test: T014 (frontend auth/service.ts) song song T012–T013 (backend service/controller).
Chỉ tích hợp T015 sau khi các nhánh công việc trên hoàn tất.
```

## Parallel Example: User Story 2

```text
Sau US1: viết T019 (HTTP), T020 (integration), T021 (service tests) trên tệp riêng.
T026 (frontend api.ts + auth-api.test.cjs) có thể song song backend T022–T025.
T027 đợi cả hợp đồng lỗi backend lẫn API Retry-After hoàn tất.
```

## Parallel Example: User Story 3

```text
Sau US2: T030 (schemas.test.ts) song song T031 (auth-api.test.cjs).
T032–T035 cùng sửa LoginModal.tsx nên luôn tuần tự.
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Hoàn tất Setup/Foundation, kiểm tra schema/validation và không ghi đè source sẵn có.
2. Thực hiện US1: register nguyên tử + session/cookie + UI tự nhận user + no-mail.
3. Kiểm độc lập signup/race/rollback/reload và demo local; chưa triển khai công khai.

### Incremental Delivery

1. US1 đạt → thêm US2 và xác minh quota/phiên/tài khoản cũ.
2. US2 đạt → thêm US3 và xác minh lỗi/cooldown/recovery/accessibility.
3. Phase 6 đối chiếu toàn bộ acceptance và hồi quy, báo bằng chứng và giới hạn.
4. Chỉ đề xuất phát hành khi mọi gate bắt buộc đạt; thực hiện deploy là hành động riêng.

### Parallel Team Strategy

Chia công việc theo tệp như ví dụ; không giao đồng thời hai việc cùng auth.service.ts,
LoginModal.tsx, api.ts hoặc cùng tệp test. Hợp nhất và kiểm nhóm trước bước phụ thuộc.

## Requirement Coverage

| Requirements | Tasks chính |
|---|---|
| FR-001 | T014–T015, T027, T032 |
| FR-002–FR-003 | T003–T008, T009–T010, T024, T030 |
| FR-004 | T003–T005, T010, T012–T013 |
| FR-005–FR-007 | T009–T018, T021, T024, T027 |
| FR-008 | T019, T021, T024–T027 |
| FR-009 | T009, T016, T019, T028–T029 |
| FR-010 | T007, T015, T026, T030–T034, T036 |
| FR-011, FR-015 | T005, T011–T013, T015, T021, T035, T039 |
| FR-012 | T003, T010, T016, T021, T028, T038–T040 |
| FR-013 | T035–T037 |
| FR-014 | T004–T005, T019–T026, T029, T033, T040–T041 |
| SC-001–SC-002 | T017–T018, T042–T043 |
| SC-003–SC-004 | T009–T010, T017–T021, T028–T029, T043 |
| SC-005–SC-006 | T035–T039, T043 |
| SC-007–SC-008 | T011, T019–T025, T029, T039–T043 |

## Notes

- Tổng 44 task: Setup 2, Foundation 6, US1 10, US2 11, US3 8, Phase cuối 7.
- Mỗi User Story có tiêu chí kiểm độc lập và test cho hành vi thực; không tạo test chỉ để
  phản chiếu implementation hoặc test thay đổi tài liệu nhỏ.
- Tệp test/schema mới có thể chưa được script package gọi: ghi lệnh Node/loader cụ thể trong
  quickstart theo môi trường đã kiểm, không bỏ qua test vì chưa có npm script.
- Nếu chưa có DB test hoặc môi trường HTTPS/proxy thật, hoàn thành phần độc lập nhưng giữ
  task/gate liên quan mở và báo nguyên nhân; không sửa phạm vi để bỏ tiêu chí.
- Không commit, push hoặc triển khai tự động chỉ vì tạo hoặc thực hiện danh sách nhiệm vụ.

## Execution Status — 2026-11-08

34/44 tasks completed. Evidence and exact limitations: [quickstart.md](quickstart.md).

| Pending tasks | Reason |
|---|---|
| T003, T008, T040 | SQL/TypeORM/PGlite checks passed; real PostgreSQL migration runner/history verification unavailable |
| T017, T036 | Auth checks, browser and build passed; project-wide lint has 15 pre-existing errors outside auth |
| T029 | 10/10 browser reload/logout passed; two-process PostgreSQL integration skipped without TEST_DATABASE_URL |
| T041 | Real HTTPS/proxy topology and two external client IPs unavailable locally |
| T042 | Node 24 benchmark recorded; Node 22/production-equivalent benchmark pending |
| T043, T044 | Final all-gates completion depends on the open verification items above |

Implementation source is complete for all three user stories. This does not mark the
feature release-ready or waive remaining checks. No deployment, commit or push performed.
