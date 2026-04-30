import { Controller, Patch, Body, UseGuards, Req, BadRequestException, Query, Get, ForbiddenException, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '@nestjs/passport';
import { AccountsService } from 'src/accounts/accounts.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() updateData: UpdateProfileDto){
    const userId = req.user.user_id; 
    if (!userId) {
        throw new BadRequestException('Không tìm thấy ID người dùng từ Token');
    }

    return this.usersService.update(userId, updateData);
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/list')
  async findAll(@Req() req: any, @Query('page') page: number, @Query('limit') limit: number, @Query('q') keyword: string){
    if(req.user.role_id !== 1) throw new ForbiddenException('Không có quyền')
    return this.usersService.findAll(page, limit, keyword)

  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/:id/toggle-lock')
  async toggleLock(@Req() req: any, @Param('id') id: number){
    if(req.user.role_id !== 1) throw new ForbiddenException('Không có quyền')
    return this.usersService.toggleLock(id)
  }
}
