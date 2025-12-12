import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FilterProductDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  // ⚠️ Logic này giúp chuyển chuỗi rỗng thành undefined để không bị lỗi Validation
  @Transform(({ value }) => {
    if (value === '' || value === null) return undefined;
    return Number(value);
  })
  @IsNumber()
  @Min(0)
  min_price?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null) return undefined;
    return Number(value);
  })
  @IsNumber()
  @Min(0)
  max_price?: number;

  @IsOptional()
  sort_by?: string;

  @IsOptional()
  ram?: string;

  @IsOptional()
  cpu?: string;

  @IsOptional()
  storage?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}