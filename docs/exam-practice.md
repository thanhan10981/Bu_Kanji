# Luyện đề JLPT N3

## Trạng thái hiện tại

Đã mở **303/303 câu**, gồm 101 câu mỗi đề: 07/2025, 12/2025 và 07/2026.
Mỗi đề có 35 câu từ vựng, 22 câu ngữ pháp, 16 câu đọc và 28 câu nghe.
Không phụ thuộc bản OCR bị thiếu đoạn đọc, mất hình hoặc vỡ furigana để hiển thị đề.

| Đề | Câu mở chấm | Trang đề gốc | Trang script nghe |
|---|---:|---:|---:|
| 07/2025 | 101/101 | 26 | 11 |
| 12/2025 | 101/101 | 29 | 12 |
| 07/2026 | 101/101 | 30 | 10 |
| Tổng | 303/303 | 85 | 33 |

## Trải nghiệm

Trang `/exams` dùng layout, màu thương hiệu, chế độ sáng/tối và điều hướng hiện tại.

- Chọn nhóm từ vựng/ngữ pháp/đọc/nghe; làm tự do hoặc đặt 15/30/60/90 phút.
- Đọc trang PDF gốc ngay trong câu hỏi; chuyển trang của nhóm để xem đủ đoạn văn,
  lựa chọn hoặc bảng biểu. Trang mở đầu được ghép theo câu/đoạn văn.
- Phóng to 100–400%, cuộn ngang/dọc; dialog hỗ trợ bàn phím, Esc và khôi phục focus.
- Mở PDF gốc ở tab mới để dùng trình đọc PDF hoặc chọn văn bản.
- Chọn số đáp án tương ứng trên đề/audio. Nghe 問題4 và 問題5 có 3 lựa chọn;
  các nhóm khác có 4. Không tạo lựa chọn thứ tư cho bài chỉ có ba đáp án.
- MP3 toàn bài có phát/tạm dừng, tua, lùi/tới 10 giây, tốc độ và tải xuống.
  Không tự phát hoặc tải toàn file khi chỉ mở trang.
- Đánh dấu câu, chuyển câu qua phiếu trả lời, tự lưu và khôi phục khi tải lại.
- Nộp có xác nhận số câu bỏ trống; chấm tại server, xem đúng/sai/bỏ trống và từng phần.
- Sau nộp có script nghe nguyên bản, bao gồm lời thoại và phần giải đáp được cung cấp.
  Script không xuất hiện trong GET đề hay props câu hỏi trước khi nộp.
- Tối đa 10 lượt hoàn thành mỗi đề/người dùng trên thiết bị. Guest và từng tài khoản
  không dùng chung bài lưu. Lịch sử chưa đồng bộ giữa thiết bị.
- Đồng hồ dùng thời hạn tuyệt đối; hết giờ tự nộp một lần. Khi lỗi giữ đáp án và cho thử lại.

Ảnh giữ nguyên hình, gạch chân, dấu sao, furigana và bố cục tài liệu. Trên màn hình nhỏ
có thể cần nút **Phóng to** để đọc chữ nhỏ. Đây là cách hiển thị nguyên bản,
chưa phải bản chép lại đầy đủ từng câu bằng văn bản HTML.
MP3 chưa có mốc thời gian riêng từng câu; người học tua thủ công đến nhóm muốn luyện.
Chấm theo đáp án được cung cấp, mỗi câu trọng số bằng nhau; không quy đổi điểm JLPT chính thức.

## Nguồn và đối chiếu

Nguồn ban đầu: `jlpt-n3-json-drafts.zip`. Ba JSON gốc và trường `issues` được giữ nguyên
để truy vết. Chỉ dẫn bên trong tài liệu được coi là nội dung dữ liệu, không phải lệnh.

Bảng đáp án: `ĐÁP ÁN JLPT N3 (update 27.10.2026).pdf`, trang 30–32.
Đã kiểm tra trực quan và đối chiếu tự động đủ 303 ô đỏ theo tọa độ/nhóm/số câu.
212 đáp án có sẵn khớp PDF; bổ sung 91 đáp án null. Không đoán đáp án từ OCR hoặc AI.

Đã nhận đủ ba PDF đề, ba PDF script và ba MP3. Manifest
`bu-nihon/src/data/exams/source-pages.json` ghi tên tài liệu, SHA-256 nguồn, trang,
kích thước ảnh, SHA-256 ảnh, nhóm câu và trang mở đầu của từng câu.
Đã kiểm tra contact sheet của toàn bộ 118 trang; trang gốc được render ở 2.5×.
Script 07/2026 là ảnh scan, giữ nguyên ảnh thay vì suy đoán text.

Lỗi OCR được giải quyết ở lớp dữ liệu chạy bằng trang gốc đã ghép,
giữ mã/số câu, số lựa chọn và đáp án đã đối chiếu. PDF nguồn không bị sửa.
Độ chính xác nội dung gốc phụ thuộc tài liệu được cung cấp; ứng dụng không tự hiệu đính đề.

## Cấu trúc

