import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICategories, CategoriesSchema } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoriesSchema)
    private categoryRepository:Repository<ICategories>
  ){}

  async findAll() {
    return this.categoryRepository.find();
  }
  async create(createCategory: CreateCategoryDto): Promise<ICategories>{
    const newCate = this.categoryRepository.create(createCategory)
    return this.categoryRepository.save(newCate)
  }
  async remove(id: number): Promise<void>{
    const rs = await this.categoryRepository.softDelete(id)
    if(rs.affected === 0){
        throw new NotFoundException(`Không tìm thấy danh mục với ID: ${id}`)
    }
}
  
}
