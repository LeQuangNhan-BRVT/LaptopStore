import { Module } from '@nestjs/common';
import { VnpayService } from './vnpay.service';
import { VnpayController } from './vnpay.controller';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from 'src/orders/orders.module';
@Module({
  imports: [ConfigModule.forRoot({isGlobal: true}), OrdersModule],
  controllers: [VnpayController],
  providers: [VnpayService],
})
export class VnpayModule {}
