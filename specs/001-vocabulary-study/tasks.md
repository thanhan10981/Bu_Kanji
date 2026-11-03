# Tasks: Từ vựng cá nhân và luyện tập

**Input**: specs/001-vocabulary-study/{spec,plan,research,data-model,quickstart}.md, contracts/
**Tests**: bắt buộc theo yêu cầu nghiệm thu; tests logic/ownership trước code tương ứng.
**Format**: checkbox, Tnnn, [P] nếu độc lập, [USn] trong pha story, đường dẫn cụ thể.

## Phase 1: Setup

- [X] T001 Kiểm tra ignore/config và ghi baseline lint/build trong specs/001-vocabulary-study/validation.md; giữ bí mật ngoài git, cho phép commit env examples trong hai .gitignore.
- [X] T002 Chuẩn bị scripts test trong bu-nihon/package.json và backend/package.json, không đổi stack.

## Phase 2: Foundational

- [X] T003 Thiết lập same-origin /api rewrite trong bu-nihon/next.config.ts và no-store/refresh đồng bộ trong src/lib/api.ts.
- [X] T004 Thêm auth loading/error và xóa cache riêng tư khi đổi user trong bu-nihon/src/lib/store.ts, src/providers/AuthProvider.tsx.
- [X] T005 Thêm migration runner có transaction/history/checksum trong backend/scripts/migrate.cjs và npm run migrate trong backend/package.json.

## Phase 3: User Story 1 - Quản lý thẻ (P1)

Goal: CRUD riêng tư bền vững. Independent test: N3/ba bộ/thẻ rồi reload và A/B ownership.

- [X] T006 [US1] Viết test validation/ownership/stale delete trước code trong backend/test/vocabulary.test.cjs và test tích hợp backend/test/vocabulary.integration.cjs.
- [X] T007 [US1] Tạo backend/src/vocabulary/entities.ts, vocabulary.dto.ts và database/migrations/002_vocabulary.sql: tên "1–120 ký tự sau trim", nghĩa "1–500 ký tự sau trim", reading "1–200 ký tự hiragana hoặc ー sau NFC và bỏ khoảng trắng", japanese "tối đa 200 ký tự, tùy chọn"; UUID FK cascade, thứ tự createdAt,id.
- [X] T008 [US1] Tạo backend/src/vocabulary/vocabulary.service.ts với SQL parameter binding, join owner mọi thao tác, transaction/lock và expected counts khi xóa.
- [X] T009 [US1] Tạo controller/module trong backend/src/vocabulary/, đăng ký backend/src/app.module.ts; no-store và origin guard trong backend/src/bootstrap.ts.
- [X] T010 [P] [US1] Tạo schema/types/API/hooks trong bu-nihon/src/lib/vocabulary/schemas.ts, api.ts với validation giới hạn như T007 và query key theo user.
- [X] T011 [US1] Tạo bu-nihon/src/components/vocabulary/VocabularyApp.tsx và vocabulary.css: form/error/loading/empty, chống double-submit, xác nhận xóa counts, modal keyboard/focus.
- [X] T012 [US1] Mở rộng bu-nihon/src/app/(main)/vocabulary/page.tsx, folders/[folderId]/page.tsx và sets/[setId]/page.tsx; giữ navigation và /kanji.

## Phase 4: User Story 2 - Tự luận (P1)

Goal: nhập hiragana trực tiếp, chấm/retry. Independent test: C01–C14 và 3 câu 2 đúng/1 sai.

- [X] T013 [US2] Viết các ca converter/edit/normalization/grading trong bu-nihon/src/lib/vocabulary/kana.test.ts trước implementation.
- [X] T014 [US2] Tạo bu-nihon/src/lib/vocabulary/kana.ts và study.ts: bảng âm, partial, nn metadata, caret, NFC/whitespace, grade once, retry wrong.
- [X] T015 [US2] Tạo bu-nihon/src/components/vocabulary/KanaInput.tsx bảo vệ composition, Enter, caret/selection và StudySession.tsx cho Tự luận/snapshot/kết quả.
- [X] T016 [US2] Tạo bu-nihon/src/app/(main)/vocabulary/sets/[setId]/[mode]/page.tsx với written mode, lỗi/empty/quay về bộ.

