# Feature Specification: Đăng nhập và đăng ký bằng email, mật khẩu

**Feature Branch**: `main` (nhánh hiện tại; không tạo nhánh riêng)

**Created**: 2026-11-08

**Status**: Draft

**Updated**: 2026-11-08 — theo yêu cầu lập kế hoạch mới: tự đăng nhập sau đăng ký,
băm mật khẩu an toàn, kiểm tra email trùng và giới hạn thử đăng nhập.

**Input**: User description: "Thêm đăng nhập và đăng ký bằng email và mật khẩu, không yêu cầu xác thực email."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Đăng ký rồi đăng nhập ngay (Priority: P1)

Là người học mới, tôi muốn tạo tài khoản rồi đăng nhập ngay bằng email và mật khẩu,
không phải mở hộp thư, nhập mã hoặc bấm liên kết xác thực.

**Why this priority**: Đây là luồng cốt lõi để bắt đầu sử dụng tài khoản.

**Independent Test**: Dùng email mới để đăng ký khi dịch vụ gửi thư chưa cấu hình;
xác nhận tự đăng nhập và tải lại trang vẫn nhận diện đúng tài khoản.

**Acceptance Scenarios**:

1. **Given** khách dùng email chưa đăng ký, **When** gửi email hợp lệ và mật khẩu 8–128 ký tự,
   **Then** tài khoản và phiên được tạo, mật khẩu được xóa khỏi biểu mẫu, cửa sổ đóng lại
   và người dùng được nhận diện ngay, không phải đăng nhập lần nữa.
2. **Given** vừa đăng ký thành công, **When** tải lại trang với phiên còn hiệu lực,
   **Then** vẫn được nhận diện đúng tài khoản và không có bước xác thực email.
3. **Given** dịch vụ gửi thư chưa cấu hình hoặc bị lỗi nhưng dịch vụ tài khoản hoạt động,
   **When** đăng ký và đăng nhập hợp lệ, **Then** cả hai thành công, không gửi thư xác thực.
4. **Given** email đã thuộc một tài khoản, **When** đăng ký lại,
   **Then** thông báo email đã đăng ký, không tạo bản sao hay thay đổi tài khoản cũ.

### User Story 2 - Đăng nhập lại và kết thúc phiên (Priority: P1)

Là người học có tài khoản mật khẩu, tôi muốn đăng nhập để tiếp tục học,
kể cả khi email chưa từng được xác thực, và đăng xuất khi dùng xong.

**Why this priority**: Tài khoản phải sử dụng được trong những lần quay lại.

**Independent Test**: Chuẩn bị tài khoản mật khẩu chưa xác thực email và thử đăng nhập,
tải lại trang rồi đăng xuất, không phụ thuộc luồng đăng ký mới.

**Acceptance Scenarios**:

1. **Given** tài khoản mật khẩu có email chưa xác thực, **When** đăng nhập đúng,
   **Then** cửa sổ đăng nhập đóng và giao diện nhận diện đúng người dùng.
2. **Given** đang là khách, **When** nhập email chưa tồn tại, sai mật khẩu hoặc email
   của tài khoản chỉ dùng Google, **Then** nhận cùng thông báo "Email hoặc mật khẩu không đúng"
   và không được truy cập dữ liệu riêng.
3. **Given** đã đăng nhập và phiên còn hiệu lực, **When** tải lại trang,
   **Then** vẫn được nhận diện là cùng người dùng.
4. **Given** đã đăng nhập, **When** đăng xuất rồi tải lại trang,
   **Then** trở về trạng thái khách và không được truy cập dữ liệu riêng cần đăng nhập.

### User Story 3 - Sửa lỗi và thử lại (Priority: P2)

Là người học, tôi muốn biết khi nào dữ liệu chưa hợp lệ hoặc dịch vụ gặp lỗi để sửa và thử lại.

**Why this priority**: Phản hồi rõ giúp hoàn thành hai luồng chính khi có sai sót.

**Independent Test**: Thử dữ liệu không hợp lệ và gián đoạn dịch vụ, sau đó sửa hoặc khôi phục
để xác nhận có thể thử lại.

**Acceptance Scenarios**:

1. **Given** biểu mẫu đăng ký, **When** để trống trường bắt buộc, nhập email sai định dạng,
   hoặc mật khẩu ngoài khoảng 8–128 ký tự, **Then** có lỗi bằng tiếng Việt và không tạo tài khoản.
2. **Given** đang gửi đăng ký hoặc đăng nhập, **When** bấm gửi liên tiếp,
   **Then** có trạng thái đang xử lý và biểu mẫu không gửi yêu cầu trùng trong khi chờ.
3. **Given** dịch vụ tài khoản không truy cập được, **When** mở hoặc gửi biểu mẫu,
   **Then** hiển thị lỗi, không báo thành công và cho phép thử lại sau khi dịch vụ phục hồi.
