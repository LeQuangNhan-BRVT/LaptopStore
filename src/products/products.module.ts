import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductSchema } from './entities/product.entity';
import { ProductImageSchema } from './entities/product-image.entity';
import { ProductSpecificationSchema } from './entities/product-specification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagSchema } from 'src/tags/entities/tag.entity';
@Module({
  imports: [TypeOrmModule.forFeature([ProductSchema, ProductImageSchema, ProductSpecificationSchema, TagSchema])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService]
})
export class ProductsModule {}
