import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe, ParseIntPipe, UnauthorizedException, Req } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe({transform: true}))
  async create(@Body() createCategoryDto: CreateCategoryDto){
    return this.categoriesService.create(createCategoryDto)
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req:any){
    if(req.user.role_id !== 1){
      throw new UnauthorizedException('Chỉ quản lý mới có quyền xóa.')
    }
    return this.categoriesService.remove(id)
  }
}
