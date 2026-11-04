# Nhập bộ thẻ Quizlet Đề 7/2026 – 30/10

Ngày kiểm tra: 2026-11-04. Chỉ sửa frontend; không đổi .env, backend, database hoặc deploy production.

## Nội dung nguồn

- PDF người dùng cung cấp: `Thẻ ghi nhớ_ đề 7_2026 30_10 _ Quizlet.pdf`, 36 trang.
- Trang đầu ghi 707 thuật ngữ; trích xuất đủ 707 dòng từ cột thuật ngữ/định nghĩa.
- Giữ nguyên thứ tự, các dòng trùng lặp, từ vựng, cụm từ, mẫu ngữ pháp, nghĩa và ví dụ.
- Không nhập menu, học phần được gợi ý, tên tài khoản, header/footer của Quizlet.
- Dữ liệu: `bu-nihon/src/data/quizlet-de-7-2026.json`; mỗi thẻ có trang nguồn để đối chiếu.
- 12 bài: 11 × 60 thẻ + 47 thẻ, thêm Tổng ôn 707 thẻ. Bộ N3 882 thẻ giữ nguyên ID/dữ liệu.

## Cách đọc và đối chiếu

- Dùng PyMuPDF đọc theo vị trí bảng; ghép cả các dòng định nghĩa/ví dụ xuống dòng.
- Đối chiếu độc lập bằng pypdf: 707 thẻ, cả 36 trang, không còn trường bị lệch. Chuẩn hóa
  khoảng trắng và các ký hiệu tương đương do font PDF (`～`/`〜`, dấu chấm giữa).
- Hai thẻ tại trang 30, số dòng nhập 587–588 (`Vてから + B`, `Vる + といい`), không có trường
  cách đọc riêng trong PDF. Giữ nguyên toàn bộ nghĩa/ví dụ, bổ sung cách đọc phần cố định
  `てから` và `といい`, kèm ghi chú rõ ràng; không coi đó là nội dung trích nguyên văn từ PDF.
- Cách đọc hiển thị giữ ký hiệu nguồn. Đáp án chấp nhận riêng từng biến thể như `な`/`めい`,
  `よい`/`いい`, bỏ ký hiệu vị trí trống `～` và ký hiệu thành phần câu `V` khi gõ.

## Kết quả kiểm tra

- PASS production build, bao gồm route `/vocabulary/library/quizlet-2026-07`.
- PASS 11 nhóm unit test: bộ N3, 707 thẻ PDF, đủ 36 trang nguồn, ID không trùng, các
  đáp án thay thế, mẫu ngữ pháp, romaji và hàng đợi sửa sai.
- PASS lint riêng các component/logic/route Từ vựng sửa trong lần này.
- Lint toàn repo: 15 lỗi và 18 cảnh báo cũ ngoài phạm vi thay đổi.

Chrome headless chạy riêng trên localhost:4310:

1. PASS trang chủ có 2 bộ; bộ Quizlet có 12 bài và Tổng ôn; bài đầu có 60 dòng và tìm kiếm được.
2. PASS Flashcard: nghĩa `Tính toán` → `けいさん`/`計算`.
3. PASS Tự luận: gõ từng phím `keisan`, Enter chấm đúng và hiện `計算`; câu kế là `検算`.
   Gõ sai rồi sửa bằng `kenzan` không tăng số từ đã thuộc.
4. PASS Tổng ôn có đủ 707 dòng. Thẻ cuối `～より～ほうが` còn đầy đủ ví dụ, kết thúc bằng
   `Đặt nhanh hơn tốt hơn đặt quá chậm.`
5. PASS bài cuối 47 thẻ; URL trực tiếp và reload; nút quay lại về đúng bộ Quizlet, không về N3.
6. PASS viewport 390×844: trang chủ, lưới bài, danh sách dài không làm tràn ngang trang;
   đã xem ảnh chụp trang chủ mobile và lưới bài desktop.
7. PASS bộ N3 cũ vẫn có 15 bài + Tổng ôn; Flashcard cũ và /kanji render được;
   không có lỗi JavaScript chưa xử lý trong kịch bản.

Kiểm tra phần cá nhân hiển thị lỗi phiên do backend local không chạy; không coi lần kiểm tra
thư viện tĩnh này là nghiệm thu tài khoản/DB production.

Kịch bản, ảnh và công cụ đọc PDF nằm trong `.tmp/`, không thêm dependency ứng dụng.
Để cập nhật online: push source rồi deploy lại Vercel; không cần biến môi trường/migration mới.
