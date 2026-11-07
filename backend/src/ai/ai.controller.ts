import { Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { AiService } from './ai.service';

// Uses the existing global JwtCookieGuard. Never expose a public bypass.
@Controller('ai')
export class AiController {
  constructor(private readonly service: AiService) {}

  @Post('authorize')
  authorize(@CurrentUser() user: AuthenticatedUser) {
    return this.service.authorize(user.id);
  }
}
