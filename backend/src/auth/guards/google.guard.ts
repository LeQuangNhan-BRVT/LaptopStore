import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    // Áp dụng cho cả route /auth/google và /auth/google/callback
    return {
      scope: ['email', 'profile'],
      failureRedirect: 'http://localhost:5173/login?link_social=google&error=access_denied',
      session: false,
    };
  }
}


