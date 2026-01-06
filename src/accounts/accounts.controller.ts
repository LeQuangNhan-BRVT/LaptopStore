import { Body, ConflictException, Controller, ForbiddenException, Get, Post, Req, UseGuards, Query, Put, Delete, Param } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AuthGuard } from '@nestjs/passport';
import * as bcrypt from 'bcrypt'

@Controller('accounts')
@UseGuards(AuthGuard('jwt'))
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  private ensureAdmin(req: any) {
    if (req.user.role_id !== 1) {
      throw new ForbiddenException('Chỉ quản lý mới có quyền thực hiện');
    }
  }
  
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

  @Get()
  async findAll(@Req() req: any, @Query('role_id') roleId?: number) {
    this.ensureAdmin(req);
    // Nếu có query param role_id thì lọc, không thì lấy hết (hoặc tuỳ logic)
    return this.accountsService.findAll(roleId);
  }


  @Put(':id')
  async update(@Req() req: any, @Param('id') id: number, @Body() body: any) {
    this.ensureAdmin(req);
    return this.accountsService.update(id, body);
  }

  // 4. Xóa nhân viên
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: number) {
    this.ensureAdmin(req);
    return this.accountsService.remove(id);
  }
}
