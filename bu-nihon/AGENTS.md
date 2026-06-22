# Quy tắc làm việc cho BU NIHON

## Bắt buộc

- Duy trì tương thích với Next.js 16 App Router. Khi dùng API Next.js dễ thay đổi hoặc chưa chắc chắn, đọc tài liệu phù hợp trong `node_modules/next/dist/docs/` trước khi viết code.
- Chỉ sửa phần cần thiết; ưu tiên mở rộng kiến trúc và component hiện có. Không thay dependency, cấu trúc thư mục hoặc config nếu không phục vụ trực tiếp yêu cầu.
- Dùng TypeScript strict và alias `@/`. Ưu tiên Server Component, chỉ dùng Client Component khi cần tương tác hoặc browser API.
- Dùng Zustand cho state toàn cục, TanStack Query cho dữ liệu bất đồng bộ và Zod cho form/dữ liệu đầu vào. Không dùng Pinia.
- Tách UI, state, validation và logic fetch theo trách nhiệm. Không hard-code dữ liệu có khả năng thay đổi trực tiếp trong component khi một data module, schema hoặc service phù hợp hơn.
- Icon mới phải là SVG component; không dùng icon font. Bảo đảm responsive, semantic HTML, keyboard navigation và aria label cho control không có nhãn nhìn thấy.
- Mọi feature fetch dữ liệu phải có loading, empty và error state.

## Trước khi hoàn tất

```bash
npm run lint
npm run build
```

Không chỉnh sửa source code hoặc dependency nếu nhiệm vụ chỉ yêu cầu tài liệu. Báo cáo ngắn gọn các file đã đổi và kết quả kiểm tra.
