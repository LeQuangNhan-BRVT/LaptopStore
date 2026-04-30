import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderSchema } from './entities/order.entity';
import { OrderItemSchema } from './entities/order-item.entity';
import { ProductsModule } from 'src/products/products.module';
@Module({
  imports: [TypeOrmModule.forFeature([OrderSchema, OrderItemSchema]), ProductsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService]
})
export class OrdersModule {}
