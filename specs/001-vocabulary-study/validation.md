# Validation — Vocabulary

Ngày: 2026-11-03. Feature: specs/001-vocabulary-study. Chưa deploy lên hosting.

## Kết quả thực tế

| Kiểm tra | Kết quả | Giới hạn |
| --- | --- | --- |
| Frontend npm run build | PASS, bản cuối | Cần quyền mạng để tải Inter/Noto Sans JP hiện có; lần sandbox đầu thất bại font |
| Backend npm run build | PASS | Compile production, chưa chạy server với database thật |
| Frontend npx tsc --noEmit | PASS | Bao gồm feature và source hiện tại |
| ESLint feature/auth/config đã sửa | PASS | Không có lỗi hoặc warning ở tệp feature đã sửa |
| Frontend npm run lint | FAIL baseline: 15 errors, 18 warnings | Số lượng không tăng so với trước implementation |
| Frontend npm run test:vocabulary | PASS 4 nhóm | C01–C13 ở mức logic edit/converter; normalization/chấm/summary; chưa phải DOM/IME |
| Backend npm run test:vocabulary | PASS 5 tests | JWT cookie guard, redirect, DTO, mọi thao tác foreign owner, stale delete bằng test doubles |
| Backend npm run test:integration | SKIP 1 | Không có TEST_DATABASE_URL riêng; không tính là pass |
| Production HTTP local | PASS 6 URL | /kanji, /kanji/食, /vocabulary, folder, set, written; HTTP shell không chứng minh dữ liệu/auth |
| Production proxy qua fixture local | PASS | Path/query/Cookie/Origin/two Set-Cookie/no-store; fixture không phải auth/database thật |
| JSON, source whitespace, diff check | PASS | Không sửa Kanji hoặc data modules; không lộ .env thật |

HTTP smoke dùng `127.0.0.1:3100`, backend fixture tại port 3001; cả hai process kiểm thử
đã dừng sau kiểm tra. Các địa chỉ này không phải URL deploy hay môi trường preview đang duy trì.

Node v24.15.0. Scripts test yêu cầu Node 22.16+ hoặc 24, dùng --test-isolation=none vì
sandbox chặn process isolation (spawn EPERM). Test đỏ trước code do module chưa tồn tại;
sau implementation các nhóm test tương ứng xanh.

## Baseline lint ngoài phạm vi

- bu-nihon/src/app/(main)/kanji/page.tsx: 7 errors.
- bu-nihon/src/app/(main)/kanji/[kanji]/page.tsx: 1 error.
- bu-nihon/src/components/KanjiGraph.tsx: 1 error.
- bu-nihon/src/components/KanjiStrokeOrder.tsx: 5 errors.
- bu-nihon/src/hooks/useJapaneseTTS.tsx: 1 error.

Không sửa các lỗi trên để giữ phạm vi feature. Build production vẫn đạt.

## Rà soát coverage trước converge

| Nguồn | Code/tài liệu được rà soát | Trạng thái |
| --- | --- | --- |
| FR-001–007, US1 | VocabularyApp, routes, schemas/api, backend vocabulary, SQL migration | Đã triển khai; CRUD/persistence PostgreSQL và browser pending |
| FR-008, US3 | StudySession Flashcard, empty state, route | Đã triển khai; hành vi browser pending |
| FR-009–013, US2 | kana.ts, study.ts, KanaInput, StudySession, tests | Logic test đạt; caret/IME và lượt UI thật pending |
| FR-014–016 | Form/error/loading, CSS, auth status/cache, Kanji không đổi | Source/HTTP kiểm tra; visual/functional regression pending |
| FR-017–020, US4 | next.config, render.yaml, env examples, migration runner, DEPLOYMENT.md | Cấu hình/hướng dẫn có; build/proxy fixture đạt, real auth/deploy pending |
| Constitution I–V | Scope, checkpoints, contract/ownership, stack reuse, báo cáo | Không thấy thay đổi ngoài phạm vi hoặc tuyên bố nghiệm thu giả |

## Chưa được xác minh

1. PostgreSQL local/test: Docker và psql không có trong PATH, không có service/cổng 5432/5434
   hoạt động khi khảo sát. Chưa chạy migration runner với DB thật hoặc SQL integration suite.
2. Browser: không có browser connected. Chưa kiểm tra DOM caret/selection/composition C14,
   IME thật, bàn phím/chạm, responsive 375×812/1366×768, theme và p95 trên thiết bị.
3. Real sessions qua proxy: unit JWT guard/redirect và proxy fixture đạt, nhưng chưa thử
   login/refresh/logout, A/B trên HTTP full stack, Google callback thực và cache sau đổi user.
4. Vercel/Render: chưa truy cập tài khoản hoặc cấp phát dịch vụ; không có URL deploy mới.
   Không chạy migration production. Bản bàn giao là cấu hình/hướng dẫn sẵn sàng cho bước này.

T021 giữ pending. Converge sẽ đối chiếu lại code/artifacts và chỉ append phần còn thiếu vào tasks.md.
Chạy theo quickstart.md và backend/DEPLOYMENT.md; không coi các giới hạn này là kiểm tra đã đạt.

## Lần kiểm chứng tiếp — 2026-11-03

Các kết quả dưới đây thuộc lần chạy theo yêu cầu hoàn tất T021/T023/T024/T025,
không thay thế hoặc nâng trạng thái của những kiểm tra lịch sử ở trên.

### Môi trường và giới hạn được kiểm tra lại

