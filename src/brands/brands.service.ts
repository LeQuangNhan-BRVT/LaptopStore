import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IBrand, BrandSchema } from './entities/brand.entity';
import { Repository } from 'typeorm';
import { CreateBranDto } from './dto/create-brand.dto';
import { IProduct, ProductSchema } from 'src/products/entities/product.entity';
import { log } from 'console';
@Injectable()
export class BrandsService {
    constructor(
        @InjectRepository(BrandSchema)
        private brandRepository:Repository<IBrand>,
        @InjectRepository(ProductSchema)
        private productRepository: Repository<IProduct>,
    ){}
    async findAllBrandProduct(): Promise<IBrand[]>{
        return this.brandRepository.find();
    }
   
    async createBrandProduct(createBranDto: CreateBranDto, logoPath: string | null):Promise<IBrand>{
        const existingBrand = await this.brandRepository.findOneBy({
            name: createBranDto.name,
          });
      
          // 3. Nếu tìm thấy, ném lỗi 409
          if (existingBrand) {
            throw new ConflictException('Tên thương hiệu này đã tồn tại.');
          }
        let imageUrl: string | null = null
        if(logoPath){
            const filename = logoPath.replace(/^uploads[\\/]/, '').replace(/\\/g, '/');
            imageUrl = `http://localhost:3000/uploads/${filename}`
        }
        
        const newBrand = this.brandRepository.create({
            name: createBranDto.name,
            logo_url: imageUrl
        })
        return this.brandRepository.save(newBrand);
    }

    async remove(id: number): Promise<void>{
        const products = await this.productRepository.find({
            where: {brand_id: id}
        })
        if(products.length > 0){
            throw new BadRequestException(`Không thể xóa thương hiệu vì vẫn còn sản phẩm liên quan`)
        }
        const rs = await this.brandRepository.softDelete(id)
        if(rs.affected === 0){
            throw new NotFoundException(`Không tìm thấy thương hiệu với ID: ${id}`)
        }
    }
    
    
}
