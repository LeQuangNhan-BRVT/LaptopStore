import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesSchema } from './entities/category.entity';
import { ProductSchema } from 'src/products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriesSchema, ProductSchema])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
