import {
  Controller,
  Body,
  Post,
  UseGuards,
  Req,
  Get,
  Query,
  ForbiddenException,
  Patch,
  Param,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Req() req: any, @Body() createOrderDto: CreateOrderDto) {
    const userId = req.user.user_id;
    return this.ordersService.create(userId, createOrderDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getMyOrders(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('status') status: string,
    @Query('sort_by') sortBy: string,
    @Query('order') order: 'ASC' | 'DESC',
  ) {
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      return [];
    }

    const userId = req.user.user_id;
    return this.ordersService.findByUser(
      userId,
      page,
      10,
      status,
      sortBy,
      order,
    );
  }

  @Patch(':id/cancel')
  @UseGuards(AuthGuard('jwt'))
  async cancelOrder(@Req() req: any, @Param('id') id: number) {
    const userId = req.user.user_id;
    return this.ordersService.cancelOrderByUser(id, userId);
  }

  //admin
  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'))
  async getAllOrders(
    @Req() req: any,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('status') status: string,
    @Query('sort_by') sortBy: string,
    @Query('sort_desc') sortDesc: string, // Frontend gửi 'true'/'false' hoặc boolean
    @Query('search') search: string,
    @Query('payment_method_id') payment_method_id: number,
    @Query('start_date') start_date: string,
    @Query('end_date') end_date: string,
  ) {
    if (req.user.role_id !== 1 && req.user.role_id !== 2) {
      throw new ForbiddenException('Bạn không có quyền quản lý đơn hàng');
    }

    const order = sortDesc === 'true' || sortDesc === '1' ? 'DESC' : 'ASC';
    return this.ordersService.findAll({
      page,
      limit,
      status,
      sortBy,
      sortOrder: order,
      search,
      payment_method_id,
      start_date,
      end_date,
    });
  }

  @Patch('admin/:id/status')
  @UseGuards(AuthGuard('jwt'))
  async updateOrderStatus(
    @Req() req: any,
    @Param('id') id: number,
    @Body('status') status: OrderStatus,
  ) {
    if (req.user.role_id !== 1 && req.user.role_id !== 2) {
      throw new ForbiddenException('Bạn không có quyền quản lý đơn hàng');
    }
    return this.ordersService.updateStatus(id, status);
  }
}