- `src/data/exams/exam-*.json`: bản nhập gốc, server-only qua catalog.
- `verified-answers.json`: đáp án theo nhóm/số câu, nguồn PDF/trang/SHA-256.
- `source-pages.json`: manifest tài liệu/ảnh/nhóm câu; server-only qua catalog.
- `src/lib/exams/verified-answers.ts`: kiểm đủ 17 nhóm/số câu, ghép đáp án theo số gốc.
- `src/lib/exams/source-pages.ts`: kiểm ánh xạ trang/câu/lựa chọn; tạo bản dùng để luyện.
- `src/lib/exams/catalog.ts`: catalog cố định, revision bao gồm đáp án và hash tài liệu/ảnh.
- `src/lib/exams/model.ts`: public DTO và chấm điểm; không đưa key/script vào GET.
- `src/lib/exams/schema.ts`: Zod cho dữ liệu nguồn, DTO, bài nộp và kết quả.
- `src/lib/exams/store.ts`: Zustand persist, kiểm bài lưu và tách guest/user.
- `src/components/exams/`: thư viện, thiết lập, làm bài, kết quả, audio và trình xem trang.
- `public/exams/<examId>/questions.pdf`: bản sao PDF đề gốc có kiểm hash.
- `public/exams/<examId>/questions/page-XX.png`: trang câu hỏi/đoạn văn/hình.
- `public/exams/<examId>/script/page-XX.png`: script dùng ở phần xem lại sau nộp.
- `public/exams/<examId>/listening.mp3`: bản sao MP3 gốc khớp hash.

`GET /api/exams/[examId]` chỉ trả câu hỏi và trang đề. `POST .../submit` kiểm revision,
phần/câu/lựa chọn rồi trả kết quả và trang script cho câu nghe đã chọn.
ID chỉ tra cứu catalog cố định, không dùng làm đường dẫn filesystem.
Bài nộp giới hạn 20 KB bằng Content-Length và stream thực đọc.
Không dùng dangerouslySetInnerHTML; không import đáp án/manifest script vào client.
API stateless; bài lưu ở localStorage. Tài liệu là static asset trên hosting;
đây không phải cơ chế bảo mật dành cho thi có giám sát.

Khi đề/đáp án/tài liệu đổi, revision thay đổi. Bài lưu ở phiên bản 69 câu cần bắt đầu
lượt mới; lịch sử cũ vẫn giữ nhưng không tự ghép/chấm lại bằng nội dung mới.

## Chạy và deploy

Trong `bu-nihon/`:

```powershell
npm ci
npm run test:exams
npm run typecheck
npm run lint
npm run build
npm run start
```

Vercel: root directory `bu-nihon`, build `npm run build`. Cần Next.js với Node runtime
cho API chấm; không dùng static export. `/api/exams/*` phải đến Next trước fallback proxy.
Không cần thêm biến môi trường, database/migration, API AI hay dependency runtime.
Không thay backend NestJS hoặc luồng đăng nhập.

Deploy cùng toàn bộ `public/exams/`: MP3 khoảng 115 MB, 118 ảnh khoảng 36 MB,
và ba PDF đề. Hosting cần byte-range để tua MP3/mở PDF; production local đã trả 206.
Không tham chiếu đường dẫn Downloads trong ứng dụng chạy trên web.
Chưa thực hiện deploy, push hoặc commit.

Nhập lại ảnh bằng Python/PyMuPDF (chỉ dùng lúc chuẩn bị dữ liệu, không chạy trên hosting):

```powershell
python scripts/import-exam-pdfs.py --sources-root '<thư mục chứa sáu PDF>'
```

Script chỉ đọc PDF nguồn, kiểm tên/số trang, tạo ảnh và manifest. Ánh xạ nhóm/trang mở đầu
đã đối chiếu nằm trong script. Khi đổi tài liệu phải rà lại ánh xạ;
không mặc định tài liệu khác là cùng đề. File nguồn không bị sửa.

## Kiểm tra local — 2026-11-08

- `test:exams`: 7 test đạt. Cả ba đề 101 câu; tất cả đáp án đúng đạt 101/101 mỗi đề.
  Kiểm bài trống, giả mạo, số lựa chọn 3/4, số câu trùng/bảng thiếu và không lộ script/key ở GET.
- Kiểm đủ 118 ảnh PNG: tồn tại, kích thước và hash đúng; ba PDF sao chép đúng hash nguồn.
- TypeScript, ESLint các tệp luyện đề và build production đạt.
- Lint toàn dự án: 15 lỗi/19 warning cũ tại Kanji/TTS; không sửa các file lỗi đó trong tính năng này.
- API production: mỗi đề 101/101, ảnh/script phục vụ được, PDF byte-range 206;
  revision cũ 409, câu/phần lạ 400, body lớn 413, ID không có 404.
- Chrome 1440 và 390: chọn phần, đáp án, đánh dấu, chuyển câu, reload,
  hủy/xác nhận nộp, điểm đúng/sai/bỏ trống, lọc kết quả và lịch sử đạt.
- PDF: chuyển trang đọc/bảng, phóng to/thu nhỏ/Esc, link PDF đúng trang;
  nghe 3 lựa chọn, MP3 phát được, nộp và mở script, reload kết quả đạt.
- Ảnh lỗi có thông báo và tải lại được. Không tràn ngang ở 320/390/820/1440 px;
  đã kiểm sáng/tối. Cuộn bên trong ảnh phóng to là chủ đích.
- Trước đó đã kiểm ba MP3 phát/tua/tốc độ/tải xuống và lỗi/thử lại;
  đồng hồ, lỗi nộp, tách guest/user và khôi phục localStorage đã qua ở luồng nền.

Script/ảnh kiểm nằm trong `.tmp/exams-pdf-check.cjs`, `.tmp/exams-browser-check.cjs`,
`.tmp/exams-audio-check.cjs`, `.tmp/exams-edge-check.cjs`, `.tmp/verify-answer-cells.py`
và `.tmp/exams-*.png`. Chúng được ignore, không đưa vào deploy.
