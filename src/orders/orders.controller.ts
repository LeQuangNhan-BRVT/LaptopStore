import { Controller, Body, Post, UseGuards, Req, Get, Query, ForbiddenException, Patch, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateOrderDto } from './dto/create-order.dto';



@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Req() req: any, @Body() createOrderDto: CreateOrderDto){
    const userId = req.user.user_id
    return this.ordersService.create(userId, createOrderDto)
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getMyOrders(@Req() req:any){
    if(req.user.role_id === 1 || req.user.role_id === 2){
      return []
     
    }

    const userId = req.user.user_id
    return this.ordersService.findByUser(userId)
  }

  @Patch(':id/cancel')
  @UseGuards(AuthGuard('jwt'))
  async cancelOrder(@Req() req: any, @Param('id') id:number){
    const userId = req.user.user_id
    return this.ordersService.cancelOrderByUser(id, userId)
  }

  //admin
  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'))
  async getAllOrders(@Req() req: any, @Query('page') page: number, @Query('status') status: string){
    if(req.user.role_id !== 1 && req.user.role_id !== 2){
      throw new ForbiddenException('Bạn không có quyền quản lý đơn hàng')
    }
    return this.ordersService.findAll(page, 10, status)
  }

  @Patch('admin/:id/status')
  @UseGuards(AuthGuard('jwt'))
  async updateOrderStatus(@Req() req: any, @Param('id') id:number, @Body('status') status: string){
    if(req.user.role_id !== 1){
      throw new ForbiddenException('Bạn không có quyền quản lý đơn hàng')
    }
    return this.ordersService.updateStatus(id, status)
  }
}
