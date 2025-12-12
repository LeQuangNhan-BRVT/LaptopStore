import { Body, ConflictException, Controller, ForbiddenException, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AuthGuard } from '@nestjs/passport';
import * as bcrypt from 'bcrypt'

@Controller('accounts')
@UseGuards(AuthGuard('jwt'))
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}
  
  @Post('admin/create-staff')
  async createStaff(@Req() req: any, @Body() body: any){
    if(req.user.role_id !== 1){
      throw new ForbiddenException('Chỉ quản lý mới thêm nhân viên mới')
    }
    const existEmail = await this.accountsService.findOneEmail(body.email)
    if(existEmail) throw new ConflictException('Email này đã đăng ký tài khoản!')
    const hash = await bcrypt.hash(body.password, 10)
    return this.accountsService.create({
      email: body.email,
      password_hash: hash,
      phone_number: body.phone_number,
      full_name: body.full_name,
      role_id: 2,
      is_active: true
    })
  }

}
