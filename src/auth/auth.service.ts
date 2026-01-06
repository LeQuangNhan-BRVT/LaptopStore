import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  Logger, ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountsService } from 'src/accounts/accounts.service';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { IAccount } from 'src/accounts/entities/account.entity';
import { IUser } from 'src/users/entities/user.entity';
import { use } from 'passport';
import { MailerService } from '@nestjs-modules/mailer';
import {v4 as uuidv4} from 'uuid'



@Injectable()
export class AuthService {
  constructor(
    private accountService: AccountsService,
    private userService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  private readonly logger = new Logger(AuthService.name);
  //check email quan ly(admin)
  async validateAdmin(email: string, pass: string): Promise<IAccount> {
    const admin = await this.accountService.findOneByEmailWithPassword(email);
    if (!admin) {
      throw new UnauthorizedException('Email hoặc mật khẩu sai!');
    }

    const isMatch = await bcrypt.compare(pass, admin.password_hash);
    if (isMatch) {
      const result =
        await this.accountService.findOneByEmailWithPassword(email);
      if (!result) {
        throw new UnauthorizedException('Email hoặc mật khẩu sai!');
      }
      // Ẩn trường mật khẩu trước khi trả về
      delete (result as any).password_hash;
      return result as IAccount;
    } else {
      throw new UnauthorizedException('Email hoặc mật khẩu sai!');
    }
  }
  async loginAdmin(admin: IAccount) {
    //payload để lưu thông tin trong token
    let knowRole:string = ''
    if(admin.role_id === 1){
      knowRole = 'admin'
    }else{
      knowRole = 'staff'
    }
    const payload = {
      email: admin.email,
      sub: admin.account_id,
      role: admin.role_id,
      type: knowRole
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: admin,
    };
  }
  async validateUser(email: string, pass: string): Promise<IUser> {
    this.logger.log(`Validating user login for email=${email}`);
    const user = await this.userService.findOneByEmailWithPassword(email);
    if (!user || !user.password_hash) {
      this.logger.warn(`Login failed (user not found or no password) for email=${email}`);
      throw new UnauthorizedException('Email hoặc mật khẩu sai!');
    }
    if(!user.is_active){
      throw new ForbiddenException('Tài khoản của bạn đã bị khóa! Hãy liên hệ quản trị website để biết thêm chi tiết')
    }
    const isMatch = await bcrypt.compare(pass, user.password_hash);
    if (!isMatch) {
      this.logger.warn(`Login failed (password mismatch) for email=${email}`);
      throw new UnauthorizedException('Email hoặc mật khẩu sai!');
    }
    // Ẩn trường mật khẩu trước khi trả về
    delete (user as any).password_hash;
    return user as IUser;
  }

  async forgotPassword(email: string){
    const user = await this.userService.findOneByEmail(email)
    if(!user){
      throw new BadRequestException('Email không tồn tại')
    }
    const resetToken = uuidv4()
    await this.userService.updateResetToken(user.user_id, resetToken)

    const resetLink = `https://dh52111401.id.vn/reset-password?token=${resetToken}`
    await this.mailerService.sendMail({
      to: email,
      subject: 'Hãy đặt lại mật khẩu',
      html: `<p>Nhấn vào đây để đặt lại mật khẩu: <a href="${resetLink}">Đặt lại mật khẩu</a></p>`,
    })
    return {message: 'Vui lòng kiểm tra email để đặt lại mật khẩu'}
  }

  async resetPassword(token: string, newPass: string) {
    const user = await this.userService.findByResetToken(token);
    if (!user) throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
  
    const hashedPassword = await bcrypt.hash(newPass, 10);
    
    // Cập nhật pass mới và xóa token
    await this.userService.updatePasswordAndClearToken(user.user_id, hashedPassword);
    
    return { message: 'Đổi mật khẩu thành công' };
  }

  async loginUser(user: IUser) {
    if(!user.is_active){
      throw new ForbiddenException('Tài khoản của bạn đã bị khóa! Hãy liên hệ quản trị website để biết thêm chi tiết')
      
    }
    const payload = {
      email: user.email,
      sub: (user as any).user_id,
      role: 'user',
    };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async registerUser(userData: {
    full_name: string;
    email: string;
    password: string;
    phone_number?: string;
  }): Promise<{ access_token: string; user: IUser }> {
    this.logger.log(`Registering user email=${userData.email}`);
    const existingUser = await this.userService.findOneByEmail(userData.email);
    if (existingUser) {
      this.logger.warn(`Register failed: email existed email=${userData.email}`);
      throw new ConflictException('Email đã tồn tại');
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const created = await this.userService.create({
      full_name: userData.full_name,
      email: userData.email,
      password_hash: hashedPassword,
      provider: 'local',
      provider_id: null,
      is_active: true,
      phone_number: userData.phone_number ?? null,
      address: null,
      
    } as Partial<IUser>);
    this.logger.log(`Register success user_id=${(created as any).user_id} email=${created.email}`);
    // ẩn password trước khi trả về
    delete (created as any).password_hash;
    return this.loginUser(created as IUser);
  }

  async validateSocialUser(params: {
    email: string | null;
    full_name: string | null;
    provider: 'google' | 'facebook';
    provider_id: string;
  }): Promise<
    | { action: 'LOGIN'; access_token: string; user: IUser }
    | { action: 'ASK_PASSWORD_TO_LINK'; reason: string }
  > {
    const { email, full_name, provider, provider_id } = params;
    if (!provider_id) {
      throw new UnauthorizedException('Thiếu mã nhà cung cấp');
    }
    // 1) Đã từng đăng nhập bằng provider này
    const byProvider = await this.userService.findByProvider(provider, provider_id);
    if (byProvider) {
      const result = await this.loginUser(byProvider);
      return { action: 'LOGIN', ...result };
    }
    // 2) Tìm theo email
    if (!email) {
      throw new UnauthorizedException('Không lấy được email từ nhà cung cấp');
    }
    const byEmail = await this.userService.findOneByEmail(email);
    if (byEmail) {
      // Nếu user local đã có mật khẩu, yêu cầu đăng nhập để liên kết
      if (byEmail.provider === 'local' && byEmail.password_hash) {
        return {
          action: 'ASK_PASSWORD_TO_LINK',
          reason: 'Email đã đăng ký local. Vui lòng đăng nhập để liên kết tài khoản mạng xã hội.',
        };
      }
      // Nếu là tài khoản social khác hoặc chưa có provider_id -> cập nhật liên kết
      const linked = await this.userService.updateProviderByUserId(
        (byEmail as any).user_id,
        provider,
        provider_id,
      );
      const result = await this.loginUser(linked);
      return { action: 'LOGIN', ...result };
    }
    // 3) Không tồn tại -> tạo mới từ provider
    const created = await this.userService.createFromProvider({
      full_name: full_name ?? email.split('@')[0],
      email,
      password_hash: null,
      provider,
      provider_id,
      is_active: true,
      phone_number: null,
      address: null,
    });
    const result = await this.loginUser(created as IUser);
    return { action: 'LOGIN', ...result };
  }
}
