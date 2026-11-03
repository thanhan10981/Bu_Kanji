# Research

## Cookie và hosting

Decision: Browser dùng /api cùng origin; Next external rewrite tới API_PROXY_TARGET
là origin Render, server-only. COOKIE_DOMAIN trống, SameSite=Lax, Secure production.
Google callback dùng domain frontend /api/auth/google/callback; lưu returnTo an toàn
trong cookie HttpOnly, chỉ nhận đường dẫn tương đối /vocabulary, fallback /kanji.
Rationale: dùng auth hiện có, tránh cookie bên thứ ba và không cần mua domain.
Alternatives: domain chung hợp lệ cũng dùng được nhưng cần DNS; SameSite=None trên hai
site mặc định phụ thuộc browser và không được chọn. CORS không giải quyết SameSite.
Giữ Origin guard, danh sách chính xác, private no-store trên API.
Sources: Next docs local node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/rewrites.md;
https://vercel.com/docs/rewrites ; https://vercel.com/docs/caching/cache-control-headers ;
https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie .

## Nhập hiragana

Decision: pure converter local, xử lý edit theo đoạn trước con trỏ; giữ pending romaji,
nhớ ngữ cảnh nn đã hiển thị ん để nguyên âm sau tạo な, không tái chuyển toàn bộ chuỗi.
KanaInput bảo vệ composition, phục hồi selection; normalization NFC + bỏ Unicode whitespace.
Rationale: hợp đồng nn cụ thể cần state riêng; không gọi server theo phím.
Alternatives: thư viện converter vẫn cần adapter cho selection/nn/IME; không thêm dependency
chỉ để thay logic nhỏ có bảng âm và test C01–C14. Không chuyển khi IME composition đang chạy.

## Lưu trữ và xóa

Decision: ba bảng vocab_folders/vocab_sets/vocab_cards, FK cascade, ownerId ở folder;
query set/card join về folder và owner, không tin owner từ client. SQL parameter binding.
Xóa folder/set có preview counts và expected counts trong request; transaction và lock
để không xóa nội dung tăng thêm mà người dùng chưa xác nhận (409 yêu cầu xác nhận lại).
Rationale: reuse PostgreSQL, không nhân bản auth, không dữ liệu mồ côi.
Alternatives: localStorage không đáp ứng persistence/account isolation; JSON blob khó ownership.

## Kiểm tra và môi trường

Decision: dùng node:test, compile TypeScript bằng compiler hiện có; test logic trước code,
kiểm tra PostgreSQL thật nếu local service có; không dùng database production để thử.
Build/lint baseline được ghi riêng, không sửa lỗi unrelated để làm xanh toàn repo.
Render dùng npm ci && npm run build; start npm run start:prod; migrate thủ công trước phát hành.
Không có Docker/psql trong PATH, cổng local 5432/5434 chưa sẵn sàng lúc khảo sát;
kiểm thử tích hợp phải báo pending nếu không thể provision local database an toàn.
Source: https://render.com/docs/deploy-node-express-app ; package scripts đã đọc.
