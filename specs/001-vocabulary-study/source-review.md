# Khảo sát source trước đặc tả Từ vựng

**Ngày**: 2026-11-03
**Phạm vi**: đọc source/config và nguồn tham khảo; không sửa ứng dụng, không truy cập dữ liệu
production, không đọc giá trị trong `.env`, không chạy migration/build/deploy.
**Đặc tả**: [spec.md](spec.md)

## Kiến trúc đã xác định

| Phần | Bằng chứng trong repo | Kết luận từ source |
| --- | --- | --- |
| Frontend | `bu-nihon/package.json`, `src/app/layout.tsx`, `next.config.ts` | Next.js 16.2.9 App Router, React 19, TypeScript; root riêng `bu-nihon/`; cấu hình Next hiện chưa có rewrite API |
| Giao diện | `src/app/globals.css`, `src/components/layout/Sidebar.tsx`, `Header.tsx`, `SettingsModal.tsx` | Có nhận diện Bu Kanji, nền sáng xanh nhạt, màu nhấn xanh, thẻ trắng, theme tối, font Inter/Noto Sans JP, nút/input dùng chung |
| Routing | `src/app/(main)/layout.tsx`, `vocabulary/page.tsx`, `kanji/page.tsx`, `kanji/[kanji]/page.tsx` | `/vocabulary` và mục Từ vựng đã tồn tại; nhóm `(main)` dùng chung Sidebar/Header/Settings; `/kanji` có trang danh sách và chi tiết |
| Điều hướng mobile | `src/components/layout/Sidebar.tsx`, `src/app/globals.css` | Thanh dưới dùng năm mục đầu và đã có Từ vựng; active state hỗ trợ route con; có breakpoint responsive |
| Backend | `backend/package.json`, `src/app.module.ts`, `src/bootstrap.ts`, `src/main.ts` | NestJS 11, API prefix `/api`, validation toàn cục; server đọc PORT, bind `0.0.0.0` |
| Database | `backend/src/app.module.ts`, `src/auth/entities/`, `database/migrations/001_initial_auth.sql` | PostgreSQL qua TypeORM, nhận DATABASE_URL hoặc nhóm POSTGRES_*; chỉ tự synchronize ngoài production; migration SQL cho auth đã có |
| Đăng nhập | `backend/src/auth/auth.controller.ts`, `auth.service.ts`, `auth.guard.ts`, `auth.module.ts` | Email/mật khẩu, xác minh email, reset mật khẩu, Google OAuth; JWT cookie HttpOnly, access 15 phút/refresh 30 ngày; guard mặc định yêu cầu đăng nhập |
| Phiên frontend | `bu-nihon/src/lib/api.ts`, `providers/AuthProvider.tsx`, `lib/store.ts` | Request gửi credentials, thử refresh khi 401; AuthProvider tải `/auth/me`; trạng thái người dùng trong store; persist chỉ lưu tùy chọn giao diện |
| Deploy hiện có | `backend/vercel.json`, `api/[...path].ts`, `DEPLOYMENT.md`, hai `.env.production.example` | Có hướng dẫn hai dự án Vercel, frontend `vothanhan.dev`, API `api.vothanhan.dev`; đây là cấu hình tài liệu, không chứng minh domain đang hoạt động |
| Chạy local | `backend/Dockerfile`, `docker-compose.yml` | Docker hiện phục vụ development, có PostgreSQL volume; không được coi Dockerfile này là bản production đã hoàn thiện |

Các đường dẫn `src/...` trong bảng thuộc root của phần được nêu ở cột đầu.
Không có file cấu hình Render tìm thấy trong danh sách source đã khảo sát.

## Hiện trạng Từ vựng và Kanji

- `bu-nihon/src/app/(main)/vocabulary/page.tsx` chỉ hiển thị các mức JLPT bằng
  `jlptLevelInfo`, có khóa một số mức theo `isLoggedIn`; chưa có CRUD cá nhân hoặc chế độ học.
  Vì vậy cần mở rộng điểm vào sẵn có, không thêm một mục điều hướng Từ vựng thứ hai.
- `bu-nihon/src/data/vocabulary.ts` có mẫu `word`, `kana`, `meaning`, `level`,
  `partOfSpeech`, `example`. Một số chuỗi trong tệp biểu hiện lỗi mã hóa ngay khi đọc UTF-8;
  không dùng dữ liệu này làm dữ liệu nghiệm thu mặc định và không sửa trong feature này.
- `bu-nihon/src/data/kanji.ts` được import trực tiếp bởi danh sách/chi tiết Kanji.
  Không có yêu cầu chuyển dữ liệu này sang cơ chế mới. Giữ nguyên file và hành vi `/kanji`.
- Chưa có entity, migration hoặc module backend cho thư mục/bộ/thẻ trong các tệp khảo sát.
  Việc có guard đăng nhập không đồng nghĩa đã có kiểm tra quyền sở hữu cho tài nguyên mới.
- Không thấy dependency chuyển romaji trong `bu-nihon/package.json` và các kết quả tìm source.
  Chọn cách chuyển âm thuộc bước plan; đặc tả chỉ quy định kết quả quan sát được.

