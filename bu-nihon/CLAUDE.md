# BU NIHON

BU NIHON là landing page học tiếng Nhật dành cho người Việt. Mục tiêu của giao diện là tạo cảm giác gần gũi, tích cực và dễ bắt đầu học: nội dung rõ ràng, các bước hành động nổi bật, hình ảnh Nhật Bản vừa đủ và không rườm rà.

`AGENTS.md` là tập quy tắc bắt buộc khi chỉnh sửa dự án. Tài liệu này cung cấp bối cảnh sản phẩm và quy ước kỹ thuật; không lặp lại các quy tắc thực thi ở đó.

## Công nghệ và lệnh chạy

- Next.js 16 với App Router, React 19 và TypeScript strict.
- Tailwind CSS 4 dùng cho style; có thể giữ CSS cục bộ/toàn cục khi phù hợp với hệ thống hiện tại.
- TanStack Query dùng cho dữ liệu bất đồng bộ và cache.
- Zustand là chuẩn state dùng chung. Không dùng Pinia.
- Zod dùng để xác thực dữ liệu biểu mẫu, query input và dữ liệu đi vào ứng dụng.

```bash
npm run dev
npm run lint
npm run build
```

## Cấu trúc hiện tại

```text
src/
├── app/              # Route, layout và global style của App Router
└── lib/              # Query client, schema và tiện ích dùng chung
```

Sử dụng alias `@/` cho import từ `src/`. Khi ứng dụng mở rộng, đặt component tái sử dụng trong `src/components/`, state Zustand trong `src/stores/`, logic gọi dữ liệu trong `src/services/` hoặc `src/queries/`, và schema trong `src/lib/` hoặc `src/schemas/` theo mức độ phức tạp. Không tạo tầng trừu tượng chỉ để dự phòng.

## Quy ước triển khai

- Ưu tiên Server Component. Chỉ thêm `"use client"` cho component cần state, effect, event handler hoặc browser API.
- Dữ liệu dùng chung giữa các màn hình/feature thuộc Zustand; state tạm thời của một component giữ bằng React state.
- Mọi dữ liệu fetch qua service/query rõ kiểu. Dùng TanStack Query cho loading, cache, retry và trạng thái lỗi.
- Viết Zod schema trước khi triển khai form hoặc dữ liệu đầu vào không đáng tin cậy; suy ra TypeScript type từ schema khi thuận tiện.
- Giữ component nhỏ, có trách nhiệm rõ và dùng TypeScript nghiêm ngặt; tránh `any`, prop dư thừa và logic nghiệp vụ trong markup.
- Dùng SVG component cho icon mới. Không dùng icon font. Chỉ thêm package khi lợi ích rõ ràng và thật sự cần thiết.

## UI, nội dung và chất lượng

- Ưu tiên mobile-first, sau đó mở rộng cho tablet và desktop. Mọi CTA, menu và card phải thao tác tốt bằng cảm ứng và bàn phím.
- Duy trì phong cách hiện tại: tông xanh lá dịu, điểm nhấn cam, nền sáng, typography thân thiện và minh họa lấy cảm hứng từ Nhật Bản. Không biến landing page thành dashboard học tập nhiều module nếu chưa có yêu cầu sản phẩm.
- Viết nội dung tiếng Việt tự nhiên, có dấu, nhất quán về cách gọi người học. Tiếng Nhật phải được hiển thị đúng Unicode.
- Dùng HTML semantic, label/aria-label cho control không có nhãn chữ, trạng thái focus rõ ràng và tương phản màu đủ tốt.
- Khi thêm luồng dữ liệu, luôn thiết kế loading, empty và error state trước khi coi tính năng là hoàn chỉnh.

## Hoàn tất thay đổi

Trước khi bàn giao, chạy `npm run lint` và `npm run build`. Nêu rõ mọi giới hạn còn lại, thay đổi dependency hoặc giả định sản phẩm trong phần bàn giao.
