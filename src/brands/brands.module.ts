import { Module } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandSchema } from './entities/brand.entity';
@Module({
  imports: [TypeOrmModule.forFeature([BrandSchema])],
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
