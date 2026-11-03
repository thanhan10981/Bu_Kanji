<!--
Sync Impact Report
- Version change: chưa ban hành (mẫu trống) → 1.0.0
- Modified principles: thay năm vị trí nguyên tắc trong mẫu bằng:
  I. Sửa đúng phạm vi yêu cầu; II. Kiểm tra sau mỗi thay đổi;
  III. Bảo toàn hành vi ngoài phạm vi; IV. Giải pháp đơn giản, phù hợp dự án;
  V. Báo cáo dựa trên bằng chứng.
- Added sections: Ràng buộc thay đổi; Quy trình thực hiện và rà soát; Governance.
- Removed sections: không có nội dung quản trị đã ban hành bị loại bỏ.
- Follow-up TODOs: không có.
- Đây là ghi chú rà soát tạm thời; loại bỏ trước khi commit hiến chương.
-->
# Bu_Kanji Constitution

## Core Principles

### I. Sửa đúng phạm vi yêu cầu

Mọi thay đổi PHẢI phục vụ trực tiếp yêu cầu hiện tại hoặc là điều kiện kỹ thuật cần thiết
để hoàn thành yêu cầu đó. Trước khi sửa, PHẢI xác định hành vi mong muốn, phần bị ảnh hưởng
và tiêu chí hoàn thành. KHÔNG ĐƯỢC tự thêm tính năng, dọn mã, đổi định dạng hàng loạt hoặc
tái cấu trúc ngoài phạm vi. Nếu phát hiện vấn đề độc lập, PHẢI ghi nhận riêng thay vì đưa
vào bản sửa. Phạm vi nhỏ giúp đối chiếu kết quả với yêu cầu và giảm lỗi phát sinh.

### II. Kiểm tra sau mỗi thay đổi

Sau mỗi thay đổi có mục đích độc lập, PHẢI rà soát diff và chạy kiểm tra phù hợp trước khi
chuyển sang thay đổi tiếp theo. Các tệp cùng cần thiết để tạo một hành vi nhất quán có thể
được sửa thành một nhóm; nhóm đó PHẢI được kiểm tra ngay sau khi hoàn tất.
Với lỗi có thể tái hiện, PHẢI ghi nhận cách tái hiện trước khi sửa và kiểm tra lại sau khi sửa.
Kiểm tra PHẢI bao phủ hành vi được yêu cầu và đường đi liên quan có nguy cơ bị ảnh hưởng.
Nếu kiểm tra thất bại, PHẢI xác định nguyên nhân và xử lý lỗi do thay đổi trước khi tiếp tục.
Nếu môi trường ngăn kiểm tra, PHẢI ghi rõ lệnh hoặc thao tác chưa chạy được, lý do và giới hạn
xác minh; KHÔNG ĐƯỢC báo rằng kết quả đã được kiểm chứng đầy đủ.

### III. Bảo toàn hành vi ngoài phạm vi

PHẢI giữ nguyên giao diện, hợp đồng API, dữ liệu và hành vi hiện có ngoài phần yêu cầu.
Khi sửa luồng giao tiếp giữa frontend và backend, PHẢI kiểm tra tính tương thích của các bên
bị tác động. KHÔNG ĐƯỢC ghi đè hoặc hoàn tác thay đổi sẵn có của người khác để làm sạch diff.
Nếu yêu cầu buộc phải thay đổi hợp đồng hoặc dữ liệu, PHẢI nêu tác động và cách chuyển đổi
trong kế hoạch, đồng thời xác minh các bên sử dụng bị ảnh hưởng.

### IV. Giải pháp đơn giản, phù hợp dự án

PHẢI ưu tiên cách sửa nhỏ nhất đáp ứng đầy đủ tiêu chí hoàn thành và tuân theo cấu trúc,
quy ước của phần mã đang sửa. Trước khi thêm thư viện, lớp trừu tượng hoặc cơ chế mới,
PHẢI kiểm tra khả năng dùng lại phần có sẵn và ghi rõ lý do cần bổ sung.
KHÔNG ĐƯỢC thêm độ phức tạp cho nhu cầu giả định chưa có trong yêu cầu.

