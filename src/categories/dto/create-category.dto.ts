import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Tên danh mục là bắt buộc' })
  @Length(1, 100, { message: 'Tối đa tên danh mục là 100 ký tự' })
  @IsString()
  name: string;

  @IsString()
  @IsOptional() // Cho phép 'description' được để trống
  description?: string;
}
