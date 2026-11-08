import { LoginQuotaException } from './login-limit.service';
import { Body, Controller, Get, HttpException, Post, Query, Req, Res, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';
import { AuthenticatedUser } from './auth.types';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailDto } from './dto/email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { safeReturnPath } from './return-path';
import { authCapabilities } from './capabilities';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Public()
  @Get('config')
  capabilities() { return authCapabilities(key => this.config.get<string>(key)); }

  @Public()
  @Post('register')
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.register(body.email, body.password).catch((error: unknown) => {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException('Không thể tạo tài khoản. Vui lòng thử lại sau.');
    });
    this.setSessionCookies(response, session.accessToken, session.refreshToken);
    return { user: session.user };
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.auth.verifyEmail(body.email, body.code);
  }

  @Public()
  @Post('resend-verification')
  async resendVerification(@Body() body: EmailDto) {
    return this.auth.resendVerification(body.email);
  }

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.login(body.email, body.password, request.ip ?? request.socket.remoteAddress ?? '').catch((error: unknown) => {
      if (error instanceof LoginQuotaException) response.setHeader('Retry-After', error.retryAfterSeconds);
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException('Dịch vụ đăng nhập tạm thời chưa sẵn sàng. Vui lòng thử lại sau.');
    });
    this.setSessionCookies(response, session.accessToken, session.refreshToken);
    return { user: session.user };
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.refresh_token as string | undefined;
    if (!refreshToken) throw new UnauthorizedException('Không có phiên làm mới.');
    const session = await this.auth.refresh(refreshToken);
    this.setSessionCookies(response, session.accessToken, session.refreshToken);
    return { user: session.user };
  }

  @Public()
  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.cookies?.refresh_token as string | undefined);
    this.clearSessionCookies(response);
    return { message: 'Đã đăng xuất.' };
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() body: EmailDto) {
    return this.auth.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body.token, body.password);
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return { user };
  }

  @Public()
  @Get('google')
  google(@Query('returnTo') returnTo: string | undefined, @Res() response: Response) {
    if (!this.capabilities().googleLogin) throw new ServiceUnavailableException('Đăng nhập Google tạm thời chưa sẵn sàng.');
    const state = randomBytes(32).toString('base64url');
    response.cookie('oauth_state', state, { ...this.cookieOptions(), httpOnly: true, maxAge: 10 * 60 * 1000, path: '/api/auth/google/callback' });
    response.cookie('oauth_return', safeReturnPath(returnTo), { ...this.cookieOptions(), maxAge: 10 * 60 * 1000, path: '/api/auth/google/callback' });
    const params = new URLSearchParams({
      client_id: this.config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      redirect_uri: this.config.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  }

  @Public()
  @Get('google/callback')
  async googleCallback(@Query('code') code: string | undefined, @Query('state') state: string | undefined, @Req() request: Request, @Res() response: Response) {
    const expectedState = request.cookies?.oauth_state as string | undefined;
    const returnTo = safeReturnPath(request.cookies?.oauth_return);
    response.clearCookie('oauth_state', { ...this.cookieOptions(), path: '/api/auth/google/callback' });
    response.clearCookie('oauth_return', { ...this.cookieOptions(), path: '/api/auth/google/callback' });
    if (!code || !state || state !== expectedState) throw new UnauthorizedException('Google OAuth state không hợp lệ.');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
        client_secret: this.config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
        redirect_uri: this.config.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
        grant_type: 'authorization_code',
      }),
    });
    const tokenPayload = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenResponse.ok || !tokenPayload.access_token) throw new UnauthorizedException('Không thể xác thực với Google.');

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    });
    const profile = (await profileResponse.json()) as { sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
    if (!profileResponse.ok || !profile.sub || !profile.email || !profile.email_verified) throw new UnauthorizedException('Google không cung cấp email đã xác thực.');

    const session = await this.auth.findOrCreateGoogleUser({ id: profile.sub, email: profile.email, name: profile.name, picture: profile.picture });
    this.setSessionCookies(response, session.accessToken, session.refreshToken);
    response.redirect(new URL(returnTo, this.config.getOrThrow<string>('FRONTEND_URL')).toString());
  }

  private cookieOptions() {
    const domain = this.config.get<string>('COOKIE_DOMAIN');
    return {
      httpOnly: true,
      secure: this.config.get('COOKIE_SECURE') === 'true' || this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      ...(domain ? { domain } : {}),
    };
  }

  private setSessionCookies(response: Response, accessToken: string, refreshToken: string) {
    response.cookie('access_token', accessToken, { ...this.cookieOptions(), maxAge: 15 * 60 * 1000, path: '/' });
    response.cookie('refresh_token', refreshToken, { ...this.cookieOptions(), maxAge: 30 * 24 * 60 * 60 * 1000, path: '/api/auth' });
  }

  private clearSessionCookies(response: Response) {
    response.clearCookie('access_token', { ...this.cookieOptions(), path: '/' });
    response.clearCookie('refresh_token', { ...this.cookieOptions(), path: '/api/auth' });
  }
}
