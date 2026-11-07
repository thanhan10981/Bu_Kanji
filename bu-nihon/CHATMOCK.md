# Nhập từ vựng và chat bằng Chatmock

Trang: `/vocabulary/import`, mở từ nút **Nhập từ vựng bằng AI** ở Từ vựng.

## Chạy trên Vercel + Render

Không cần chạy máy local. Browser gọi API cùng domain Vercel; server Vercel kiểm tra tài khoản/hạn mức qua Render, rồi gọi Chatmock trực tiếp. Khóa Chatmock chỉ đặt trên Vercel.

1. Deploy backend Render bản mới trước. Start command hiện có `npm run start:render` tự chạy migration `003_ai_usage.sql` (hạn mức) và `004_ai_imports.sql` (file, tiến độ, các đợt AI). Nếu đang dùng start command khác, chạy `npm run migrate` trước khi khởi động backend mới. Thư viện PDF/Word đã được thêm vào dependency của backend; không cần đặt khóa Chatmock trên Render.
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

Route AI cấu hình `maxDuration = 150`; gateway chờ tối đa 90 giây, xác thực Render tối đa 20 giây. Bật Fluid Compute/cấu hình thời gian chạy tương ứng nếu project Vercel cũ đang giới hạn thấp hơn. File tối đa **100 MB**, được tải thành các phần **2 MB** qua proxy `/api/ai/imports` tới Render; mỗi request nằm dưới [giới hạn request 4,5 MB của Vercel](https://vercel.com/docs/functions/limitations#request-body-size). Không gửi nguyên file 100 MB trong một request.

## Nhập file 100 MB và tiếp tục khi gián đoạn

1. Đăng nhập, chọn file rồi bấm **Trích xuất bằng AI**. Giao diện hiển thị phần trăm tải lên, số trang đang đọc và số đợt AI đã xong.
2. Render giữ các phần tải lên trong PostgreSQL. Sau khi tải đủ, backend ghép ra file tạm và đọc trong worker riêng; mỗi hệ thống chỉ đọc một tài liệu tại một thời điểm để hạn chế RAM. Xong bước đọc thì xóa các phần file gốc khỏi database và file tạm khỏi ổ đĩa.
3. Chữ được chia thành từng phần tối đa 10.000 ký tự. Browser lần lượt yêu cầu Vercel xử lý từng phần bằng model đã chọn khi tạo lần nhập; khóa vẫn chỉ dùng ở Vercel. Tối đa 200 thẻ/đợt, không còn giới hạn 200 thẻ cho toàn bộ tài liệu. Thẻ trùng hoàn toàn được gộp.
4. **Tạm dừng** dừng các yêu cầu tiếp theo; tác vụ đọc hoặc đợt AI đã gửi có thể hoàn thành trên server. Chọn **Tiếp tục / khôi phục kết quả** để lấy lại các phần đã xong. Nếu tải chưa đủ, chọn lại đúng file gốc (tên, dung lượng và thời gian sửa phải khớp); chỉ tải phần còn thiếu. Không cần chọn lại file khi server đã đọc xong.
5. Khi đóng trang, AI không tự chạy qua toàn bộ các đợt còn lại. Tiếp tục tại trang này trên cùng tài khoản/trình duyệt để xử lý phần còn lại. LocalStorage chỉ giữ mã lần nhập và metadata, không giữ file hoặc khóa. Các phần đã hoàn thành lưu trên server và không cần gọi AI lại.
6. Kết quả tạm giữ tối đa 24 giờ. Có nút **Xóa lần nhập tạm**; thẻ đã lưu vào bộ cá nhân không bị xóa. Hết hạn thì không thể tiếp tục lần nhập cũ. Cleanup chạy khi khởi động, mỗi 30 phút và trước khi tạo lần nhập mới. Lần nhập hết hạn bị từ chối ngay, dù cleanup vật lý chưa chạy.
7. Bản xem trước chia trang 50 thẻ. Khi lưu, gửi từng đợt 200 thẻ vào bộ cá nhân; mỗi đợt là một giao dịch. Nếu gián đoạn giữa các đợt, thử lưu lại sẽ bỏ qua các thẻ đã lưu, không tạo trùng. Có thể tải JSON, kể cả kết quả mới xong một phần.

Mỗi yêu cầu xử lý đợt qua Vercel tính một lượt AI, kể cả khi gateway lỗi; thử lại phần chưa xong có thể dùng thêm lượt. File lớn có thể cần nhiều lượt; khi chạm hạn mức, tiếp tục sau khi hạn mức đặt lại, trong thời gian lưu 24 giờ. Upload, đọc file và lấy kết quả đã lưu không trừ lượt gateway. Mặc định mỗi tài khoản giữ tối đa 2 lần nhập; tổng dung lượng file gốc đang chờ/đang đọc/lỗi toàn hệ thống tối đa 512 MB để hạn chế database bị đầy. Các giới hạn lưu tạm này không thay đổi giới hạn 100 MB cho một file.

PDF tối đa 1.000 trang; tổng chữ tối đa 2 triệu ký tự. Worker có giới hạn tài nguyên và timeout 4 phút; tài liệu quá phức tạp hoặc DOCX nén có nội dung quá lớn có thể cần chia nhỏ dù file dưới 100 MB. PDF scan cần OCR trước. Không cắt bớt nội dung khi vượt giới hạn chữ/trang: giao diện báo lỗi để bạn chia tài liệu.

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

Luồng nhập 100 MB luôn cần đăng nhập và PostgreSQL/backend NestJS, kể cả khi phát triển local. Chạy `npm install`, `npm run migrate`, `npm run build`, `npm run start` trong `backend` sau khi thiết lập database theo `../backend/README.md`. Frontend dùng cấu hình `NEXT_PUBLIC_API_URL=/api` / `API_PROXY_TARGET` hiện có. Chat local vẫn có thể thử mà chưa đăng nhập; file lớn dùng các endpoint được xác thực. Không lưu giả bộ thẻ khi backend lỗi.

## Hành vi và giới hạn

- Hỗ trợ TXT/CSV/TSV/Markdown/JSON UTF-8, DOCX và PDF có chữ; file tối đa 100 MB. Bản xem trước cho phép sửa hoặc bỏ từng thẻ, tải JSON, tạo thư mục/bộ ngay tại trang và lưu vào bộ cá nhân.
- File được lưu tạm có kiểm tra quyền sở hữu ở mọi endpoint; gửi phần chữ tới gateway. Kết quả AI gốc có thể khôi phục trong 24 giờ. Các sửa tay trên bản xem trước chưa lưu vào bộ chỉ giữ trong trang hiện tại; tiếp tục/khôi phục dựng lại bản AI gốc. Kiểm tra thẻ trước khi lưu vì AI có thể đọc sai.
- API multipart cũ `/api/vocabulary/import` giữ mức 4 MB cho tương thích; giao diện mới dùng các endpoint upload từng phần và `/api/vocabulary/import/jobs/:jobId/:index` cho file lớn.
- Chat lưu tối đa 60 tin trên trình duyệt; nút cuộc trò chuyện mới xóa lịch sử. Mỗi request chỉ gửi tối đa 20 tin gần nhất và 40.000 ký tự. Tin người dùng tối đa 12.000 ký tự; câu trả lời tối đa 24.000 ký tự.
- Markdown không chạy HTML; URL dùng bộ lọc mặc định của react-markdown; không tải ảnh từ câu trả lời. Có nút sao chép tin nhắn và code. Enter gửi, Shift+Enter xuống dòng.
- Gateway chỉ nhận `/responses`, `stream: false`; UI chờ phản hồi hoàn chỉnh. Khóa chỉ nằm ở server qua `x-chatmock-key`. Không có URL/header/instructions tùy ý từ client, không ghi khóa vào log hoặc browser.
- Timeout gateway 90 giây; UI chờ tối đa 140 giây cho mỗi lần gọi, tự làm mới cookie và thử lại một lần khi gặp 401. Lỗi phân biệt thiếu/sai khóa, phiên ChatGPT hết hạn, bận/hạn mức, tunnel/mạng và timeout. Chi tiết thô từ gateway không được gửi về client.
- Endpoint AI chặn Origin khác nguồn. Production xác thực cookie HttpOnly qua backend Render và trừ hạn mức trong một giao dịch PostgreSQL có khóa; các instance chia sẻ hạn mức, lỗi database không cho phép gọi gateway. Không gửi cookie đăng nhập tới Chatmock. Request đã được cấp quyền tính vào hạn mức kể cả gateway lỗi; kiểm tra kết nối cũng tính một lần. Local development giữ giới hạn trong bộ nhớ 12 yêu cầu/phút. Mỗi tiến trình tối đa 2 yêu cầu AI đồng thời.

## Kiểm tra

Frontend: `npm run typecheck`, `npm run test:chat`, `npm run lint`, `npm run build`.

Backend: `npm run test:import`, `npm run test:ai`, `npm run test:vocabulary`. Test import dùng PostgreSQL nhúng PGlite (dependency chỉ dùng khi phát triển), không kết nối database của bạn. Có kiểm thử PDF đúng 100 MB tải 50 phần, đọc bằng worker thật, xóa dữ liệu file gốc sau khi đọc, khôi phục kết quả, kiểm tra quyền sở hữu, phần thiếu/sai kích thước, gửi lại và hết hạn. Kiểm tra AI tự động dùng gateway giả, không gọi hoặc tiêu thụ phiên ChatGPT thật. Nút kiểm tra kết nối và thao tác gửi chat/nhập file dùng gateway thật.

Kiểm thử bao gồm production cho phép tài khoản hợp lệ, từ chối chưa đăng nhập/hết hạn/hết hạn mức, không gọi gateway khi backend lỗi, và kiểm tra cookie/khóa chỉ đến đúng server. Test quota kiểm tra giới hạn theo người dùng/toàn hệ thống và hoàn tác khi một hạn mức từ chối. Lint toàn dự án còn lỗi có sẵn ở Kanji/TTS. `npm audit --omit=dev` còn cảnh báo ở các dependency có sẵn (Next.js/Zod và dependency gián tiếp); chưa thực hiện nâng cấp ngoài phạm vi tính năng.

Môi trường hiện tại chưa có khóa Chatmock, PostgreSQL local chưa nhận kết nối (`ECONNREFUSED`), và không có trình duyệt kết nối cho kiểm thử UI tự động. Đã kiểm tra HTTP trang/endpoint, đọc TXT/PDF/DOCX, từ chối file sai định dạng, đầu vào sai và Origin khác. GET gateway `/models` không kèm khóa trả HTTP 403; chưa xác minh model hoặc câu trả lời AI thật.