## Thành phần có thể tái sử dụng

| Thành phần | Giá trị tái sử dụng | Giới hạn cần ghi nhớ khi lập kế hoạch |
| --- | --- | --- |
| `(main)/layout.tsx`, Sidebar/Header/Settings | Khung trang, điều hướng và nhận diện | Giữ active state route con; không thêm navigation song song |
| `globals.css`, Providers/ThemeApplier, Zustand store | Token màu, font, card, input, button, theme, preferences | Kiểm tra form/nút mới trên mobile; không lưu bộ cá nhân chỉ bằng store preferences |
| `LoginModal.tsx`, AuthProvider, `AppUser` | Đăng nhập và định danh người học | AuthProvider hiện chưa có trạng thái loading/error tách biệt; cần tránh nhầm đang tải với khách |
| `lib/api.ts` | API base qua NEXT_PUBLIC_API_URL, credentials, lỗi, refresh | Hiện chỉ expose get/post/googleLogin; thao tác sửa/xóa cần mở rộng ở giai đoạn implementation |
| `providers/Providers.tsx`, `lib/queryClient.ts` | Cơ chế dữ liệu bất đồng bộ và cache hiện có | Dữ liệu cá nhân phải được cô lập/xóa đúng khi đổi tài khoản; cache không phải lưu trữ bền vững |
| `lib/schemas.ts` | Mẫu validation đã có | Schema tìm kiếm từ vựng hiện không thay thế validation thư mục/bộ/thẻ |
| JwtCookieGuard, CurrentUser, AuthService | Xác thực và xác định chủ sở hữu phía server | Tài nguyên mới vẫn phải kiểm tra owner và quan hệ cha–con trên mọi thao tác |
| TypeORM/PostgreSQL và SQL migrations | Cơ sở lưu dữ liệu bền vững | Cần migration bổ sung riêng, không reset hoặc thay thế bảng auth/kanji |
| `/api/health` | Kiểm tra API và kết nối database | Không thay thế kiểm tra đăng nhập, quyền sở hữu và lưu thẻ thực tế |

## Ràng buộc triển khai để đưa vào kế hoạch

Repo đã tách hai phần nên phù hợp đích frontend Vercel và backend Render mà không cần
đổi cấu trúc. Các lệnh sau được suy ra từ package scripts/entrypoint đã đọc,
chưa chạy xác minh production trong lần đặc tả này.

| Dịch vụ | Root | Cài đặt | Build | Start | Biến chính |
| --- | --- | --- | --- | --- | --- |
| Frontend Vercel | `bu-nihon` | `npm ci` | `npm run build` | Nền tảng quản lý; chạy bản build local bằng `npm run start` | `NEXT_PUBLIC_API_URL=https://api.example.com/api` |
| Backend Render Web Service | `backend` | `npm ci` | `npm run build` | `npm run start:prod` (`node dist/main`) | `NODE_ENV=production`, PORT do hosting cấp, database/auth/origin bên dưới |
| PostgreSQL bền vững | Dịch vụ database, không phải thư mục deploy | Không áp dụng cài package | Không build | Dịch vụ quản lý | DATABASE_URL và cấu hình SSL phù hợp nhà cung cấp |

### Biến môi trường đã có và nội dung mẫu cần bàn giao sau này

Hiện có `backend/.env.example`, `backend/.env.production.example` và
`bu-nihon/.env.production.example`. Bước thực hiện phải cung cấp `.env.example`
cho cả frontend/backend, cập nhật ví dụ production theo đích hosting và giữ toàn bộ bí mật
ở môi trường. Không ghi đè các `.env` đang sử dụng.

| Biến | Nơi dùng | Giá trị mẫu hoặc ý nghĩa |
| --- | --- | --- |
| NEXT_PUBLIC_API_URL | Frontend | `https://api.example.com/api`; biến công khai, thiết lập trước build |
| NODE_ENV | Backend | `production` |
| PORT | Backend | Hosting cấp; local mẫu `3001` |
| DATABASE_URL | Backend | `postgresql://USER:PASSWORD@HOST:5432/DATABASE` |
| DATABASE_SSL | Backend | `true` hoặc `false` theo kết nối của nhà cung cấp; phải xác minh |
| POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB | Backend | Nhóm thay thế DATABASE_URL, ví dụ `localhost`, `5432`, `example_user`, `replace_me`, `example_db` |
| POSTGRES_HOST_PORT | Docker local | `5434`; không phải biến kết nối database production |
| FRONTEND_URL | Backend | `https://app.example.com` |
| CORS_ORIGIN | Backend | Danh sách origin chính xác, phân tách dấu phẩy; ví dụ `https://app.example.com` |
| COOKIE_DOMAIN | Backend | Để trống cho host-only hoặc domain chung hợp lệ theo thiết kế đã xác minh |
| COOKIE_SECURE | Backend | `true` trên HTTPS production |
| JWT_ACCESS_SECRET, JWT_REFRESH_SECRET | Backend | Hai giá trị mẫu khác nhau, thay bằng bí mật độc lập khi triển khai |
| RESEND_API_KEY, RESEND_FROM_EMAIL | Backend | `re_replace_me`, `Bu Kanji <auth@example.com>`; cần sender đã xác minh khi dùng email |
| GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET | Backend | `replace_me` nếu dùng Google login |
| GOOGLE_CALLBACK_URL | Backend | `https://api.example.com/api/auth/google/callback`, khớp cấu hình OAuth |

