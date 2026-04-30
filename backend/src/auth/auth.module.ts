import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { AccountsModule } from 'src/accounts/accounts.module';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleAuthGuard } from './guards/google.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET') ?? '';
        // Lấy expiresIn dưới dạng STRING, không phải number
        const expiresIn = configService.get<string>('JWT_EXPIRATION') ?? '7d';
       
        if (!secret) {
          throw new Error('JWT_SECRET không được định nghĩa trong file .env!');
        }
        if (!expiresIn) {
          throw new Error('JWT_EXPIRATION không được định nghĩa trong file .env!');
        }
        return { 
          secret: secret,
          signOptions: {
            expiresIn: expiresIn as any, 
          }, 
        };
      },
    }),
    AccountsModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GoogleAuthGuard],
})
export class AuthModule {}