## Phase 5: User Story 3 - Flashcard (P2)

Goal: mặt nghĩa/mặt đáp án, bounds/progress. Independent test: bộ 3 và bộ 0/1 thẻ.

- [X] T017 [US3] Thêm Flashcard trong bu-nihon/src/components/vocabulary/StudySession.tsx, route flashcard, flip keyboard, reset mặt/bounds và empty CTA.

## Phase 6: User Story 4 - Sẵn sàng phát hành (P2)

Goal: deploy guide đúng stack, auth đúng domain. Independent test: production proxy và US4.

- [X] T018 [US4] Thêm safe OAuth returnTo trong backend/src/auth/auth.controller.ts và bu-nihon/src/lib/api.ts; test reject redirect ngoài trong backend/test/vocabulary.test.cjs.
- [X] T019 [P] [US4] Tạo render.yaml, frontend/backend .env.example/.env.production.example và cập nhật backend/DEPLOYMENT.md với root/build/start/migrate/callback/proxy, không bí mật.
- [X] T020 [US4] Chạy production builds, test backend/frontend và lint; smoke HTTP local /kanji/direct deck/proxy, ghi kết quả thật trong specs/001-vocabulary-study/validation.md.
- [ ] T021 [US4] Thực hiện kiểm thử browser responsive/IME/caret/ownership/persistence trên môi trường PostgreSQL kiểm thử và ghi bằng chứng trong specs/001-vocabulary-study/validation.md; nếu thiếu môi trường giữ pending.

## Phase 7: Polish & Cross-Cutting

- [X] T022 Đối chiếu FR/SC, an toàn cache và thay đổi ngoài phạm vi; ghi hạn chế/deploy chưa thực hiện trong specs/001-vocabulary-study/validation.md.

## Dependencies & Execution Order

Setup → Foundational → US1 → US2 → US3 → US4 → Polish.
US2/US3 có thể kiểm tra độc lập bằng bộ fixture sau foundation nhưng UI thật dùng dữ liệu US1.
T010 độc lập với backend sau contract; T019 độc lập với T018. Cùng tệp luôn tuần tự.

## Parallel Examples

US1: backend T007–009 và frontend T010 có thể thực hiện sau contract, nối tại T011–012.
US2: sau T014, unit checks và review KanaInput có thể độc lập; T015–016 cùng UI thì tuần tự.
US3: kiểm tra bounds thuần và rà soát responsive không ghi cùng tệp có thể song song.
US4: T018 auth và T019 tài liệu/config độc lập; T020–021 cần code hoàn chỉnh.

## Implementation Strategy

MVP US1 trước, xác minh dữ liệu/ownership; tiếp tục US2 là nghiệm thu trọng tâm,
US3 dùng cùng snapshot; cuối cùng kiểm tra production proxy/guide. Không tự deploy khi thiếu
hosting; không đánh dấu test browser hoặc database đã đạt chỉ dựa vào code đọc được.
## Phase 8: Convergence

Đối chiếu 2026-11-03: 20 FR, 8 SC, 29 AC, 14 ca nhập, 8 quyết định plan,
5 nguyên tắc constitution và 22 task. Findings: missing=0, partial=3,
contradicts=0, unrequested=0; HIGH=3, không phát hiện vi phạm constitution.
Các task sau cụ thể hóa phần nghiệm thu T021 còn mở, không thay thế hoặc đánh dấu nó hoàn tất.