4. **Given** đã gặp lỗi nhập liệu, **When** sửa thông tin hợp lệ và gửi lại,
   **Then** xử lý theo thông tin mới, xóa lỗi cũ khi thành công.
5. **Given** đã dùng hết hạn mức thử đăng nhập trong khoảng thời gian quy định,
   **When** tiếp tục đăng nhập kể cả với mật khẩu đúng, **Then** bị từ chối tạm thời,
   được thông báo thời gian chờ; sau khi hết thời gian có thể thử lại.

### Edge Cases

- Email có chữ hoa hoặc khoảng trắng hai đầu được xem là cùng địa chỉ sau khi bỏ khoảng
  trắng hai đầu và không phân biệt hoa thường, cả đăng ký lẫn đăng nhập.
- Hai yêu cầu đăng ký đồng thời cùng email chỉ tạo một tài khoản; yêu cầu còn lại nhận lỗi
  trùng email và không ghi đè dữ liệu.
- Mật khẩu phân biệt hoa thường, giữ nguyên khoảng trắng; đăng ký chấp nhận độ dài 8 và 128,
  từ chối độ dài 7 và 129.
- Email trùng tài khoản Google không tự liên kết tài khoản hay đặt mật khẩu cho tài khoản đó.
- Mất mạng sau đăng ký có thể khiến kết quả chưa rõ; gửi lại không tạo bản sao. Nếu đã tạo,
  thông báo email đã đăng ký và cho phép quay lại đăng nhập.
- Email chưa xác thực không được tự đánh dấu đã xác thực chỉ vì đăng ký hoặc đăng nhập thành công.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI cung cấp đăng ký và đăng nhập bằng email, mật khẩu trong luồng
  tài khoản hiện có, với nhãn, hướng dẫn và phản hồi bằng tiếng Việt.
- **FR-002**: Đăng ký PHẢI chỉ yêu cầu email hợp lệ và mật khẩu 8–128 ký tự; dữ liệu thiếu
  hoặc sai PHẢI bị từ chối trước khi tạo tài khoản, kèm thông báo lỗi.
- **FR-003**: Hệ thống PHẢI bỏ khoảng trắng hai đầu và không phân biệt hoa thường với email
  khi đăng ký, kiểm tra trùng và đăng nhập; mật khẩu PHẢI giữ nguyên và phân biệt hoa thường.
- **FR-004**: Mỗi email PHẢI chỉ có một tài khoản, kể cả yêu cầu đồng thời; đăng ký trùng
  PHẢI báo email đã đăng ký và không thay đổi tài khoản hoặc mật khẩu hiện có.
- **FR-005**: Đăng ký và đăng nhập mật khẩu PHẢI hoạt động không phụ thuộc dịch vụ gửi thư;
  luồng đăng ký KHÔNG ĐƯỢC gửi thư hoặc yêu cầu mã, liên kết hay thao tác xác thực email.
- **FR-006**: Đăng ký thành công PHẢI tạo phiên tự động, nhận diện đúng người dùng,
  xóa mật khẩu biểu mẫu và đóng cửa sổ; không yêu cầu đăng nhập lại.
  Nếu không thể lưu đầy đủ tài khoản và phiên, không được báo đăng ký thành công.
- **FR-007**: Tài khoản có mật khẩu PHẢI đăng nhập được khi thông tin đúng dù email chưa
  xác thực; đăng ký và đăng nhập KHÔNG ĐƯỢC tự nâng trạng thái email thành đã xác thực.
- **FR-008**: Sai mật khẩu, email không tồn tại hoặc tài khoản chưa có mật khẩu PHẢI nhận cùng
  thông báo "Email hoặc mật khẩu không đúng" và không tạo phiên đăng nhập.
- **FR-009**: Đăng nhập thành công PHẢI đóng cửa sổ đăng nhập, nhận diện đúng người dùng và
  duy trì nhận diện khi tải lại trang trong thời hạn phiên hiện có. Đăng xuất PHẢI trở về trạng
  thái khách và chặn truy cập dữ liệu riêng cần đăng nhập, kể cả sau khi tải lại trang.
- **FR-010**: Biểu mẫu PHẢI báo đang xử lý, ngăn gửi trùng trong lúc chờ, báo lỗi dịch vụ
  và cho phép thử lại; không báo thành công khi thao tác thất bại.
- **FR-011**: Mật khẩu KHÔNG ĐƯỢC lưu dưới dạng đọc được hoặc xuất hiện trong log, thông báo
  hay thông tin tài khoản trả về; trường mật khẩu PHẢI mặc định được che.
- **FR-012**: Thay đổi PHẢI giữ nguyên dữ liệu tài khoản, tiến trình học và hành vi ngoài phạm vi;
  giữ điều kiện khả dụng hiện có của Google và quên mật khẩu. Không tự liên kết tài khoản
  dựa trên email chưa chứng minh quyền sở hữu.
