import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { AccountsService } from 'src/accounts/accounts.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private accountsService: AccountsService,
  ) {
    const jwtsecret = configService.get<string>('JWT_SECRET');
    if (!jwtsecret) {
      throw new Error('JWT_SECRET not found in .env');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtsecret,
    });
  }
  async validate(payload: any) {
    let user: any;

    if (payload.role === 'user') {
      user = await this.usersService.getById(payload.sub);
    } else {
      user = await this.accountsService.findOneById(payload.sub);
    }

    if (!user) {
      throw new UnauthorizedException('Token không hợp lệ hoặc người dùng không tồn tại.');
    }
    
    if (user.password_hash) {
      delete user.password_hash;
    }
    
    return {
      ...user,
      role: payload.role,
    }; 
  }
}
