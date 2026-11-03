# Implementation Plan: Từ vựng cá nhân và luyện tập

**Branch**: feature context `001-vocabulary-study` (git main) | **Date**: 2026-11-03
**Spec**: [spec.md](spec.md)

## Summary

Mở rộng /vocabulary hiện có với thư mục, bộ thẻ riêng tư, Flashcard và Tự luận.
Dùng PostgreSQL/NestJS hiện có, ownership trên server. Frontend Vercel chuyển tiếp /api
đến backend Render bằng rewrite để giữ cookie HttpOnly cùng origin ở browser.
Giữ nguyên dữ liệu và source /kanji. Không thực hiện deploy nếu chưa có tài khoản hosting.

## Technical Context

**Language/Version**: TypeScript strict; Node 22+ (máy kiểm tra Node 24).
**Primary Dependencies**: Next.js 16.2.9, React 19, Zustand, TanStack Query, Zod;
NestJS 11, TypeORM, pg. Không thay framework hoặc cơ chế đăng nhập.
**Storage**: PostgreSQL; migration SQL có bảng lịch sử và transaction; không synchronize production.
**Testing**: Node test runner cho chuyển âm/chấm; test backend ownership/validation;
kiểm thử tích hợp PostgreSQL khi có database local; frontend lint/build và backend build;
guide nghiệm thu browser và deployment tách rõ phần chưa chạy.
**Target Platform**: Vercel Node frontend + Render Node Web Service + managed PostgreSQL.
**Project Type**: web application, hai root hiện có.
**Performance Goals**: chuyển âm local p95 <=100 ms; form sử dụng được ở 375 và 1366 px.
**Constraints**: không đổi Kanji/dữ liệu mẫu, không public/share, không lưu tiến độ dài hạn;
không dùng SameSite=None để phụ thuộc cookie bên thứ ba.
**Scale/Scope**: thư mục không lồng, một bộ thuộc một thư mục, một đáp án/thẻ;
tên 1–120, nghĩa 1–500, cách đọc 1–200, chữ Nhật tối đa 200 ký tự.

## Constitution Check

Pre-design: PASS. I: chỉ vocabulary và auth/deploy cần thiết; II: kiểm tra từng nhóm thay đổi;
III: không sửa Kanji; IV: giữ stack, không thêm kho dữ liệu; V: ghi rõ kiểm tra chưa chạy.
Post-design: PASS. Ownership kiểm tra cả quan hệ cha–con; test chuyển âm/IME và migration;
phần deploy chưa có URL được báo chưa triển khai. Không có ngoại lệ cần biện minh.

## Project Structure

### Documentation (this feature)

specs/001-vocabulary-study/: plan.md, research.md, data-model.md,
contracts/vocabulary.md, quickstart.md, tasks.md, validation.md.

### Source Code (repository root)

- backend/src/vocabulary/: entities.ts, vocabulary.dto.ts, vocabulary.service.ts,
  vocabulary.controller.ts, vocabulary.module.ts; backend/test/vocabulary.test.cjs.
- backend/database/migrations/002_vocabulary.sql; backend/scripts/migrate.cjs.
- backend/src/app.module.ts, bootstrap.ts; auth/auth.controller.ts: register module,
  no-store, origin checks, safe Google return path.
- bu-nihon/src/lib/vocabulary/: schemas.ts, api.ts, kana.ts, study.ts, kana.test.ts.
- bu-nihon/src/components/vocabulary/: VocabularyApp.tsx, KanaInput.tsx, StudySession.tsx,
  vocabulary.css; UI/state/validation/fetch separated.
- bu-nihon/src/app/(main)/vocabulary/: page.tsx, folders/[folderId]/page.tsx,
  sets/[setId]/page.tsx, sets/[setId]/[mode]/page.tsx.
- bu-nihon/src/lib/api.ts, lib/store.ts, providers/AuthProvider.tsx, next.config.ts:
  shared auth status, private query clearing, same-origin API rewrite.
- render.yaml; backend/DEPLOYMENT.md; frontend/backend .env.example and production examples.

**Structure Decision**: Giữ hai root hiện có; Server route wrappers chỉ truyền params vào
client vocabulary UI. TanStack Query khóa dữ liệu theo user; session snapshot tách khỏi cache.

## Delivery Phases

0. Nghiên cứu cookie topology và nhập hiragana; chốt trong research.md.
1. Data model/contracts/quickstart; không còn điểm chưa quyết định.
2. Tasks theo US1 → US2/US3 → US4; kiểm tra từng phần trước khi nối luồng.
3. Implement và validation: test pure logic, backend, lint/build, smoke production local.
4. Converge: chỉ đọc spec/plan/tasks và code hiện tại, append các khoảng trống còn lại.

## Complexity Tracking

Không có vi phạm constitution. Rewrite /api là cấu hình nhỏ cần thiết cho cookie trên
hai hosting khác site; không thêm gateway/service mới. Hướng dẫn deploy cho cả môi trường
mặc định qua proxy và domain tùy chỉnh, nhưng chỉ topology proxy là mặc định được hỗ trợ.
