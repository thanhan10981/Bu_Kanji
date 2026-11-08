import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  email!: string;

  @IsString({ message: 'Mật khẩu không hợp lệ.' })
  @MinLength(1, { message: 'Vui lòng nhập mật khẩu.' })
  @MaxLength(128, { message: 'Mật khẩu không được quá 128 ký tự.' })
  password!: string;
}
