import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Email không hợp lệ.');
export const signupSchema = z.object({
  email,
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự.').max(128, 'Mật khẩu không được quá 128 ký tự.'),
});
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.').max(128, 'Mật khẩu không được quá 128 ký tự.'),
});