Các domain trên chỉ là ví dụ, không phải URL deploy thực tế.

### Điểm phải giải quyết trước khi xác nhận sẵn sàng phát hành

- Cookie hiện hard-code `sameSite: 'lax'`. Hai origin mặc định `*.vercel.app` và
  `*.onrender.com` là hai site khác nhau; không được giả định cấu hình hiện tại đủ cho
  request có cookie giữa chúng. Plan phải chọn topology/domain và chính sách cookie phù hợp,
  cân nhắc hạn chế cookie bên thứ ba, bảo vệ request thay đổi dữ liệu, rồi chứng minh trên browser.
  Không chỉ thay CORS hoặc tắt bảo vệ. Đặc tả không chốt thay đổi kiến trúc ở bước này.
  Cơ sở đối chiếu: [MDN: SameSite và Domain của cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).
- CORS và kiểm tra Origin hiện lấy danh sách từ CORS_ORIGIN hoặc FRONTEND_URL;
  callback Google quay về `/kanji`. Yêu cầu trở lại liên kết bộ sau đăng nhập cần được giải quyết
  cùng luồng xác thực hiện có, không thay thế hệ thống auth.
- Production tắt `synchronize`. Migration auth hiện là SQL chạy thủ công;
  không có script migrate trong package.json đã đọc. Không ghi hướng dẫn `npm run migrate`
  như thể lệnh đã tồn tại.
- Với database mới: chạy `backend/database/migrations/001_initial_auth.sql` trước migration
  từ vựng bổ sung. Với database hiện có: kiểm tra lịch sử/schema và chỉ áp dụng phần còn thiếu;
  không reset dữ liệu. Migration từ vựng, cách chạy chính xác và cơ chế theo dõi áp dụng sẽ
  được xác định ở plan/implementation, rồi bàn giao hướng dẫn có thể chạy và kiểm tra.
- Kiểm tra phát hành phải gồm build frontend/backend, health/database, login/refresh/logout,
  quyền sở hữu A/B, direct URL bộ, tạo thẻ rồi reload, 14 ca nhập liệu, lượt câu sai và /kanji.
- Chưa kết nối tài khoản Vercel/Render trong bước này. Không tạo service, sửa domain,
  đưa bí mật lên hosting hoặc chạy migration production.

## Nguồn tham khảo và giới hạn khảo sát

- [Bu Kanji hiện tại](https://bu-kanji.vercel.app/kanji): công cụ đọc web không truy cập được
  trang này trong phiên khảo sát. Nhận diện/routing được xác định từ source local;
  chưa xác nhận source local trùng phiên bản đang deploy.
- [Phá đảo tiếng Nhật](https://phadaotiengnhat.com/): nội dung công khai được tìm thấy có
  Từ vựng, Flashcard và Tự luận. Công cụ mở trang không trích xuất được nội dung tương tác,
  và không có browser khả dụng trong phiên này. Chưa thử luồng sau đăng nhập;
  hành vi chi tiết trong đặc tả căn cứ yêu cầu người dùng, không khẳng định đã kiểm chứng trên site.
- [Quizlet: tạo bộ thẻ](https://help.quizlet.com/hc/en-us/articles/360029780752-Creating-flashcard-sets):
  tham khảo bộ có tên và các cặp nội dung thuật ngữ/định nghĩa. Không đưa mặc định chia sẻ công khai,
  chức năng thuê bao, tự động lưu hay nội dung của Quizlet vào phạm vi.
- [Quizlet: tổ chức bộ bằng thư mục](https://help.quizlet.com/hc/en-us/articles/360049850051-Organizing-sets-in-a-class-with-folders):
  tham khảo ý tưởng nhóm bộ để dễ tìm; không bổ sung lớp học hoặc cơ chế quyền theo Quizlet.
- [Render: triển khai Node Web Service](https://render.com/docs/deploy-node-express-app):
  đối chiếu khả năng đặt lệnh build/start riêng; các lệnh trong bảng được lấy từ repo,
  không sao chép lệnh của ứng dụng mẫu Render.

## Trạng thái kiểm chứng của lần đặc tả

Đã đọc kiến trúc, auth, dữ liệu, routing, config deploy, template và constitution;
đã rà soát yêu cầu/tiêu chí, đường dẫn tài liệu và metadata feature.
Không chạy build, lint ứng dụng, kiểm thử tính năng mới hoặc kiểm thử live/deploy.
Những kiểm tra đó là điều kiện hoàn thành feature về sau, không phải bằng chứng đã đạt hiện tại.
