# Feature Specification: Từ vựng cá nhân và luyện tập

**Feature Branch**: `main` (không có hook tạo nhánh; thư mục feature độc lập với nhánh)

**Created**: 2026-11-03

**Status**: Draft — đã rà soát yêu cầu, sẵn sàng lập kế hoạch

**Input**: Bổ sung khu vực Từ vựng cho Bu Kanji: thư mục → bộ thẻ → thẻ,
Flashcard và Tự luận với chuyển romaji sang hiragana trực tiếp; giữ /kanji,
dữ liệu và nhận diện hiện có; chuẩn bị triển khai frontend Vercel, backend Render.
Lần thực hiện này chỉ tạo đặc tả và tiêu chí nghiệm thu, không sửa ứng dụng hoặc deploy.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tổ chức và lưu bộ thẻ cá nhân (Priority: P1)

Người học đăng nhập bằng tài khoản hiện có, mở Từ vựng, tự tổ chức thư mục và bộ thẻ,
thêm từ của mình và tiếp tục sử dụng sau khi tải lại trang.

**Why this priority**: Dữ liệu cá nhân bền vững là nền tảng của mọi chế độ học.

**Independent Test**: Với một tài khoản kiểm thử, tạo N3, ba bộ và một thẻ;
tải lại và mở trực tiếp đường dẫn bộ để xác nhận cấu trúc, nội dung và quyền truy cập.

**Acceptance Scenarios**:

1. **Given** người học đã đăng nhập, **When** chọn Từ vựng trên laptop hoặc điện thoại,
   **Then** mở khu vực thư mục cá nhân trong giao diện Bu Kanji, không có mục điều hướng trùng.
2. **Given** danh sách thư mục, **When** tạo N3 rồi tạo Bài 1, Bài 2, Bài 3 bên trong,
   **Then** mở N3 thấy đúng ba bộ; có thể tạo bộ thứ tư với tên tùy chọn.
3. **Given** Bài 1 đang mở, **When** thêm `ăn / たべる / 食べる` và lưu thành công,
   **Then** thấy thẻ, số lượng là 1 và ba nút “Thêm thẻ”, “Flashcard”, “Tự luận”.
4. **Given** dữ liệu đã lưu, **When** tải lại hoặc đăng xuất rồi đăng nhập cùng tài khoản,
   **Then** vẫn thấy N3, ba bộ và đúng nội dung thẻ; mở trực tiếp URL bộ cũng tải được dữ liệu.
5. **Given** thư mục, bộ và thẻ đã tồn tại, **When** đổi tên thư mục, sửa tên bộ,
   sửa nghĩa/cách đọc/chữ Nhật rồi tải lại, **Then** các thay đổi được giữ đúng.
6. **Given** thư mục có ba bộ và tổng bốn thẻ, **When** chọn xóa thư mục,
   **Then** xác nhận nêu tên, 3 bộ, 4 thẻ; hủy giữ nguyên dữ liệu;
   xác nhận xóa thành công loại bỏ toàn bộ con và không để thẻ mồ côi.
7. **Given** bộ có hai thẻ, **When** xóa bộ, **Then** xác nhận nêu 1 bộ, 2 thẻ;
   xóa thành công không ảnh hưởng bộ khác. Xóa riêng một thẻ cập nhật số lượng và được giữ sau reload.
8. **Given** nghĩa/cách đọc trống hoặc cách đọc không hợp lệ, **When** lưu thẻ,
   **Then** chỉ rõ trường lỗi và không tạo/sửa dữ liệu; chữ Nhật để trống vẫn lưu được.
9. **Given** lưu gặp lỗi, **When** người học thử lưu, **Then** hiển thị lỗi, giữ nội dung
   đang nhập để thử lại và không thông báo đã lưu. Bấm lưu liên tiếp không tạo bản ghi trùng.
10. **Given** người chưa đăng nhập hoặc đã hết phiên, **When** mở bộ riêng tư,
    **Then** yêu cầu đăng nhập bằng luồng hiện có; sau đăng nhập có thể trở về bộ đã yêu cầu.
11. **Given** hai tài khoản A/B, **When** B truy cập trực tiếp hoặc gửi yêu cầu đọc/tạo con/
    sửa/xóa với định danh thư mục, bộ, thẻ của A, **Then** phía máy chủ từ chối;
    không lộ nội dung, tên hay số lượng và không thay đổi dữ liệu của A.

---

