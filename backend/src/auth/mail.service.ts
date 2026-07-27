import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  constructor(private readonly config: ConfigService) {}

  private get client() {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) throw new InternalServerErrorException('Dịch vụ email chưa được cấu hình.');
    return new Resend(apiKey);
  }

  private get from() {
    return this.config.getOrThrow<string>('RESEND_FROM_EMAIL');
  }

  async sendVerificationCode(email: string, code: string) {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: email,
      subject: 'Mã xác thực email Bu Nihon',
      html: `<p>Mã xác thực của bạn là:</p><h1 style="letter-spacing: 0.25em">${code}</h1><p>Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với bất kỳ ai.</p>`,
    });
    if (error) throw new InternalServerErrorException('Không thể gửi email xác thực.');
  }

  async sendPasswordReset(email: string, url: string) {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: email,
      subject: 'Đặt lại mật khẩu Bu Nihon',
      html: `<p>Bạn đã yêu cầu đặt lại mật khẩu.</p><p><a href="${url}">Đặt lại mật khẩu</a></p><p>Liên kết có hiệu lực trong 30 phút và chỉ dùng được một lần.</p>`,
    });
    if (error) throw new InternalServerErrorException('Không thể gửi email đặt lại mật khẩu.');
  }
}
