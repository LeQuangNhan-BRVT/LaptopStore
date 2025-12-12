import { Controller, Delete, Get, Post, Body, UsePipes, ValidationPipe, UseGuards, UseInterceptors, UploadedFile, Req, BadRequestException, UnauthorizedException, Param, ParseIntPipe } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBranDto } from './dto/create-brand.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  async findAll() {
    return this.brandsService.findAllBrandProduct();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('logo',{
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) =>{
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, `${uniqueSuffix}-${file.originalname}`)
      }
    }),
    fileFilter: (req, file, cb) =>{
      if(!file.mimetype.match(/\/(jpg|jpeg|png)$/)){
        return cb(new BadRequestException('Chỉ nhận file ảnh'), false)
      }
      cb(null, true)
    }
  }))

  async create(@Body() createBranDto: CreateBranDto, @UploadedFile() file: Express.Multer.File, @Req() req: any){
    if(req.user.role_id !== 1){
      throw new UnauthorizedException('Chỉ quản lý mới được quyền thêm thương hiệu')
    }
    return this.brandsService.createBrandProduct(createBranDto, file?.path)
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req:any){
    if(req.user.role_id !== 1){
      throw new UnauthorizedException('Chỉ quản lý mới có quyền xóa.')
    }
    return this.brandsService.remove(id)
  }


}