- **FR-013**: Biểu mẫu PHẢI dùng được bằng bàn phím và trên màn hình điện thoại; trường nhập,
  nút và thông báo PHẢI có nhãn hoặc nội dung mà công cụ hỗ trợ đọc được.
- **FR-014**: Hệ thống PHẢI giới hạn số lần thử đăng nhập theo email và nguồn truy cập,
  kể cả email không tồn tại; khi hết hạn mức PHẢI từ chối tạm thời và cho biết thời gian chờ.
  Hạn mức PHẢI nhất quán giữa các tiến trình và không bị bỏ qua bằng yêu cầu đồng thời.
- **FR-015**: Mật khẩu PHẢI được băm bằng thuật toán chuyên dụng có salt ngẫu nhiên;
  cùng mật khẩu cho hai tài khoản không tạo ra cùng giá trị lưu, và mật khẩu cũ vẫn kiểm tra được.

### Key Entities *(include if feature involves data)*

- **Tài khoản người học**: Mã định danh, email duy nhất, tên hiển thị, trạng thái xác thực
  email thực tế; liên hệ với tiến trình học hiện có.
- **Thông tin đăng nhập mật khẩu**: Thông tin để kiểm tra mật khẩu gắn với một tài khoản,
  không lưu mật khẩu dạng đọc được; có thể chưa tồn tại ở tài khoản chỉ dùng Google.
- **Phiên đăng nhập**: Trạng thái nhận diện một tài khoản, có thời hạn và kết thúc khi đăng xuất.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 10/10 lần đăng ký với email mới hợp lệ được tự đăng nhập thành công khi không cấu
  hình dịch vụ gửi thư, không có thư hay bước xác thực email.
- **SC-002**: Với thông tin đã chuẩn bị và dịch vụ hoạt động, người kiểm tra hoàn thành đăng ký
  và vào trạng thái đăng nhập trong tối đa 2 phút trên cả máy tính và điện thoại.
- **SC-003**: 100% tình huống chấp nhận và trường hợp biên cho kết quả mong đợi; không có
  đăng nhập sai nào truy cập được dữ liệu riêng hoặc đăng ký trùng nào tạo bản sao, đổi mật khẩu cũ.
- **SC-004**: 10/10 lần tải lại trang với phiên hợp lệ giữ đúng tài khoản; 10/10 lần đăng xuất
  rồi tải lại trở về trạng thái khách.
- **SC-005**: Kiểm tra hồi quy xác nhận tài khoản và tiến trình học cũ còn nguyên, Google và
  quên mật khẩu giữ hành vi cũ khi có và không có cấu hình tương ứng.
- **SC-006**: Người kiểm tra hoàn thành đăng ký, đăng nhập và sửa lỗi chỉ bằng bàn phím;
  trên điện thoại không có trường hoặc nút bắt buộc bị che hay vượt màn hình.
- **SC-007**: Tất cả phép thử vượt hạn mức, đồng thời và qua hai tiến trình đều bị chặn đúng
  ngưỡng; thử lại sau thời gian chờ hoạt động và không khóa tài khoản vĩnh viễn.
- **SC-008**: Hai tài khoản thử cùng mật khẩu có giá trị băm khác nhau, kiểm tra đúng/sai
  mật khẩu cho kết quả đúng và không có mật khẩu gốc trong dữ liệu lưu hoặc phản hồi.

## Assumptions

- Tái sử dụng hệ thống tài khoản hiện có. Một phần hành vi đã có trong mã nguồn nhưng cần
  xác minh khi triển khai, chưa mặc định hoạt động đầy đủ trên môi trường thực tế.
- Tự đăng nhập sau đăng ký theo yêu cầu mới; giữ chính sách mật khẩu 8–128 ký tự và thời hạn phiên
  hiện có; không thêm bước nhập lại mật khẩu hoặc yêu cầu ký tự đặc biệt.
- Email là định danh đăng nhập, không phải bằng chứng sở hữu hộp thư.
- Phạm vi không gồm xây dựng mới quên mật khẩu, đổi email, đổi mật khẩu, xóa tài khoản,
  quản trị tài khoản, thêm nhà cung cấp đăng nhập hoặc xóa toàn bộ chức năng xác thực email cũ.
- Phụ thuộc dịch vụ tài khoản và lưu trữ hiện có hoạt động. Đăng ký và đăng nhập mật khẩu
  không phụ thuộc dịch vụ gửi thư; tính năng khác giữ phụ thuộc riêng của chúng.
- Khi triển khai, mỗi nhóm thay đổi phải được rà soát và kiểm tra ngay theo hiến chương,
  đối chiếu với yêu cầu và tình huống trong đặc tả này.