### User Story 2 - Tự luận bằng bàn phím tiếng Anh (Priority: P1)

Người học chọn Tự luận từ một bộ, nhìn nghĩa Việt và gõ romaji để nhập hiragana trực tiếp,
kiểm tra đáp án, xem kết quả và ôn lại câu sai.

**Why this priority**: Đây là năng lực bắt buộc và là phần trọng tâm của nghiệm thu.

**Independent Test**: Dùng bộ kiểm thử có các cách đọc trong bảng dưới;
chỉ bật bàn phím tiếng Anh và hoàn thành một lượt có câu đúng, sai rồi làm lại câu sai.

**Acceptance Scenarios**:

1. **Given** bộ có thẻ `ăn / たべる / 食べる`, **When** mở Tự luận và gõ `taberu`,
   **Then** thấy `たべる` ngay trong ô trước khi Enter, chưa lộ đáp án;
   Enter chấm đúng và hiển thị đáp án `たべる`.
2. **Given** bàn phím tiếng Anh, **When** thực hiện từng ca trong bảng chuyển âm,
   **Then** ô nhập thay đổi theo kết quả dự kiến mà không phải nhấn Enter hay mất focus.
3. **Given** chưa chấm, **When** bấm “Kiểm tra” hoặc Enter, **Then** chỉ chấm một lần,
   hiện đúng/sai bằng chữ và đáp án; không tự chuyển câu và không sửa điểm khi bấm lại.
4. **Given** đã chấm, **When** bấm “Câu tiếp theo”, **Then** chuyển đúng một câu,
   xóa nội dung nhập/phản hồi cũ và cập nhật tiến độ; câu cuối chuyển sang kết quả.
5. **Given** lượt có ba câu, hai đúng, một sai, **When** hoàn tất,
   **Then** thấy tổng 3, đúng 2, sai 1, tỷ lệ 66,7% và danh sách câu sai cùng đáp án;
   “Làm lại câu sai” mở lượt mới chỉ có đúng thẻ sai đó, điểm lượt mới tính riêng.
6. **Given** đáp án lưu `がっこう`, **When** dán ` がっこう　` (dấu dakuten tách,
   khoảng trắng đầu/cuối), **Then** được chấm đúng; `が っこう` cũng đúng sau loại khoảng trắng.
   `がこう`, katakana hoặc Kanji thay cho hiragana không được coi là đúng.
7. **Given** đang ghép chữ bằng IME tiếng Nhật, **When** nhập và Enter để xác nhận chữ,
   **Then** không bị chuyển đổi lần hai và không chấm câu trong quá trình ghép;
   Enter riêng sau khi xác nhận chữ mới chấm.
8. **Given** ô nhập rỗng, **When** kiểm tra, **Then** nhắc nhập câu trả lời, không tính sai.
   Khi đã có câu trả lời nhưng còn romaji không hoàn chỉnh, chấm sai và hiện đáp án;
   ngoại lệ âm `n` cuối được xử lý như bảng chuyển âm.

#### Bảng nghiệm thu nhập và sửa hiragana

Mỗi ca bắt đầu từ ô rỗng nếu không nêu trạng thái khác. Dấu `|` chỉ vị trí con trỏ.

| Ca | Thao tác | Kết quả bắt buộc |
| --- | --- | --- |
| C-01 | Gõ từng phím `t`, `a`, `b`, `e`, `r`, `u` | Lần lượt `t`, `た`, `たb`, `たべ`, `たべr`, `たべる` |
| C-02 | Gõ `gakkou` | `がっこう`; sau `gakk` thấy `がっk`, giữ `k` để gõ tiếp |
| C-03 | Gõ `benkyou` | `べんきょう`; sau `benky` thấy `べんky`, chưa biến `ky` thành âm khác |
| C-04 | Gõ `kyo` | `k` → `ky` → `きょ` |
| C-05 | Gõ `na`, `nya`, `nna` ở ba lần riêng | `な`, `にゃ`, `んな` |
| C-06 | Gõ `kan`, sau đó `i` | Trước `i`: `かn`; sau `i`: `かに` |
| C-07 | Gõ `kann` | `かん` ngay sau `nn`; nếu gõ tiếp `a` thì thành `かんな` |
| C-08 | Gõ `kan`, sau đó Kiểm tra | Chốt `n` cuối thành `ん`, so khớp `かん`; việc chốt này không thay chuyển âm trực tiếp cho các âm khác |
| C-09 | Đang có `きょk`, Backspace rồi gõ `u` | `きょ` rồi `きょう`, không phục hồi `k` đã xóa |
| C-10 | Đang có `たべる`, Backspace rồi gõ `ru` | `たべ` rồi `たべる`, không nhân đôi phần trước |
| C-11 | Đặt con trỏ `た|る`, gõ `be` | `たb|る` rồi `たべ|る`, không nhảy con trỏ về cuối |
| C-12 | Chọn `べ` trong `たべる`, thay bằng `be` | Kết quả `たべる`, không mất hai phía vùng chọn |
| C-13 | Dán `たべる`, hoặc chèn `べ` vào `た|る` | `たべる` nguyên vẹn, không chuyển đổi thêm |
| C-14 | IME ghép và xác nhận `たべる` | Giữ đúng chuỗi, Enter xác nhận IME không kích hoạt chấm |

