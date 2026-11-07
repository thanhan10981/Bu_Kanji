# Nhập từ vựng và chat bằng Chatmock

Trang: `/vocabulary/import`, mở từ nút **Nhập từ vựng bằng AI** ở Từ vựng.

## Chạy trên Vercel + Render

Không cần chạy máy local. Browser gọi API cùng domain Vercel; server Vercel kiểm tra tài khoản/hạn mức qua Render, rồi gọi Chatmock trực tiếp. Khóa Chatmock chỉ đặt trên Vercel.

1. Deploy backend Render bản mới trước. Start command hiện có `npm run start:render` tự chạy migration `003_ai_usage.sql` để tạo bảng hạn mức. Nếu đang dùng start command khác, chạy `npm run migrate` trước khi khởi động backend mới.
2. Đặt các biến sau trong Environment Variables của dự án Vercel, cho môi trường Production (và Preview nếu cần):

   ```dotenv
   NEXT_PUBLIC_API_URL=/api
   API_PROXY_TARGET=https://TEN-BACKEND.onrender.com
   CHATMOCK_BASE_URL=https://chatmock.vothanhan.dev/v1
   CHATMOCK_GATEWAY_SECRET=<khóa thật, nhập trực tiếp trên Vercel>
   ```

3. Giữ cấu hình database/JWT/cookie hiện có của Render. Không cần thêm khóa Chatmock vào Render và không đổi `NODE_ENV=production`. Render mặc định cho mỗi tài khoản 12 yêu cầu/phút, 100 yêu cầu/ngày; toàn hệ thống 1.000 yêu cầu/ngày. Có thể điều chỉnh bằng `AI_REQUESTS_PER_MINUTE`, `AI_REQUESTS_PER_DAY`, `AI_GLOBAL_REQUESTS_PER_DAY` trên Render. Hạn mức ngày đặt lại theo UTC (07:00 Việt Nam). Preview cần domain được phép trong cấu hình auth/CORS của backend hiện có nếu đăng nhập bằng domain đó.
4. Redeploy Vercel sau khi thêm biến môi trường/code mới. Đăng nhập tài khoản trên website, chọn **Kiểm tra kết nối**, rồi gửi chat hoặc nhập file.

Nếu 401: đăng nhập lại. Nếu 429: chờ hạn mức được đặt lại. Nếu báo chưa xác minh quyền dùng AI: kiểm tra Render đã deploy code mới, chạy migration và `API_PROXY_TARGET` đúng URL. Các route AI đã bỏ điều kiện chặn production/localhost. Không có bước tự deploy từ tác vụ sửa code này.

