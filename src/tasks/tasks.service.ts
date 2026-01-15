import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from 'src/orders/orders.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  IOrder,
  OrderSchema,
  OrderStatus,
} from 'src/orders/entities/order.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(OrderSchema)
    private orderRepository: Repository<IOrder>,
    private orderService: OrdersService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredOrders() {
    this.logger.debug('Dang quet don hang het han...');
    const time4h = new Date(Date.now() - 4 * 60 * 60 * 1000); //chờ xử lý trong 4 tiếng
    const time15m = new Date(Date.now() - 15 * 60 * 1000); //chờ thanh toán trong 15 phút
    const expiredOrders = await this.orderRepository.find({
      where: [
        { status: OrderStatus.PENDING, created_at: LessThan(time4h) },
        { status: OrderStatus.PAYMENT, updated_at: LessThan(time15m) },
      ],
    });
    
    for (const order of expiredOrders) {
      this.logger.log(`Hủy đơn quá hạn: ${order.order_code}`);
      await this.orderService.cancelAndRestoreStock(order.order_id);
    }
  }
}
