import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesSchema } from './entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriesSchema])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
