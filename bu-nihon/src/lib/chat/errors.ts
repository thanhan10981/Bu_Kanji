export function chatErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object') {
    const value = body as { message?: unknown; error?: unknown };
    if (Array.isArray(value.message)) {
      const messages = value.message.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()));
      if (messages.length) return messages.slice(0, 12).join('\n');
    }
    if (typeof value.message === 'string' && value.message.trim()) return value.message;
    if (typeof value.error === 'string' && value.error.trim() && !['Bad Request', 'Unauthorized', 'Forbidden', 'Not Found', 'Internal Server Error'].includes(value.error)) return value.error;
  }
  if (status === 400) return 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra file và thử lại.';
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 413) return 'Một phần dữ liệu tải lên vượt giới hạn server. Vui lòng thử lại hoặc kiểm tra cấu hình backend.';
  return 'Không thể kết nối server. Vui lòng thử lại.';
}
