import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthGuard } from './guards/google.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private readonly logger = new Logger(AuthController.name);

  @HttpCode(HttpStatus.OK)
  @Post('admin/login')
  async adminLogin(@Body() adminLoginDto: AdminLoginDto) {
    const admin = await this.authService.validateAdmin(
      adminLoginDto.email,
      adminLoginDto.password,
    );
    return this.authService.loginAdmin(admin);
  }
  //user thuong
  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async registerUser(@Body() body: RegisterDto) {
    this.logger.log(`HTTP POST /auth/register email=${body?.email}`);
    return this.authService.registerUser(body);
  }

  @Post('login')
  async loginUser(@Body() body: any) {
    this.logger.log(`HTTP POST /auth/login email=${body?.email}`);
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    return this.authService.loginUser(user);
  }

  //google dang ky
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req) {}

  // @Get('google/callback')
  // @UseGuards(GoogleAuthGuard)
  // async googleAuthCallBack(@Req() req, @Res() res: Response) {
  //   // 3. Lấy URL Frontend động từ file .env
  //   // (Lúc này nó sẽ là link Cloudflare của bạn)
  //   const frontendUrl = this.configService.get<string>('FRONTEND_URL');

  //   // Nếu người dùng hủy hoặc lỗi
  //   if (!req.user) {
  //     return res.redirect(`${frontendUrl}/login?link_social=google&error=access_denied`);
  //   }

  //   const social = req.user as { email: string|null; full_name: string|null; provider: 'google'; provider_id: string };

  //   const result = await this.authService.validateSocialUser({
  //     email: social?.email ?? null,
  //     full_name: social?.full_name ?? null,
  //     provider: 'google',
  //     provider_id: social?.provider_id,
  //   });

  //   if (result.action === 'LOGIN') {
  //     // 4. Redirect về đúng domain frontend
  //     return res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(result.access_token)}`);
  //   }

  //   // Trường hợp cần liên kết tài khoản hoặc lỗi khác
  //   return res.redirect(`${frontendUrl}/login?link_social=google`);
  // }
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallBack(@Req() req, @Res() res: Response) {
    // Nếu người dùng hủy, Passport sẽ redirect qua failureRedirect ở guard.
    // Fallback: nếu không có user, tự chuyển hướng về login với lỗi.
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!req.user) {
      return res.redirect(
        `${frontendUrl}/login?link_social=google&error=access_denied`,
      );
    }
    const social = req.user as {
      email: string | null;
      full_name: string | null;
      provider: 'google';
      provider_id: string;
    };
    const result = await this.authService.validateSocialUser({
      email: social?.email ?? null,
      full_name: social?.full_name ?? null,
      provider: 'google',
      provider_id: social?.provider_id,
    });
    if (result.action === 'LOGIN') {
      return res.redirect(
        `${frontendUrl}/social/callback?token=${encodeURIComponent(result.access_token)}`,
      );
    }
    return res.redirect(`${frontendUrl}/login?link_social=google`);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt')) // Dùng Guard 'jwt' (tên đặt trong JwtStrategy)
  getProfile(@Req() req) {
    return req.user;
  }
}