---

### User Story 3 - Ôn bằng Flashcard (Priority: P2)

Người học dùng cùng bộ thẻ để tự nhớ nghĩa và lật xem cách đọc, chữ Nhật.

**Why this priority**: Bổ sung cách ôn đơn giản, dùng chung nội dung đã tạo.

**Independent Test**: Dùng bộ ba thẻ có sẵn; không cần sử dụng chế độ Tự luận.

**Acceptance Scenarios**:

1. **Given** bộ ba thẻ, **When** mở Flashcard, **Then** mặt trước chỉ hiện nghĩa Việt,
   tiến độ `1/3`; bấm/chạm hoặc dùng bàn phím lật thẻ thấy cách đọc và chữ Nhật nếu có.
2. **Given** thẻ đã lật, **When** bấm Sau hoặc Trước, **Then** cập nhật đúng thẻ/tiến độ,
   thẻ mới quay về mặt trước; ở đầu/cuối không vượt giới hạn hoặc tự vòng lại.
3. **Given** bộ rỗng, **When** mở bộ, **Then** hiện hướng dẫn thêm thẻ;
   Flashcard/Tự luận được vô hiệu hóa có giải thích, không xuất hiện `1/0`.
4. **Given** đang học, **When** quay về bộ, **Then** trở về đúng bộ và thư mục chứa nó.

---

### User Story 4 - Sử dụng ổn định khi phát hành (Priority: P2)

Người học dùng điện thoại/laptop, mở liên kết bộ trực tiếp và tiếp tục sử dụng Hán tự.
Người vận hành nhận được hướng dẫn cấu hình và bằng chứng kiểm tra để phát hành.

**Why this priority**: Tránh một tính năng chỉ chạy trên máy phát triển hoặc làm hỏng /kanji.

**Independent Test**: Trên môi trường kiểm thử có cấu hình giống production, chạy các luồng
quản lý, luyện tập và hồi quy bằng hai tài khoản; việc kiểm tra này thuộc giai đoạn triển khai.

**Acceptance Scenarios**:

1. **Given** viewport 375×812 hoặc 1366×768, **When** đi qua các màn hình chính,
   **Then** không cuộn ngang toàn trang, điều hướng/nút/ô nhập không bị che;
   dùng được sáng/tối và bàn phím để mở, đóng hộp thoại, lật thẻ, kiểm tra, chuyển câu.
2. **Given** liên kết trực tiếp của bộ riêng tư, **When** mở tab mới hoặc refresh,
   **Then** sau xác thực đúng tài khoản thấy đúng bộ, không lỗi trang hoặc mất ngữ cảnh.
3. **Given** bản phát hành tính năng, **When** mở /kanji, tìm/lọc một Hán tự và mở trang chi tiết,
   **Then** hành vi và dữ liệu giống mốc trước thay đổi; /kanji vẫn dùng được khi API từ vựng lỗi.
4. **Given** hai dịch vụ khác origin, **When** đăng nhập, tạo thẻ, reload, làm mới phiên và
   đăng xuất trên domain triển khai, **Then** các bước hoạt động đúng; origin ngoài danh sách
   cho phép không thực hiện được thay đổi có xác thực.
5. **Given** bản bàn giao triển khai, **When** người vận hành làm theo tài liệu,
   **Then** tìm được thư mục gốc, lệnh cài/build/start, biến mẫu từng dịch vụ, thứ tự migrate
   và cách kiểm tra; không cần đoán giá trị bí mật hay dùng đồng bộ schema tự động production.
