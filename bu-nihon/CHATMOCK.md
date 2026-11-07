# Nhập từ vựng và chat bằng Chatmock

Trang: `/vocabulary/import`, mở từ nút **Nhập từ vựng bằng AI** ở Từ vựng.

## Chạy local

1. Cài frontend: `npm install` trong `bu-nihon`.
2. Trong `bu-nihon/.env.local`, nhập trực tiếp cấu hình sau. File này đã được Git bỏ qua. Không gửi khóa qua chat.

   ```dotenv
   CHATMOCK_BASE_URL=https://chatmock.vothanhan.dev/v1
   CHATMOCK_GATEWAY_SECRET=<nhập khóa thật tại đây>
   ```

3. Chạy `node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3000` trong `bu-nihon`.
4. Mở <http://127.0.0.1:3000/vocabulary/import>. Nếu đổi khóa, khởi động lại server.
5. Chọn **Kiểm tra kết nối** để gọi `/models` từ server. Chọn Terra/Luna, gửi tin hoặc tải file để kiểm tra `/responses` thật.

Để lưu bộ thẻ vào tài khoản, PostgreSQL và backend NestJS hiện có phải chạy; xem `../backend/README.md`. Chạy `npm install`, `npm run build`, `npm run start` trong `backend` sau khi thiết lập database theo tài liệu đó. Frontend dùng cấu hình `NEXT_PUBLIC_API_URL` / `API_PROXY_TARGET` hiện có. Có thể trích xuất và tải JSON khi chưa đăng nhập; không lưu giả bộ thẻ khi backend lỗi.

## Hành vi và giới hạn

- Hỗ trợ TXT/CSV/TSV/Markdown/JSON UTF-8, DOCX và PDF có chữ. File tối đa 5 MB, 40.000 ký tự; PDF tối đa 30 trang. PDF scan cần OCR trước.
- Mỗi lần AI trả tối đa 200 thẻ; chia tài liệu lớn thành các file nhỏ. Bản xem trước cho phép sửa hoặc bỏ từng thẻ, tải JSON, tạo thư mục/bộ ngay tại trang và lưu vào bộ cá nhân.
- File được xử lý trong bộ nhớ server rồi gửi phần chữ tới gateway; không ghi file tải lên ra ổ đĩa. Bản xem trước không giữ sau khi rời trang. Kiểm tra thẻ trước khi lưu vì AI có thể đọc sai.
- Backend lưu cả đợt trong một giao dịch với kiểm tra quyền sở hữu; thẻ trùng hoàn toàn chữ Nhật/cách đọc/nghĩa được bỏ qua, kể cả khi thử lưu lại.
- Chat lưu tối đa 60 tin trên trình duyệt; nút cuộc trò chuyện mới xóa lịch sử. Mỗi request chỉ gửi tối đa 20 tin gần nhất và 40.000 ký tự. Tin người dùng tối đa 12.000 ký tự; câu trả lời tối đa 24.000 ký tự.
- Markdown không chạy HTML; URL dùng bộ lọc mặc định của react-markdown; không tải ảnh từ câu trả lời. Có nút sao chép tin nhắn và code. Enter gửi, Shift+Enter xuống dòng.
- Gateway chỉ nhận `/responses`, `stream: false`; UI chờ phản hồi hoàn chỉnh. Khóa chỉ nằm ở server qua `x-chatmock-key`. Không có URL/header/instructions tùy ý từ client, không ghi khóa vào log hoặc browser.
- Timeout gateway 90 giây; UI chờ tối đa 110 giây. Lỗi phân biệt thiếu/sai khóa, phiên ChatGPT hết hạn, bận/hạn mức, tunnel/mạng và timeout. Chi tiết thô từ gateway không được gửi về client.
- Endpoint AI chỉ mở trong chế độ development trên localhost và chặn Origin khác nguồn. Giới hạn local trong bộ nhớ mỗi tiến trình: 12 yêu cầu/phút và 2 yêu cầu đồng thời. Bản production trả 403; cần thêm xác thực và hạn mức bền vững trước khi mở công khai. Không tự triển khai.

## Kiểm tra

Frontend: `npm run typecheck`, `npm run test:chat`, `npm run lint`, `npm run build`.

Backend: `npm run test:vocabulary` (bao gồm validation, quyền sở hữu và nhập hàng loạt). Kiểm tra AI tự động dùng gateway giả trong test, không gọi hoặc tiêu thụ phiên ChatGPT thật. Nút kiểm tra kết nối và thao tác gửi chat/nhập file dùng gateway thật.

Lần kiểm tra triển khai tính năng này: build và TypeScript qua; 6 test chat và 8 test backend qua. Lint phần AI qua; lint toàn dự án có 15 lỗi có sẵn ở Kanji/TTS. `npm audit --omit=dev` còn cảnh báo ở các dependency có sẵn (Next.js/Zod và dependency gián tiếp); chưa thực hiện nâng cấp ngoài phạm vi tính năng.

Môi trường hiện tại chưa có khóa Chatmock, PostgreSQL local chưa nhận kết nối (`ECONNREFUSED`), và không có trình duyệt kết nối cho kiểm thử UI tự động. Đã kiểm tra HTTP trang/endpoint, đọc TXT/PDF/DOCX, từ chối file sai định dạng, đầu vào sai và Origin khác. GET gateway `/models` không kèm khóa trả HTTP 403; chưa xác minh model hoặc câu trả lời AI thật.
