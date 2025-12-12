import { Module } from '@nestjs/common';
import { SepayService } from './sepay.service';
import { SepayController } from './sepay.controller';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true}), OrdersModule],
  controllers: [SepayController],
  providers: [SepayService],
})
export class SepayModule {}