6. **Given** chưa truy cập được tài khoản hosting, **When** bàn giao,
   **Then** có cấu hình và hướng dẫn sẵn sàng triển khai, ghi rõ chưa deploy;
   chỉ ghi deploy thành công khi có URL thực tế và kết quả kiểm tra tại URL đó.

### Edge Cases

- Thư mục rỗng vẫn mở/đổi tên/xóa được; xác nhận xóa hiển thị 0 bộ, 0 thẻ.
- Tên chỉ có khoảng trắng bị từ chối; tên trùng được phép, phân biệt bằng định danh/ngữ cảnh.
- Hai thẻ trùng nghĩa được luyện riêng, dùng đúng cách đọc của thẻ đang hỏi.
- Cách đọc bắt buộc là hiragana, cho phép dấu kéo dài `ー`; không nhận romaji/Kanji/katakana
  làm đáp án lưu. Nghĩa không rỗng; chữ Nhật tùy chọn. Hiển thị văn bản như văn bản thuần.
- Một thẻ: Flashcard luôn `1/1`; Tự luận chấm xong có thể kết thúc lượt.
- Không có câu sai: hiện thông báo hoàn thành, không cho mở lượt ôn rỗng.
- Chỉ chấm sau thao tác rõ ràng; Enter lặp không tự chuyển câu hoặc tăng điểm nhiều lần.
- Mất mạng, tải lâu và lỗi tải có trạng thái riêng, nút thử lại; không coi lỗi tải là danh sách rỗng.
- Xóa/lưu thất bại không làm mất dữ liệu đang hiển thị; không để trạng thái thành công giả.
- Bộ bị xóa/không còn truy cập được ở tab khác: khi tải/lưu tiếp, báo không khả dụng,
  cho về danh sách; không tự tạo lại dữ liệu hoặc lộ dữ liệu tài khoản khác.
- Lượt học dùng nội dung tại lúc bắt đầu; thay đổi từ tab khác có hiệu lực ở lượt mới.
  Không yêu cầu lưu tiến độ lượt khi reload; phải giữ nguyên dữ liệu bộ/thẻ.
- Khi đổi tài khoản/đăng xuất, dữ liệu và kết quả của tài khoản trước không còn hiển thị.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Khu vực Từ vựng PHẢI mở từ điều hướng hiện có trên laptop và điện thoại,
  dùng nhận diện, màu, font, trạng thái sáng/tối của Bu Kanji. Nghiệm thu: US1.1, US4.1.
- **FR-002**: Người học PHẢI tạo, đổi tên, xóa thư mục riêng và tạo số bộ tùy ý;
  không áp đặt danh sách N3/Bài 1–3 cố định. Nghiệm thu: US1.2, US1.5–6.
- **FR-003**: PHẢI tạo, sửa, xóa bộ trong thư mục; bộ có danh sách, số thẻ,
  ba nút “Thêm thẻ”, “Flashcard”, “Tự luận”. Nghiệm thu: US1.3, US1.5, US1.7.
- **FR-004**: PHẢI thêm, sửa, xóa từng thẻ; nghĩa Việt/cách đọc bắt buộc, chữ Nhật tùy chọn;
  kiểm tra dữ liệu trước khi lưu và bảo vệ dữ liệu phía máy chủ. Nghiệm thu: US1.5, US1.7–8.
- **FR-005**: Xóa thư mục/bộ PHẢI xác nhận tên, số bộ/thẻ bị ảnh hưởng, có Hủy;
  chỉ xóa dữ liệu thuộc phạm vi xác nhận và không để dữ liệu con mồ côi. Nghiệm thu: US1.6–7.
- **FR-006**: Dữ liệu PHẢI lưu bền vững gắn tài khoản, tồn tại qua reload/đăng nhập lại,
  không dùng dữ liệu chỉ nằm trong trình duyệt làm nguồn lưu duy nhất. Nghiệm thu: US1.4.
- **FR-007**: PHẢI dùng đăng nhập hiện có và kiểm tra sở hữu trên máy chủ cho mọi thao tác
  đọc/ghi với thư mục, bộ, thẻ và quan hệ cha–con. Nghiệm thu: US1.10–11, US4.4.
- **FR-008**: Flashcard PHẢI có nghĩa Việt trước, cách đọc/chữ Nhật sau,
  lật thẻ, Trước/Sau, tiến độ đúng và đường quay về bộ. Nghiệm thu: US3.1–4.