- Node 24.15.0, npm 11.11.0. Checklist requirements.md: 16/16, không sửa marker.
- Không thấy docker/psql/pg_ctl/initdb trong PATH hoặc service PostgreSQL/Docker.
  `C:/Program Files/PostgreSQL` có thư mục nhưng không tìm thấy executable bên trong.
- TCP trực tiếp tới 127.0.0.1:5432, :5434, :55432 đều ECONNREFUSED.
- Công cụ UI: `getState()` trả apps=[], browsers=[]. Dù Chrome/Edge có executable,
  `createBrowserTab("chrome", "http://127.0.0.1:4310/vocabulary")` trả
  `Browser is not available: chrome`.
- Không sửa `.env.local`, `.env.production` của frontend hoặc `.env` backend.
  Biến DB test, JWT test và API test chỉ truyền vào process kiểm thử;
  không kết nối database/deploy production hoặc gửi email thật.

### Kết quả theo từng task

| Task | Thao tác đã chạy | Kết quả thực tế | Trạng thái |
| --- | --- | --- | --- |
| T021 | Build/start frontend production 4310; GET /kanji, /kanji/食, /vocabulary, /vocabulary/sets/11111111-1111-4111-8111-111111111111/written | Build PASS; bốn URL HTTP 200, có shell nhận diện. Chưa đăng nhập, tạo N3/thẻ hoặc reload dữ liệu bằng browser | OPEN — thiếu DB và browser |
| T023 | npm run migrate với DATABASE_URL local test 55432 và SSL=false; npm run test:integration | Migration exit 1 do không có DB. Integration SKIP 1 vì thiếu DB kiểm thử hoạt động; chưa xác minh history/rollback/persistence/cascade | OPEN — cần PostgreSQL |
| T024 | npm run test:vocabulary frontend; npx tsc --noEmit; ESLint feature; thử mở Chrome | 4 nhóm test logic PASS, type/lint feature PASS; browser unavailable. Chưa quan sát たべる trong DOM hoặc Enter chấm, C14/IME thật, caret, mobile và p95 | OPEN — cần browser và dữ liệu test |
| T025 | Backend build/start production 4301 với DB test 55432; frontend /api/health; npm run test:vocabulary backend | Backend build PASS; start retry 9 lần rồi exit 1: ECONNREFUSED 127.0.0.1:55432. /api/health qua frontend HTTP 500. 5 unit tests PASS; chưa có phiên full stack | OPEN — cần PostgreSQL/browser/provider nếu thử Google |

`npm run lint` toàn frontend được chạy lại: 15 errors/18 warnings như baseline;
không có lỗi mới ở các tệp feature đã kiểm tra. HTTP 200 của /kanji chưa xác minh thao tác
tìm kiếm/lọc/chi tiết bằng browser; phần hồi quy tương tác vẫn chưa được nghiệm thu.

### Sửa lỗi và chuẩn bị trong lần này

- Phát hiện migration CLI báo “transaction rolled back” ngay cả khi chưa kết nối DB.
  Sửa thông báo trong `backend/scripts/migrate.cjs` để không khẳng định rollback khi chưa
  bắt đầu transaction. Chạy lại với DB local chưa bật: exit 1, thông báo
  `Migration failed (ECONNREFUSED). No successful migration was confirmed.`
  Không in connection string hoặc mật khẩu.
- Thêm compose chỉ PostgreSQL ở loopback 55432, project/database/volume test riêng;
  parse YAML và kiểm tra project/database/port riêng PASS bằng js-yaml đã có trong repo;
  chưa chạy container vì máy chưa có Docker executable.
- Thêm seed tài khoản A/B chỉ chấp nhận local database đúng tên/port. Kiểm tra syntax PASS;
  thử URL remote mẫu bị từ chối exit 1 như mong đợi. Chưa chạy seed với database thật.
- Hướng dẫn từng cửa sổ PowerShell: [test-environment.md](test-environment.md).
  Hướng dẫn deploy đúng hai root: [backend/DEPLOYMENT.md](../../backend/DEPLOYMENT.md).

### Cần bật/cài để tiếp tục

1. Cài và bật Docker Desktop/Linux containers rồi chạy compose test; hoặc cài PostgreSQL 16
   với database local/role test theo test-environment.md. Không cần cung cấp bí mật production.
2. Kết nối browser automation cho phiên này để công cụ thấy Chrome/Edge; hiện không có surface
   browser điều khiển được. Cài browser đơn thuần chưa giải quyết kết nối này.
3. Bật Japanese/Microsoft IME trong Windows để thử composition thật, ngoài lượt bàn phím English.

Chưa deploy. Bốn task vẫn mở; không đánh dấu đạt luồng chính chỉ bằng unit test hoặc HTTP shell.

## Nghiệm thu theo bốn mục — lần kiểm tra mới nhất

Xem [acceptance-latest.md](acceptance-latest.md) cho từng mục PASS/FAIL/BLOCKED.
Đã thử lại đúng lệnh Compose: docker không được nhận diện. TCP 55432 ECONNREFUSED;
getState không có browser, mở Chrome qua công cụ không khả dụng.
Frontend 4310 vẫn chạy; /vocabulary, /kanji và /kanji/食 HTTP 200; /api/health HTTP 500.
Chưa chạy migration/seed hoặc kiểm thử giao diện khi các điều kiện cần chưa có.
T021/T023/T024/T025 giữ nguyên trạng thái mở. Không sửa source hoặc .env trong lượt này;
không chạy lại unit/build để thay thế bằng chứng nghiệm thu thực tế.
