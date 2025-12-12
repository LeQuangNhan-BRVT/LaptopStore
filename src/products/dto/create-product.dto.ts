import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, Min, IsArray } from "class-validator";
import { Type, Transform } from "class-transformer";


export class CreateProductDto {
  @IsNotEmpty({ message: 'SKU là bắt buộc' })
  @IsString({ message: 'SKU phải là chuỗi' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  sku: string;

  @IsNotEmpty({ message: 'Tên sản phẩm là bắt buộc' })
  @IsString({ message: 'Tên sản phẩm phải là chuỗi' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name: string;

  @IsNotEmpty({ message: 'Brand ID là bắt buộc' })
  @IsNumber({}, { message: 'Brand ID phải là số' })
  @Type(() => Number)
  brand_id: number;

  @IsNotEmpty({ message: 'Category ID là bắt buộc' })
  @IsNumber({}, { message: 'Category ID phải là số' })
  @Type(() => Number)
  category_id: number;

  @IsNotEmpty({ message: 'Giá là bắt buộc' })
  @IsNumber({}, { message: 'Giá phải là số' })
  @Min(0, { message: 'Giá phải lớn hơn hoặc bằng 0' })
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsNumber({}, { message: 'Giá khuyến mãi phải là số' })
  @Min(0, { message: 'Giá khuyến mãi phải lớn hơn hoặc bằng 0' })
  @Type(() => Number)
  sale_price?: number | null;

  @IsNotEmpty({ message: 'Số lượng là bắt buộc' })
  @IsNumber({}, { message: 'Số lượng phải là số' })
  @Min(0, { message: 'Số lượng phải lớn hơn hoặc bằng 0' })
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  description?: string | null;

  @IsOptional()
  @IsBoolean({ message: 'is_active phải là boolean' })
  @Type(() => Boolean)
  is_active?: boolean;

  @IsString({ each: true, message: 'Mỗi tag phải là một chuỗi ký tự' })
  @IsArray({ message: 'Tags phải là một danh sách (mảng)' })
  tags?: string[];
}