- [ ] T023 HIGH — F1: chạy backend/scripts/migrate.cjs trên PostgreSQL kiểm thử riêng, xác minh chạy lại/history/rollback; chạy backend/test/vocabulary.integration.cjs với TEST_DATABASE_URL, kiểm tra CRUD qua kết nối lại, mọi ownership/cascade/stale delete và ghi bằng chứng trong specs/001-vocabulary-study/validation.md per FR-006, FR-007, SC-003, SC-004, plan: migration/storage decision (partial).
- [ ] T024 HIGH — F2: kiểm thử bu-nihon/src/components/vocabulary/KanaInput.tsx, VocabularyApp.tsx và StudySession.tsx bằng browser/IME thật: C01–C14, caret/selection/Backspace/paste, Enter một lần, 3 câu 2 đúng/1 sai/retry, Flashcard bounds, form lỗi, keyboard, sáng/tối 375×812 và 1366×768, p95 chuyển âm; sửa lỗi quan sát được và ghi kết quả trong specs/001-vocabulary-study/validation.md per FR-008–015, SC-001, SC-002, SC-005, SC-006, US4/AC1, T021 (partial).
- [ ] T025 HIGH — F3: chạy full stack production local với database kiểm thử qua bu-nihon/next.config.ts proxy và backend/src/bootstrap.ts/auth/auth.controller.ts, xác minh login/refresh/logout, cookie paths/flags, Origin bị từ chối, A/B và cache sau đổi user, direct URL/reload cùng /kanji; kiểm tra Google callback/returnTo khi có cấu hình provider và ghi phần chưa chạy trong specs/001-vocabulary-study/validation.md per FR-019, FR-020, US1/AC10–11, US4/AC2–4, SC-007 (partial).

## Lần chạy implement tiếp — 2026-11-03

Không đổi checkbox của T021/T023/T024/T025: cả bốn vẫn chưa đủ bằng chứng để hoàn tất.

| Task | Đã thực hiện thực tế | Kết quả và phần còn mở |
| --- | --- | --- |
| T021 | Frontend production riêng 4310; HTTP /kanji, chi tiết, /vocabulary và URL bộ; kiểm tra công cụ browser | HTTP 200 nhưng chưa phải nghiệm thu UI; DB không chạy, browsers=[]; chưa thử đăng nhập/tạo/reload thẻ/IME/mobile |
| T023 | Dò executable/service/cổng DB; thử npm run migrate tới database riêng 55432; chạy test:integration | Các cổng 5432/5434/55432 ECONNREFUSED; migrate exit 1; integration SKIP 1; chưa chạy history/rollback/cascade trên DB thật |
| T024 | Chạy lại test:vocabulary frontend, TypeScript, lint feature; thử mở Chrome qua công cụ | 4 nhóm logic PASS, type/lint feature PASS; Chrome not available; C14, DOM caret, mobile, visual và p95 còn mở |
| T025 | Khởi động backend production 4301 với DB test/JWT test; frontend rewrite tới 4301; test backend | Backend exit 1 do ECONNREFUSED 55432; frontend /api/health 500; 5 unit tests PASS; full-stack sessions/Google chưa chạy |

Đã chuẩn bị `backend/docker-compose.vocabulary-test.yml`,
`backend/test/seed-vocabulary-users.cjs` và hướng dẫn
`specs/001-vocabulary-study/test-environment.md`. Không chạy seed thành công khi chưa có DB.
Chi tiết kết quả/lỗi cần bật hoặc cài nằm trong validation.md; checklist yêu cầu giữ nguyên.

Lượt yêu cầu nghiệm thu bốn mục tiếp theo: đã thử Compose trực tiếp nhưng docker không được
nhận diện; DB 55432 ECONNREFUSED, browser chrome không khả dụng. Frontend 4310 HTTP shell
còn hoạt động nhưng full-stack health 500. Không đủ điều kiện chạy migration/seed và các
luồng A/B/nhập liệu/mobile; cả bốn task vẫn mở. Bằng chứng từng mục:
`specs/001-vocabulary-study/acceptance-latest.md`.
