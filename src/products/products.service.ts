import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, IsNull } from 'typeorm';
import { ProductSchema, IProduct } from './entities/product.entity';
import {
  ProductImageSchema,
  IProductImage,
} from './entities/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateSpecsDto } from './dto/update-specs.dto';
import {
  IProductSpecification,
  ProductSpecificationSchema,
} from './entities/product-specification.entity';
import { FilterProductDto } from './dto/filter-product.dto';
import defaultSlugify from 'slugify';
import { ITag, TagSchema } from 'src/tags/entities/tag.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductSchema)
    private productRepository: Repository<IProduct>,
    @InjectRepository(ProductImageSchema)
    private productImageRepository: Repository<IProductImage>,
    @InjectRepository(ProductSpecificationSchema)
    private specRepository: Repository<IProductSpecification>,
    @InjectRepository(TagSchema)
    private tagRepository: Repository<ITag>,
  ) {}

  async findAll(query: any, page: number, limit: number) {
    const { category_id, brand_id, min_price, max_price, search } = query;
    const qb = this.productRepository.createQueryBuilder('product');
    qb.leftJoinAndSelect('product.brand', 'brand');
    qb.leftJoinAndSelect('product.category', 'category');
    qb.leftJoinAndSelect('product.images', 'images');
    qb.andWhere('product.deleted_at IS NULL');
    qb.andWhere('product.is_active = :isActive', { isActive: true });

    if (category_id) {
      qb.andWhere('product.category_id = :category_id', { category_id });
    }
    if (brand_id) {
      qb.andWhere('product.brand_id = :brand_id', { brand_id });
    }

    if (min_price) {
      qb.andWhere('product.price >= :min_price', { min_price });
    }

    if (max_price) {
      qb.andWhere('product.price <= :max_price', { max_price });
    }

    if (search) {
      qb.andWhere('product.name LIKE :search', { search: `%${search}%` });
    }
    let sortBy = 'product.created_at'
    let order: 'ASC'|'DESC' = 'DESC'
    if(query.sort_by === 'price'){
      sortBy = 'product.price'
    }else if(query.sort_by === 'name'){
      sortBy = 'product.name'
    }
    if(query.order && (query.order === 'ASC' || query.order === 'DESC')){
      order = query.order
    }
    qb.orderBy(sortBy, order);
    qb.skip((page - 1) * limit);
    qb.take(limit);
    const [products, total] = await qb.getManyAndCount();

    const mappedProducts = products.map((product) => {
      const primaryImage = (product.images || []).find((img) => img.is_primary);
      const fallbackImage =
        product.images && product.images.length > 0
          ? product.images[0].image_url
          : null;

      return {
        ...product,
        primary_image: primaryImage?.image_url || fallbackImage,
      };
    });
    return {
      data: mappedProducts,
      meta: {
        total,
        page,
        limit,
        last_page: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<IProduct | null> {
    const product = await this.productRepository.findOne({
      where: { product_id: id, deleted_at: IsNull() },
      relations: ['images', 'brand', 'category', 'specification'],
    });
    if (!product) return null;

    return product;
  }
  private async preloadTags(tagNames: string[]): Promise<ITag[]> {
    if (!tagNames || tagNames.length === 0) return [];
    const uniqueNames = [...new Set(tagNames.map((t) => t.trim()))];
    const tags: ITag[] = [];
    for (const name of uniqueNames) {
      const existingTag = await this.tagRepository.findOne({ where: { name } });
      if (existingTag) {
        tags.push(existingTag);
      } else {
        const slug = defaultSlugify(name, {
          lower: true,
          strict: true,
          trim: true,
        });
        const newTag = this.tagRepository.create({ name, slug });
        const savedTag = await this.tagRepository.save(newTag);
        tags.push(savedTag);
      }
    }
    return tags;
  }

  private createSlug(name: string): string {
    const baseSlug = defaultSlugify(name, {
      lower: true,
      strict: true,
      trim: true,
      locale: 'vi',
    });
    return `${baseSlug}-${Date.now()}`;
  }

  async create(
    createProductDto: CreateProductDto,
    imagePath: string,
  ): Promise<IProduct> {
    const slug = this.createSlug(createProductDto.name);
    let tagEntities: ITag[] = [];
    if (createProductDto.tags) {
        tagEntities = await this.preloadTags(createProductDto.tags);
    }
    delete createProductDto.tags
    const filename = imagePath.replace(/^uploads[\\/]/, '').replace(/\\/g, '/');
    const imageUrl = `http://localhost:3000/uploads/${filename}`;
    const skuExisting = await this.productRepository.findOne({
      where: { sku: createProductDto.sku },
    });
    if (skuExisting) {
      throw new BadRequestException('SKU đã tồn tại');
    }

    const newProduct = this.productRepository.create({
      ...createProductDto,
      is_active: createProductDto.is_active ?? true,
      slug: slug,
      product_tag: tagEntities,
    });

    const savedProduct = await this.productRepository.save(newProduct);

    const productImage = this.productImageRepository.create({
      product_id: savedProduct.product_id,
      image_url: imageUrl,
      is_primary: true,
    });

    await this.productImageRepository.save(productImage);

    return savedProduct;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    
    const updatedProduct = await this.productRepository.findOne({
      where: { product_id: id },
      relations: ['product_tag'],
    });
    if (!updatedProduct) {
      throw new NotFoundException('Không tìm thấy sản phẩm sau khi cập nhật');
    }
    if (
      updateProductDto.name &&
      updateProductDto.name !== updatedProduct.name
    ) {
      updateProductDto.slug = this.createSlug(updateProductDto.name);
    }
    if (updateProductDto.tags) {
      const tags = await this.preloadTags(updateProductDto.tags);
      updatedProduct.product_tag = tags;
      delete updateProductDto.tags;
    }
    const updated = this.productRepository.merge(
      updatedProduct,
      updateProductDto,
    );
    return this.productRepository.save(updated)
  }

  async addImages(
    produc_Id: number,
    imagePaths: string[],
  ): Promise<IProductImage[]> {
    const newImages: IProductImage[] = [];
    for (const path of imagePaths) {
      const filename = path.replace(/^uploads[\\/]/, '').replace(/\\/g, '/');
      const image_url = `http://localhost:3000/uploads/${filename}`;
      const newImage = this.productImageRepository.create({
        product_id: produc_Id,
        image_url: image_url,
        is_primary: false,
      });
      const savedImg = await this.productImageRepository.save(newImage);
      newImages.push(savedImg);
    }
    return newImages;
  }

  async updateOrCreateSpecs(productId: number, specsDto: UpdateSpecsDto) {
    let specs = await this.specRepository.findOneBy({ product_id: productId });
    if (specs) {
      await this.specRepository.update(specs.spec_id, specsDto);
    } else {
      specs = this.specRepository.create({
        ...specsDto,
        product_id: productId,
      });
      await this.specRepository.save(specs);
    }
    return specs;
  }

  async findOneBySlug(slug: string) {
    const product = await this.productRepository.findOne({
      where: { slug: slug },
      relations: ['images', 'specification', 'category'],
    });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm: ${slug}`);
    }
    return product;
  }

  async findSpecs(productId: number) {
    return this.specRepository.findOneBy({ product_id: productId });
  }

  async remove(id: number): Promise<void> {
    const rs = await this.productRepository.softDelete(id);
    if (rs.affected === 0) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
    }
    await this.productRepository.update(id, {
      deleted_at: new Date(),
      is_active: false,
    });
  }

  async filterProducts(filters: FilterProductDto) {
    const {
      keyword,
      min_price,
      max_price,
      sort_by,
      ram,
      cpu,
      storage,
      page = 1,
      limit = 12,
    } = filters;

    const query = this.productRepository.createQueryBuilder('product');
    query.leftJoinAndSelect('product.specification', 'specs');
    query.leftJoinAndSelect('product.images', 'images');
    query.where('product.deleted_at IS NULL');
    query.andWhere('product.is_active = :isActive', { isActive: true });

    if (keyword) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('product.name LIKE :keyword', {
            keyword: `%${keyword}%`,
          }).orWhere('product.description LIKE :keyword', {
            keyword: `%${keyword}%`,
          });
        }),
      );
    }

    if (min_price) {
      query.andWhere('product.price >= :minPrice', { minPrice: min_price });
    }

    if (max_price) {
      query.andWhere('product.price <= :maxPrice', { maxPrice: max_price });
    }

    if (cpu) {
      const cpuList = cpu.split(',');
      query.andWhere(
        new Brackets((qb) => {
          cpuList.forEach((item, index) => {
            const originalTerm = item.trim();
            let shortTerm = originalTerm;
            if (originalTerm.toLowerCase().includes('core i')) {
              shortTerm = originalTerm.replace(/core\s*/i, '').trim();
            }
            if (originalTerm.toLowerCase().includes('ryzen ')) {
              shortTerm = originalTerm.replace(/ryzen\s*/, '').trim();
            }
            const paramName = `cpuTerm_${index}`;
            const shortParamName = `cpuShort_${index}`;
            qb.orWhere(
              new Brackets((subQb) => {
                subQb
                  .where(`specs.cpu LIKE :${paramName}`, {
                    [paramName]: `%${originalTerm}`,
                  })
                  .orWhere(`product.name LIKE :${shortParamName}`, {
                    [shortParamName]: `%${shortTerm}%`,
                  })
                  .orWhere(`product.description LIKE :${shortParamName}`, {
                    [shortParamName]: `%${shortTerm}%`,
                  });
              }),
            );
          });
        }),
      );
    }

    if (ram) {
      const ramList = ram.split(',');
      query.andWhere(
        new Brackets((qb) => {
          ramList.forEach((item, index) => {
            const term = item.trim();
            const paramName = `ramTerm_${index}`;
            qb.orWhere(`specs.ram LIKE :${paramName}`, {
              [paramName]: `${term}%`,
            });
          });
        }),
      );
    }

    if (storage) {
      const diskList = storage.split(',');
      query.andWhere(
        new Brackets((qb) => {
          diskList.forEach((item, index) => {
            const term = item.trim();
            const paramName = `diskTerm_${index}`;
            qb.orWhere(`specs.storage LIKE :${paramName}`, {
              [paramName]: `${term}%`,
            });
          });
        }),
      );
    }

    if (sort_by) {
      if (sort_by === 'price_asc') {
        query.orderBy('product.price', 'ASC');
      } else if (sort_by === 'price_desc') {
        query.orderBy('product.price', 'DESC');
      } else if (sort_by === 'newest') {
        query.orderBy('product.created_at', 'DESC');
      }
    } else {
      query.orderBy('product.created_at', 'DESC');
    }

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    console.log('SQL Query:', query.getSql());
    console.log('Parameters:', query.getParameters());

    const [data, total] = await query.getManyAndCount();

    console.log('Số sản phẩm trả về:', data.length);
    console.log('Tổng số đếm:', total);

    const mappedData = data.map((product) => {
      const primaryImage = (product.images || []).find((img) => img.is_primary);
      return {
        ...product,
        primary_image:
          primaryImage?.image_url || (product.images?.[0]?.image_url ?? null),
      };
    });

    return {
      data: mappedData,
      meta: {
        total,
        page,
        limit,
        last_page: Math.ceil(total / limit),
      },
    };
  }
}
