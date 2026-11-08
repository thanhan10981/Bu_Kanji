# Research: Email/password authentication

Ngày: 2026-11-08. Nghiên cứu source hiện có và nguồn chính thống; không chạy triển khai.

## 1. Tự đăng nhập sau đăng ký

**Decision**: User + password identity + refresh session cùng transaction; controller set cùng
cookie như login sau commit và trả `{ user }`. Frontend setUser và đóng modal.
**Rationale**: `backend/src/auth/auth.service.ts` đã có createSession, login không chặn email
chưa xác thực; register hiện chỉ trả message và lưu user/identity ngoài transaction.
`auth.controller.ts` đã có setSessionCookies, `AuthProvider.tsx` tải `/auth/me` và Zustand
`setUser` xóa cache vocabulary khi đổi danh tính. Tái dùng những cơ chế này.
**Alternatives considered**: frontend gọi register rồi login tạo hai thao tác độc lập và có
thể tạo account nhưng không vào được phiên; hệ auth mới là thừa. Chỉ thị mới thay thế FR-006 cũ.

## 2. Băm mật khẩu

**Decision**: explicit Argon2id m=65536 KiB, t=3, p=4 với salt ngẫu nhiên của thư viện,
verify hash cũ bằng argon2.verify. Không thay hash refresh/OTP/reset ngoài refactor manager cần thiết.
**Rationale**: đúng defaults bản đã cài tại `backend/node_modules/argon2/argon2.cjs`;
passwordHash hiện select:false. Giữ mức hiện tại và đo bộ nhớ/tốc độ ở môi trường chạy thật.
[node-argon2](https://github.com/ranisalt/node-argon2) hỗ trợ hash/verify Argon2id;
[OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
khuyến nghị băm thích nghi có salt và đưa ra baseline Argon2id; lựa chọn này giữ cấu hình dự án.
**Alternatives considered**: bcrypt yêu cầu đổi thư viện/hash; SHA/plaintext không phù hợp mật khẩu;
không hạ tham số mặc định để tối ưu khi chưa đo.

## 3. Email duy nhất và transaction

**Decision**: normalize trước DTO validation; thêm unique index `lower(btrim(email))` trong
migration mới. Precheck + mapping đúng constraint lỗi 23505; mọi ghi đăng ký dùng manager transaction.
Đọc account theo biểu thức chuẩn hóa để account cũ có uppercase/space vẫn dùng được; không bulk sửa
email hay identity cũ. Preflight báo canonical duplicate/identity lệch để xử lý riêng.
**Rationale**: service hiện trim/lower nhưng DTO IsEmail chạy trước service; UNIQUE email hiện là
case-sensitive. Precheck không ngăn race. Migration CLI kiểm checksum, không được sửa 001 đã áp dụng.
[TypeORM transactions](https://typeorm.io/docs/transactions/) yêu cầu dùng transactional manager.
**Alternatives considered**: chỉ precheck sẽ race; citext thêm extension; tự merge account ảnh hưởng
quyền sở hữu và tiến trình học. Giữ unique email hiện có, thêm index canonical làm tuyến cuối.

## 4. Hạn mức đăng nhập dùng chung

**Decision**: PostgreSQL auth_login_limits, cửa sổ 15 phút tính từ request đầu tiên;
5 attempts/email chuẩn hóa và 30 attempts/IP trong cửa sổ. Tính mọi request login hợp lệ về
cấu trúc, kể cả thành công, không tồn tại hoặc sai password; không reset quota khi thành công.
Đây là mặc định thiết kế của dự án, không phải con số do OWASP quy định.

Reserve hai quota nguyên tử trước verify bằng transaction ngắn, khóa advisory theo key đã sắp
thứ tự (không khóa toàn cục), rồi upsert/increment. Nếu một quota đầy, không tiêu quota còn lại;
commit/return quyết định rồi mới phát lỗi HTTP để tránh rollback nhầm cập nhật được phép.
Không tăng quota khi đã bị chặn, không kéo dài cửa sổ do request bị chặn. Dùng thời gian DB;
Retry-After là số giây làm tròn lên đến hết cửa sổ bị chặn muộn nhất. Hết hạn tự tạo cửa sổ mới.

Khóa lưu HMAC-SHA256 có tiền tố scope, dùng secret riêng AUTH_RATE_LIMIT_SECRET, cùng giá trị
trên các tiến trình, không log email/IP/token. AUTH_LOGIN_EMAIL_LIMIT=5,
AUTH_LOGIN_IP_LIMIT=30, AUTH_LOGIN_WINDOW_SECONDS=900; cấu hình phải là số nguyên dương
và không có giá trị tắt limiter. Dọn hàng hết hạn theo batch có index expiresAt,
retention tối đa 24 giờ; query bỏ qua hàng hết hạn dù chưa cleanup. DB lỗi trả 503, không bypass.

**Rationale**: `AiService` đã dùng PostgreSQL counter/transaction; không có auth throttle.
[OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
đề cập throttle theo account và lỗi chung. Hai quota giảm brute force một account và password spray.
Quota tạm thời có thể gây chờ cho người dùng cùng NAT hoặc email bị nhắm tới; không khóa vĩnh viễn.
**Alternatives considered**: in-memory mất khi restart, không chia sẻ; Redis thêm vận hành;
chỉ IP dễ đổi nguồn; chỉ email không hạn chế spray; khóa vĩnh viễn dễ gây từ chối dịch vụ.

## 5. IP và proxy

**Decision**: mặc định socket IP; chỉ dùng req.ip sau cấu hình trust proxy bằng danh sách
CIDR tin cậy AUTH_TRUSTED_PROXY_CIDRS khớp topology thật. Không dùng trust=true hoặc lấy phần tử
đầu X-Forwarded-For. Bắt buộc thử cả truy cập trực tiếp và qua Next rewrite trước release.
**Rationale**: bootstrap chưa trust proxy; deployment có Vercel/Render nên socket có thể là proxy.
[Express behind proxies](https://expressjs.com/en/guide/behind-proxies/) nêu trust phải khớp đường đi.
**Alternatives considered**: tin header của client cho phép đổi IP tùy ý; chỉ socket trong
production có thể gom mọi khách thành một IP. Giá trị CIDR thực tế là cấu hình môi trường phải
xác minh trước phát hành, không đoán bằng kế hoạch và không chặn công việc thiết kế.

## 6. UI, hợp đồng và kiểm tra

**Decision**: giữ api.ts, Zustand và AuthProvider; thêm schema/service auth nhỏ tách khỏi UI,
TanStack mutation retry=false; không replay register/login qua cơ chế refresh. Đọc tài liệu Next
local trước mọi thay đổi API Next nếu phát sinh; thiết kế này không cần route mới.
**Rationale**: `LoginModal.tsx` đang POST trực tiếp và signup chỉ đọc message; hiện minLength=8
cả login, chưa maxLength/validation Zod. Login backend cho 1–128 để tương thích mật khẩu cũ;
schema login giữ giới hạn này, signup 8–128. `bu-nihon/AGENTS.md` yêu cầu Zod, phân trách nhiệm.
**Alternatives considered**: refactor toàn API/store không cần thiết; thay thư viện UI tăng phạm vi.

`backend/test/auth.test.cjs` là service + repository giả, không chứng minh constraint/transaction
hay cookie HTTP. Bổ sung integration theo mẫu `test/vocabulary.integration.cjs`: database test
riêng, schema riêng, không dùng production. Test proxy/cookie thật qua browser là bước riêng.

## Resolved Questions

Không còn câu hỏi thiết kế chưa giải quyết. Tự đăng nhập ưu tiên chỉ thị mới, spec đã đồng bộ.
Ngưỡng limiter là mặc định được công khai; IP topology và benchmark là kiểm tra release có
điều kiện đạt rõ, không được ghi là đã xác minh trong bước lập kế hoạch.
