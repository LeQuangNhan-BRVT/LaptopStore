import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { OrderSchema } from 'src/orders/entities/order.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([OrderSchema])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
