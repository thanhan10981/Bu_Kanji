# Báo cáo Tự luận theo bài — 2026-11-04

## Hành vi

- Báo cáo dưới ba nút Danh sách / Flashcard / Tự luận của bài có sẵn; bộ cá nhân cũng có báo cáo.
- Hiển thị % thuộc, số từ thuộc/tổng số, tổng lần sai, số từ cần ôn và số từ chưa học.
- Từ sai nhiều nhất xếp theo số lần sai giảm dần; mặc định 5 từ, có xem tất cả.
- Mỗi lần chấm sai, kể cả sai tiếp khi đang sửa, cộng một lần sai. Gõ lại đúng theo đáp án
  không tính thuộc. Chỉ trả lời đúng độc lập mới tính thuộc; sai ở lượt sau sẽ đưa từ về cần ôn.
- % thuộc = số từ có lần nhớ lại gần nhất đúng / toàn bộ số từ hiện tại của bài × 100,
  làm tròn một chữ số thập phân. Từ chưa học không tính thuộc.
- Lưu ngay mỗi lần chấm bằng Zustand persist/localStorage, không cần hoàn thành lượt.
  Tách namespace theo ID tài khoản hoặc khách. Không tự chuyển lịch sử khách sang tài khoản.
- ID từ được dùng chung giữa bài và Tổng ôn; học Tổng ôn cập nhật báo cáo bài tương ứng.
- Thẻ được sửa nội dung không nhận lại trạng thái thuộc từ nội dung cũ; thẻ xóa không tính trong báo cáo.
- Khi trình duyệt chặn lưu, hiển thị cảnh báo; kết quả tạm thời vẫn ở bộ nhớ.

## Giới hạn lưu trữ

Lưu trên trình duyệt hiện tại, tách theo tài khoản; chưa đồng bộ backend hoặc giữa thiết bị.
Xóa dữ liệu trình duyệt sẽ xóa lịch sử này. Báo cáo bắt đầu ghi từ bản cập nhật này,
không khôi phục được các lượt học cũ trước khi có tính năng. Không đổi .env/database.

## Kết quả thực tế

- PASS production build, TypeScript, lint riêng phần thay đổi.
- PASS 15 nhóm unit test, gồm cộng sai/sửa đúng/nhớ lại, sai sau khi từng thuộc, tách A/B/khách,
  JSON round-trip, xếp từ sai nhiều nhất, bài/Tổng ôn và nội dung thẻ thay đổi.
- Lint toàn repo: 15 lỗi và 18 cảnh báo cũ ngoài phạm vi.
- Chrome riêng tại localhost:4360 (API danh tính A/B mô phỏng, không phải đăng nhập production):
  - PASS sai cùng từ 2 lần → 2 lần sai, sửa đúng → 0 từ thuộc cho từ đó.
  - PASS nhớ đúng từ khác → 1/60 = 1,7%; 1 từ cần ôn và 58 từ chưa học.
  - PASS thoát giữa lượt và reload vẫn còn báo cáo.
  - PASS Tổng ôn N3 hiện cùng 2 lần sai, số từ thuộc là 1/882.
  - PASS B xem báo cáo rỗng; quay về A vẫn thấy dữ liệu A.
  - PASS mobile 390px không tràn ngang; đã xem ảnh desktop/mobile.
  - PASS chặn localStorage.setItem: hiện cảnh báo không lưu được báo cáo.
  - PASS không có lỗi JS/hydration chưa xử lý trong kịch bản.

Kịch bản kiểm tra nằm ở `.tmp/progress-browser-check.cjs`, ảnh ở `.tmp/study-report-*.png`.
Push code và deploy lại Vercel để áp dụng; không cần sửa Render hoặc thêm biến môi trường.
Chưa deploy production trong phiên này.
