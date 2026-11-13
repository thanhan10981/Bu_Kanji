# Học Flashcard

Trong **Từ vựng**, mở bộ từ có sẵn hoặc bộ cá nhân rồi chọn **Flashcard**. Không cần cấu hình thêm hoặc migration cơ sở dữ liệu.

- Chọn học tất cả, thẻ chưa học hoặc thẻ cần ôn. Có thể dùng chữ Nhật hoặc nghĩa tiếng Việt làm mặt trước. Thẻ được xáo trộn mỗi lượt.
- Lật thẻ bằng chuột, Enter hoặc Space; sau đó chọn **Đã nhớ / Cần ôn**. Chỉ lật thẻ không ghi nhận kết quả.
- Lượt đang học tự lưu sau mỗi đánh giá; quay lại cùng bộ để tiếp tục. Hoàn thành có thể ôn riêng thẻ cần ôn hoặc học lại.
- **Báo cáo Flashcard** trong trang bộ từ hiển thị số thẻ đã học, đã nhớ, cần ôn, chưa học, tổng lượt đánh giá và 10 lượt hoàn thành gần nhất. Đây là tự đánh giá, độc lập với báo cáo Tự luận.

Tiến độ lưu tại `localStorage` với khóa `bu-nihon-flashcard-v1`, tách khách và từng tài khoản. Chưa có đồng bộ máy chủ hoặc giữa thiết bị. Xóa dữ liệu trình duyệt sẽ mất báo cáo. Nếu không lưu được, giao diện báo lỗi; kết quả vẫn có trong bộ nhớ của phiên đang mở.

Thẻ trùng ID giữa bài học và bộ tổng ôn dùng chung tiến độ. Thay đổi chữ Nhật, cách đọc, nghĩa hoặc cách đọc được chấp nhận sẽ vô hiệu tiến độ cũ của thẻ đó. Thay đổi bộ thẻ yêu cầu bắt đầu lượt mới; lịch sử hoàn thành vẫn giữ số liệu tại thời điểm học.

Kiểm tra: `npm run test:vocabulary`, `npm run typecheck`, `npm run lint`, `npm run build` trong thư mục `bu-nihon`. Kiểm tra trình duyệt gồm lật bằng bàn phím, khóa đánh giá trước khi lật, tải lại tiếp tục học, hoàn thành lượt, ôn thẻ cần ôn, báo cáo và bố cục mobile/dark.
