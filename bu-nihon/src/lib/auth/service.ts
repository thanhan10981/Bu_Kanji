import { api, ApiError, type AppUser } from '@/lib/api';
import { loginSchema, signupSchema } from '@/lib/auth/schemas';
import { z } from 'zod';

const sessionSchema = z.object({ user: z.object({ id: z.string().min(1), email: z.string(),
  displayName: z.string(), avatarUrl: z.string().nullable(), emailVerified: z.boolean() }) });
export async function authenticate(mode: 'login' | 'signup', input: { email: string; password: string }): Promise<AppUser> {
  const data = (mode === 'signup' ? signupSchema : loginSchema).parse(input);
  let response: unknown;
  try {
    response = await api.post(mode === 'signup' ? '/auth/register' : '/auth/login', data);
  } catch (error) {
    if (mode === 'signup' && !(error instanceof ApiError)) {
      // A lost response may still have set cookies. Never repeat the registration POST.
      try {
        const recovered = sessionSchema.parse(await api.get('/auth/me'));
        if (recovered.user.email.trim().toLowerCase() === data.email) return recovered.user;
      } catch { /* Unknown result: let the user sign in manually. */ }
      throw new ApiError('Chưa xác định được kết quả đăng ký. Vui lòng thử đăng nhập bằng thông tin vừa nhập.', 0);
    }
    throw error;
  }
  const result = sessionSchema.safeParse(response);
  if (!result.success) throw new ApiError('Phản hồi đăng nhập không hợp lệ. Vui lòng thử lại.', 502);
  return result.data.user;
}
