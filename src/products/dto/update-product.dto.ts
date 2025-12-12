import { Type, Transform } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsBoolean,
  IsNotEmpty,
  IsArray,
} from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  sku?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  slug?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  sale_price?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  is_active?: boolean;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  brand_id?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  category_id?: number;

  @IsString({ each: true, message: 'Mỗi tag phải là một chuỗi ký tự' })
  @IsArray({ message: 'Tags phải là một danh sách (mảng)' })
  tags?: string[];
}
