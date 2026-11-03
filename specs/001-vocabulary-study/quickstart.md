# Quickstart và nghiệm thu

Để chạy kiểm thử riêng mà không chạm `.env`/database hiện tại, dùng
[test-environment.md](test-environment.md) trước. Hướng dẫn đó dùng PostgreSQL 55432,
backend 4301, frontend 4310 và tài khoản A/B riêng; các bước dưới là tổng quan dự án.

1. Node 22+, npm; PostgreSQL kiểm thử riêng. Không dùng dữ liệu production.
2. Backend: cd backend; npm ci; tạo .env từ .env.example và điền DB/JWT;
   npm run migrate; npm run build; npm run start:prod.
3. Frontend: cd bu-nihon; npm ci; tạo .env.local từ .env.example;
   NEXT_PUBLIC_API_URL=/api, API_PROXY_TARGET=http://localhost:3001;
   npm run dev. Production local: npm run build; npm run start.
4. Tests: frontend npm run test:vocabulary; backend npm run test:vocabulary;
   backend npm run test:integration với TEST_DATABASE_URL riêng nếu có.
5. Frontend npm run lint; npm run build; backend npm run build.
6. Browser: đăng nhập A; N3 → Bài 1/Bài 2/Bài 3 → thêm ăn/たべる/食べる;
   reload, mở URL bộ tab mới, Tự luận gõ taberu, xác minh たべる trước Enter và đúng sau Enter.
7. Thực hiện toàn bộ C01–C14 trong spec; lượt 3 câu 2 đúng/1 sai →66,7%, retry chỉ câu sai;
   Flashcard 1/3, lật/trước/sau, thẻ mới reset mặt trước; bộ rỗng không vào chế độ học.
8. A/B: thử đọc/ghi tài nguyên của A khi dùng B, kể cả tạo card/set dưới cha của A →404.
   Hủy/xác nhận xóa, counts stale →409, reload giữ dữ liệu đúng. Mất mạng giữ form và báo lỗi.
9. Viewports 375×812,1366×768, sáng/tối, Tab/Enter/Escape, IME thật; /kanji search/filter/detail.
10. Deploy theo backend/DEPLOYMENT.md và render.yaml; ghi URL thật, build, migration,
    health, login/refresh/logout/Google, direct URL và hồi quy vào validation.md.
    Nếu thiếu tài khoản/browser/database, ghi chính xác phần chưa chạy; không ghi PASS giả.