### V. Báo cáo dựa trên bằng chứng

Khi bàn giao, PHẢI nêu phần đã sửa, mục đích, kiểm tra đã chạy, kết quả và giới hạn còn lại.
PHẢI phân biệt kiểm tra đạt, kiểm tra thất bại và kiểm tra chưa thực hiện.
Chỉ được đánh dấu công việc hoàn tất khi đáp ứng tiêu chí đã xác định; mọi phần chưa xác minh
PHẢI được công khai để người dùng đánh giá đúng trạng thái.

## Ràng buộc thay đổi

- Phạm vi áp dụng gồm frontend trong `bu-nihon/`, backend trong `backend/` và tài liệu dự án.
- PHẢI đọc hướng dẫn áp dụng tại thư mục sẽ sửa và kiểm tra trạng thái làm việc trước khi sửa.
- KHÔNG ĐƯỢC đưa bí mật, thông tin đăng nhập hoặc dữ liệu cá nhân vào mã, log hay báo cáo.
- Thay đổi cơ chế xác thực, quyền truy cập hoặc dữ liệu PHẢI có kiểm tra tương ứng với tác động.
- Chỉ thêm hoặc cập nhật kiểm thử tự động khi chúng xác minh hành vi hay nguy cơ hồi quy thực tế.
  Với thay đổi tài liệu hoặc chỉnh sửa nhỏ có thể đảo ngược, rà soát nội dung và kiểm tra cấu trúc
  phù hợp đáp ứng yêu cầu xác minh; không bắt buộc tạo bộ kiểm thử mới.

## Quy trình thực hiện và rà soát

1. Đọc yêu cầu, hướng dẫn và mã liên quan; xác định phạm vi, tiêu chí hoàn thành và cách kiểm tra.
2. Thực hiện một thay đổi hoặc nhóm thay đổi nhất quán, chỉ ở những tệp cần thiết.
3. Rà soát diff và thực hiện kiểm tra theo nguyên tắc II ngay sau thay đổi đó.
4. Sửa lỗi do thay đổi, rồi kiểm tra lại; chỉ mở rộng kiểm tra khi tác động hoặc kết quả đòi hỏi.
5. Trước khi bàn giao, kiểm tra toàn bộ diff để phát hiện phần ngoài phạm vi và báo cáo kết quả
   theo nguyên tắc V. Mọi PR hoặc lần rà soát PHẢI đối chiếu với các nguyên tắc này.

## Governance

Hiến chương này là chuẩn quản trị chung cho công việc trong dự án. Đặc tả, kế hoạch và nhiệm vụ
PHẢI thể hiện phạm vi cùng cách xác minh phù hợp với hiến chương. Hướng dẫn thực hiện tại
từng thư mục PHẢI được áp dụng trong phạm vi tương ứng và không làm mất các nghĩa vụ trên.

Mọi sửa đổi hiến chương PHẢI ghi rõ lý do, nguyên tắc bị ảnh hưởng, tác động đến quy trình,
phiên bản và ngày sửa đổi. Trước khi chấp nhận sửa đổi, PHẢI rà soát tính nhất quán của tài liệu
và xác nhận nội dung phù hợp với yêu cầu của người dùng hoặc người duy trì dự án.
Ngoại lệ cho một công việc cụ thể PHẢI được ghi rõ cùng lý do, phạm vi và cách kiểm tra thay thế;
không được âm thầm bỏ qua nguyên tắc.

Phiên bản dùng dạng MAJOR.MINOR.PATCH: tăng MAJOR khi loại bỏ hoặc định nghĩa lại nguyên tắc
không tương thích; tăng MINOR khi thêm nguyên tắc hoặc mở rộng đáng kể nghĩa vụ;
tăng PATCH khi làm rõ câu chữ mà không thay đổi nghĩa vụ. Mỗi lần sửa PHẢI cập nhật ngày
Last Amended; giữ nguyên ngày Ratified của lần ban hành đầu tiên.

**Version**: 1.0.0 | **Ratified**: 2026-11-03 | **Last Amended**: 2026-11-03
