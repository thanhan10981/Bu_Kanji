# Thư viện từ ảnh và Tự luận — kiểm tra ngày 2026-11-04

## Thay đổi

- Nhập đủ các dòng trong 26 bảng ảnh người dùng cung cấp: 882 mục từ, từ 男性 đến つまり.
- Giữ các biến thể riêng ở số 627; bảng gốc có số thứ tự lặp/thiếu. ID dùng thứ tự dòng,
  không dùng số in trong ảnh. Không dùng số 844 ở ảnh menu làm số lượng dữ liệu.
- 15 bài theo thứ tự ảnh: 14 bài × 60 từ và bài cuối 42 từ; thêm Tổng ôn.
  Đây là cách chia để học trong Bu Kanji, không khẳng định là cách chia bài của giáo trình.
- Lưu chữ Nhật, nghĩa, cách đọc và Hán Việt nếu có. Ô cách đọc trống của từ kana được
  điền bằng chính cách đọc; katakana chuyển sang hiragana, giữ dấu kéo dài ー.
- Thư viện tĩnh đi cùng frontend, dùng ngay không cần đăng nhập/seed DB/migration.
  Bộ cá nhân tiếp tục dùng API và quyền sở hữu hiện tại.
- Tự luận có câu hỏi chữ Nhật hoặc nghĩa Việt; nhận cách đọc hoặc cách viết đã lưu.
  Trả lời đúng hiển thị chữ Nhật. Sai phải sửa đúng trước khi tiếp tục; lần sửa không tăng
  tiến độ và từ được đưa xuống cuối hàng đợi. Chỉ nhớ lại đúng ở lần sau mới tính thuộc.
- Kết quả tách điểm lần đầu khỏi số từ đã thuộc; có học lại câu từng sai và học lại tất cả.

## Kết quả thực tế tại localhost:4310

- PASS production build frontend; TypeScript đạt.
- PASS lint riêng các component, logic, dữ liệu và route Từ vựng đã sửa.
- Lint toàn repo: còn 15 lỗi và 18 cảnh báo cũ ngoài phạm vi thay đổi.
- PASS unit tests: chuyển romaji, n/nn, sửa giữa chuỗi, dán hiragana, chuẩn hóa đáp án,
  hàng đợi sửa sai (kể cả chỉ một từ và sai nhiều lần), chống cộng điểm hai lần, biến thể
  cách viết/cách đọc, 882 ID duy nhất, cách đọc hợp lệ, tổng số thẻ của 15 bài.

Kiểm tra Chrome headless riêng, không sử dụng phiên trình duyệt người dùng:

1. PASS mở thư viện chưa đăng nhập, 15 bài và Tổng ôn; danh sách Bài 1 có 60 dòng;
   tìm 注文 trả đúng một dòng.
2. PASS gõ sai ở 男性: giữ nguyên câu hỏi, không tăng tiến độ. Gõ `dansei` bằng từng
   phím cho ra `だんせい` trước Enter. Enter hiện `男性`, báo đã sửa đúng, tiến độ vẫn 0.
3. PASS tiếp tục: câu kế là 女性. Trả lời đúng 59 từ còn lại, 男性 quay lại cuối lượt,
   tiến độ 59/60. Nhớ lại đúng mới đạt 60/60; kết quả lần đầu 59 đúng, 1 sai.
4. PASS nút làm lại câu sai chỉ lấy từ từng sai. Flashcard hiển thị cách đọc/chữ Nhật.
5. PASS composition events mô phỏng: Enter khi đang ghép IME không chấm; kết thúc
   composition giữ nguyên văn bản, Enter tiếp theo mới chấm. Chưa kiểm tra IME Nhật thật
   bằng bộ gõ của hệ điều hành.
6. PASS viewport 390×844: thư viện, trang bài, Tự luận không tràn ngang; đã xem ảnh chụp
   giao diện Tự luận mobile và lưới bài desktop.
7. PASS URL trực tiếp/reload bộ có sẵn; /kanji trả trang và render; không có lỗi JavaScript
   chưa xử lý trong các trang kiểm tra.

Kịch bản/ảnh chạy thử nằm ở `.tmp/vocab-browser-check.cjs` và `.tmp/vocabulary-*.png`,
không đưa thư viện kiểm thử tạm hoặc ảnh vào dependency ứng dụng.

## Triển khai

Chỉ cần push rồi deploy lại frontend Vercel. Không thêm biến môi trường, không đổi
file .env hiện tại, không cần thay backend Render hoặc database cho thay đổi này.
Vào Từ vựng → MIMIKARA N3 → Bài → Danh sách / Flashcard / Tự luận.
Chưa deploy production trong phiên này. Lượt học hiện tại nằm trong bộ nhớ; tải lại
trang sẽ bắt đầu lượt mới, còn bộ từ có sẵn vẫn tồn tại theo source.