Route AI cấu hình `maxDuration = 150`; gateway chờ tối đa 90 giây, xác thực Render tối đa 20 giây. Bật Fluid Compute/cấu hình thời gian chạy tương ứng nếu project Vercel cũ đang giới hạn thấp hơn. Giới hạn file là 4 MB để chừa phần multipart dưới [giới hạn request 4,5 MB của Vercel](https://vercel.com/docs/functions/limitations#request-body-size).

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

Để lưu bộ thẻ vào tài khoản, PostgreSQL và backend NestJS hiện có phải chạy; xem `../backend/README.md`. Chạy `npm install`, `npm run build`, `npm run start` trong `backend` sau khi thiết lập database theo tài liệu đó. Frontend dùng cấu hình `NEXT_PUBLIC_API_URL` / `API_PROXY_TARGET` hiện có. Local development trên localhost có thể trích xuất và tải JSON khi chưa đăng nhập; trên website cần đăng nhập. Không lưu giả bộ thẻ khi backend lỗi.

## Hành vi và giới hạn

- Hỗ trợ TXT/CSV/TSV/Markdown/JSON UTF-8, DOCX và PDF có chữ. File tối đa 4 MB, 40.000 ký tự; PDF tối đa 30 trang. PDF scan cần OCR trước.
- Mỗi lần AI trả tối đa 200 thẻ; chia tài liệu lớn thành các file nhỏ. Bản xem trước cho phép sửa hoặc bỏ từng thẻ, tải JSON, tạo thư mục/bộ ngay tại trang và lưu vào bộ cá nhân.
- File được xử lý trong bộ nhớ server rồi gửi phần chữ tới gateway; không ghi file tải lên ra ổ đĩa. Bản xem trước không giữ sau khi rời trang. Kiểm tra thẻ trước khi lưu vì AI có thể đọc sai.
- Backend lưu cả đợt trong một giao dịch với kiểm tra quyền sở hữu; thẻ trùng hoàn toàn chữ Nhật/cách đọc/nghĩa được bỏ qua, kể cả khi thử lưu lại.
- Chat lưu tối đa 60 tin trên trình duyệt; nút cuộc trò chuyện mới xóa lịch sử. Mỗi request chỉ gửi tối đa 20 tin gần nhất và 40.000 ký tự. Tin người dùng tối đa 12.000 ký tự; câu trả lời tối đa 24.000 ký tự.
- Markdown không chạy HTML; URL dùng bộ lọc mặc định của react-markdown; không tải ảnh từ câu trả lời. Có nút sao chép tin nhắn và code. Enter gửi, Shift+Enter xuống dòng.
- Gateway chỉ nhận `/responses`, `stream: false`; UI chờ phản hồi hoàn chỉnh. Khóa chỉ nằm ở server qua `x-chatmock-key`. Không có URL/header/instructions tùy ý từ client, không ghi khóa vào log hoặc browser.
- Timeout gateway 90 giây; UI chờ tối đa 140 giây cho mỗi lần gọi, tự làm mới cookie và thử lại một lần khi gặp 401. Lỗi phân biệt thiếu/sai khóa, phiên ChatGPT hết hạn, bận/hạn mức, tunnel/mạng và timeout. Chi tiết thô từ gateway không được gửi về client.
- Endpoint AI chặn Origin khác nguồn. Production xác thực cookie HttpOnly qua backend Render và trừ hạn mức trong một giao dịch PostgreSQL có khóa; các instance chia sẻ hạn mức, lỗi database không cho phép gọi gateway. Không gửi cookie đăng nhập tới Chatmock. Request đã được cấp quyền tính vào hạn mức kể cả gateway lỗi; kiểm tra kết nối cũng tính một lần. Local development giữ giới hạn trong bộ nhớ 12 yêu cầu/phút. Mỗi tiến trình tối đa 2 yêu cầu AI đồng thời.

## Kiểm tra

Frontend: `npm run typecheck`, `npm run test:chat`, `npm run lint`, `npm run build`.

Backend: `npm run test:ai`, `npm run test:vocabulary` (bao gồm validation, quyền sở hữu và nhập hàng loạt). Kiểm tra AI tự động dùng gateway/backend giả trong test, không gọi hoặc tiêu thụ phiên ChatGPT thật. Nút kiểm tra kết nối và thao tác gửi chat/nhập file dùng gateway thật.

Kiểm thử bao gồm production cho phép tài khoản hợp lệ, từ chối chưa đăng nhập/hết hạn/hết hạn mức, không gọi gateway khi backend lỗi, và kiểm tra cookie/khóa chỉ đến đúng server. Test quota kiểm tra giới hạn theo người dùng/toàn hệ thống và hoàn tác khi một hạn mức từ chối. Lint toàn dự án còn lỗi có sẵn ở Kanji/TTS. `npm audit --omit=dev` còn cảnh báo ở các dependency có sẵn (Next.js/Zod và dependency gián tiếp); chưa thực hiện nâng cấp ngoài phạm vi tính năng.

Môi trường hiện tại chưa có khóa Chatmock, PostgreSQL local chưa nhận kết nối (`ECONNREFUSED`), và không có trình duyệt kết nối cho kiểm thử UI tự động. Đã kiểm tra HTTP trang/endpoint, đọc TXT/PDF/DOCX, từ chối file sai định dạng, đầu vào sai và Origin khác. GET gateway `/models` không kèm khóa trả HTTP 403; chưa xác minh model hoặc câu trả lời AI thật.