- **FR-009**: Tự luận PHẢI chỉ dùng thẻ của bộ đang mở, hiện nghĩa trước khi chấm,
  yêu cầu hiragana và có tiến độ. Nghiệm thu: US2.1, US2.3–4.
- **FR-010**: PHẢI chuyển romaji thành hiragana ngay trong ô khi đủ âm, giữ phần chưa đủ âm;
  hỗ trợ âm ghép, phụ âm kép, `n/nn` đúng toàn bộ C-01–C-08, không cần đổi bàn phím.
- **FR-011**: PHẢI hỗ trợ Backspace, sửa giữa chuỗi, thay vùng chọn, dán hiragana,
  giữ con trỏ đúng và không can thiệp IME đang ghép. Nghiệm thu: C-09–C-14, US2.7.
- **FR-012**: Enter hoặc “Kiểm tra” PHẢI chấm một lần, chuẩn hóa Unicode tương đương
  và bỏ khoảng trắng Unicode dư thừa ở cả đáp án/câu trả lời, rồi so khớp chính xác;
  không tự chấp nhận từ đồng nghĩa hay chữ viết khác. Nghiệm thu: US2.3, US2.6–8.
- **FR-013**: PHẢI hiện đúng/sai, đáp án, “Câu tiếp theo”, kết quả tổng/đúng/sai/tỷ lệ
  và “Làm lại câu sai” chỉ dùng các thẻ sai của lượt vừa xong. Nghiệm thu: US2.3–5.
- **FR-014**: PHẢI có trạng thái tải, rỗng, lỗi và thử lại; giữ form khi lưu lỗi,
  không tạo trùng do bấm liên tiếp. Nghiệm thu: US1.9, US3.3 và Edge Cases.
- **FR-015**: PHẢI dùng tốt ở hai kích thước nghiệm thu, bằng chạm và bàn phím;
  nút không có nhãn nhìn thấy có tên truy cập, phản hồi không chỉ dựa vào màu. Nghiệm thu: US4.1.
- **FR-016**: /kanji, trang chi tiết và dữ liệu hiện tại PHẢI được bảo toàn;
  không gộp việc làm sạch dữ liệu hoặc đổi nhận diện vào feature. Nghiệm thu: US4.3.
- **FR-017**: Với cấu trúc hai phần đã có, đích triển khai ưu tiên PHẢI là frontend Vercel,
  backend Render, lưu trữ bền vững phù hợp repo; không tái cấu trúc chỉ vì hosting.
  Nghiệm thu: US4.5; bối cảnh hiện tại ghi tại source-review.md.
- **FR-018**: Bản bàn giao triển khai PHẢI có `.env.example` cho từng dịch vụ với URL API,
  kết nối dữ liệu, đăng nhập và biến liên quan dưới dạng mẫu; thư mục gốc, lệnh build/start,
  thứ tự migrate và bước xác minh PHẢI rõ ràng. Không tạo các tệp này ở bước đặc tả.
  Nghiệm thu: US4.5.
- **FR-019**: Đăng nhập PHẢI hoạt động đúng giữa các domain triển khai, gồm CORS,
  cookie, refresh, logout và Google callback nếu được bật; không coi CORS đơn thuần là đủ.
  Nghiệm thu: US4.4.
- **FR-020**: Trước khi phát hành PHẢI kiểm tra build production của cả hai dịch vụ,
  URL bộ trực tiếp, tạo rồi reload, tự luận bằng bàn phím Anh và hồi quy /kanji;
  lưu kết quả thực tế, URL và giới hạn truy cập. Nghiệm thu: US4.2–6, SC-001, SC-007.

### Key Entities *(include if feature involves data)*

- **Người học**: tài khoản hiện có; sở hữu thư mục và toàn bộ bộ/thẻ bên trong.
- **Thư mục**: định danh ổn định, tên, chủ sở hữu; chứa không hoặc nhiều bộ; không lồng thư mục.
- **Bộ thẻ**: định danh ổn định, tên, thư mục cha, quyền sở hữu kế thừa, số thẻ;
  có đường dẫn mở trực tiếp; thuộc đúng một thư mục.
- **Thẻ từ vựng**: định danh, bộ cha, nghĩa Việt, cách đọc hiragana, chữ Nhật tùy chọn;
  thời điểm tạo/cập nhật phục vụ thứ tự và xác định nội dung.
