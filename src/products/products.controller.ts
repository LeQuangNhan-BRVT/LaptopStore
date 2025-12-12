import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  UnauthorizedException,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  Patch,
  ParseIntPipe, UploadedFiles,
  Delete,
  Query
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateSpecsDto } from './dto/update-specs.dto';
import { FilterProductDto } from './dto/filter-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('search')
  async search(@Query() query: FilterProductDto){
    return this.productsService.filterProducts(query)
  }
  
  @Get()
  async findAll(@Query() query: any) {
    const page = query.page ? parseInt(query.page) : 1
    const limit = query.limit ? parseInt(query.limit) : 12
    return this.productsService.findAll(query, page, limit)
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    
    const product = await this.productsService.findOneBySlug(slug);
    if (!product) {
      throw new BadRequestException('Không tìm thấy sản phẩm');
    }
    return product;
  }
  @Get('id/:id')
  async findOneId(@Param('id') id: string) {
    
    const product = await this.productsService.findOne(+id);
    if (!product) {
      throw new BadRequestException('Không tìm thấy sản phẩm');
    }
    return product;
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          // Tạo tên file duy nhất để tránh trùng lặp
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = file.originalname.split('.').pop();
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
      },
      fileFilter: (req, file, cb) => {
        // Chỉ chấp nhận file ảnh
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException(
              'Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createProductDto: CreateProductDto,
    @Req() req: any,
  ) {
    // Kiểm tra quyền admin (role_id = 1)
    // req.user có thể là Account (có role_id) hoặc User (không có role_id)
    if (!req.user) {
      throw new UnauthorizedException(
        'Bạn cần đăng nhập để thực hiện chức năng này.',
      );
    }

    // Chỉ Account với role_id = 1 mới được phép
    if (req.user.role_id !== 1) {
      console.error('LỖI PHÂN QUYỀN: Role mong đợi là 1, nhưng nhận được:', req.user.role);
      throw new UnauthorizedException('Chỉ admin mới có quyền thêm sản phẩm.');
    }

    // Kiểm tra file
    if (!file) {
      throw new BadRequestException('Hình ảnh là bắt buộc.');
    }

    // file.path sẽ là 'uploads/ten-file.png'
    return this.productsService.create(createProductDto, file.path);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe({transform: true, whitelist: true}))
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto, @Req() req: any){
    if(req.user.role_id !== 1){
      throw new UnauthorizedException('Chỉ có quản lý mới có quyền cập nhật')
    }
    return this.productsService.update(id, updateProductDto)
  }

  @Post(':id/images')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FilesInterceptor('images', 10,{
    storage: diskStorage({destination: './uploads', filename: (req, file, cb) =>{
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, `${uniqueSuffix}-${file.originalname}`)
    }}),
    fileFilter: (req, file, cb) =>{
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(
          new BadRequestException(
            'Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)',
          ),
          false,
        );
      }
      cb(null, true);
    }
  }))
  async addImages(@Param('id', ParseIntPipe) id:number, @UploadedFiles() files: Array<Express.Multer.File>, @Req() req:any){
    if(req.user.role_id !== 1){
      throw new UnauthorizedException('Chỉ có quản lý mới có quyền thêm ảnh')
    }
    const filePaths = files.map(file => file.path)
    return this.productsService.addImages(id, filePaths)
  }
  @Patch(':id/specs')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateSpecs(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSpecsDto: UpdateSpecsDto,
    @Req() req: any,
  ) {
    if (req.user.role_id !== 1) { 
      throw new UnauthorizedException('Chỉ quản lý mới có quyền.');
    }
    return this.productsService.updateOrCreateSpecs(id, updateSpecsDto);
  }
  @Get(':id/specs')
  async findSpecs(@Param('id', ParseIntPipe) id: number){
    return this.productsService.findSpecs(id)
  }
  
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req:any){
    if(req.user.role_id !== 1){
      throw new UnauthorizedException('Chỉ quản lý mới có quyền xóa.')
    }
    return this.productsService.remove(id)
  }
  
 
}
