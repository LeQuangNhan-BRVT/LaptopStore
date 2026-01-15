import { Module } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandSchema } from './entities/brand.entity';
import { ProductSchema } from 'src/products/entities/product.entity';
@Module({
  imports: [TypeOrmModule.forFeature([BrandSchema, ProductSchema])],
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