- **Lượt luyện**: chế độ, bộ nguồn, danh sách thẻ tại lúc bắt đầu, vị trí hiện tại,
  câu trả lời, kết quả từng thẻ và tập câu sai; chỉ yêu cầu tồn tại trong lượt đang mở.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người kiểm thử hoàn thành 100% luồng chính: N3 → ba bộ → thêm
  `ăn / たべる / 食べる` → reload còn thẻ → Tự luận → gõ `taberu` thấy `たべる`
  trước Enter → Enter chấm đúng, chỉ dùng bàn phím tiếng Anh.
- **SC-002**: 14/14 ca C-01–C-14 đạt; khi đủ âm, chữ hiển thị trong tối đa 100 ms
  ở ít nhất 95% lần gõ trên thiết bị nghiệm thu, không cần gửi câu trả lời để chuyển âm.
- **SC-003**: 100% thao tác tạo/sửa/xóa đã báo thành công giữ đúng kết quả sau reload
  và đăng nhập lại trong bộ nghiệm thu US1; số bộ/thẻ và xác nhận xóa đều khớp dữ liệu.
- **SC-004**: 100% ca truy cập chéo tài khoản US1.11 bị từ chối, không lộ dữ liệu
  hoặc làm thay đổi dữ liệu của chủ sở hữu.
- **SC-005**: Lượt ba câu hai đúng/một sai hiển thị đúng 3/2/1 và 66,7%;
  lượt làm lại chỉ có một thẻ sai, không đưa thẻ đúng vào lại.
- **SC-006**: Toàn bộ luồng tạo thẻ, Flashcard và Tự luận hoàn thành được ở cả
  375×812 và 1366×768, sáng/tối, không cuộn ngang toàn trang hoặc nút bị che.
- **SC-007**: 100% bước hồi quy /kanji trong US4.3 đạt so với mốc trước thay đổi;
  đường dẫn bộ mở trực tiếp và refresh đều hoạt động trên môi trường nghiệm thu.
- **SC-008**: Bản bàn giao nêu đủ hai dịch vụ, biến mẫu, khởi động, migrate và bằng chứng
  kiểm tra; mọi tuyên bố phát hành thành công đều kèm URL thực tế đã kiểm tra.

## Assumptions

- V1 dành cho người học đã đăng nhập, dữ liệu mặc định riêng tư. Khách thấy lời mời đăng nhập;
  không có bộ công khai, chia sẻ, cộng tác, nhập hàng loạt, sao chép bộ, SRS hay tạo nội dung AI.
- N3 và Bài 1–3 chỉ là ví dụ. Không giới hạn người dùng ở ba bộ hoặc tên JLPT.
- Tên thư mục/bộ được cắt khoảng trắng đầu/cuối, không rỗng; tên trùng được phép.
  Giới hạn độ dài kỹ thuật sẽ được quyết định ở bước plan và phải có thông báo khi vượt giới hạn.
- Mỗi thẻ chỉ có một đáp án hiragana; không yêu cầu nhiều biến thể, âm thanh, ví dụ hay hình ảnh.
- Thứ tự học mặc định theo thứ tự tạo tăng dần; không yêu cầu kéo thả, xáo trộn hoặc đổi thứ tự.
- Quy tắc `nn` giữ ngữ cảnh để `nna` thành `んな`; `n` cuối có thể chốt khi chấm.
  Kết quả hiển thị và con trỏ trong bảng là hợp đồng nghiệm thu, không phụ thuộc thư viện chọn sau.
- Không yêu cầu lưu lịch sử học/tiến độ qua reload. Dữ liệu thư mục/bộ/thẻ phải bền vững.
- Dữ liệu JLPT và Kanji có sẵn được giữ nguyên; không tự nhập hoặc sửa dữ liệu mẫu vào bộ cá nhân.
- Chỉ cần kết nối mạng để tải/lưu; không yêu cầu đồng bộ ngoại tuyến. Lỗi phải báo rõ và thử lại được.
- Người vận hành cung cấp hosting, dữ liệu kết nối và bí mật qua môi trường khi triển khai.
  Đích domain và chính sách cookie cần được xác minh ở plan; không giả định các domain mặc định
  của Vercel và Render chia sẻ cookie được với cấu hình hiện có.
- Nguồn khảo sát và giới hạn xác minh nằm trong [source-review.md](source-review.md).
  Các yêu cầu triển khai ở đây là tiêu chí bàn giao tương lai, chưa phải việc đã thực hiện.
