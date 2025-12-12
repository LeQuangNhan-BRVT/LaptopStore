import { IsString, IsNumber, IsOptional, IsDecimal, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateSpecsDto {
  @IsString({ message: 'CPU phải là chuỗi ký tự.' }) @IsOptional() @MaxLength(255) @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) cpu?: string;
  @IsString({ message: 'RAM phải là chuỗi ký tự.' }) @IsOptional() @MaxLength(255) @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) ram?: string;
  @IsString({ message: 'Ổ cứng phải là chuỗi ký tự.' }) @IsOptional() @MaxLength(255) @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) storage?: string;
  @IsString({ message: 'GPU phải là chuỗi ký tự.' }) @IsOptional() @MaxLength(255) @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) gpu?: string;
  @IsString({ message: 'Màn hình phải là chuỗi ký tự.' }) @IsOptional() @MaxLength(255) @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) screen?: string;
  @IsString({ message: 'HĐH phải là chuỗi ký tự.' }) @IsOptional() @MaxLength(100) @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) os?: string;
  @IsString({ message: 'Pin phải là chuỗi ký tự.' }) @IsOptional() @MaxLength(100) @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) pin?: string;

  @IsNumber()
  @Type(() => Number) // Dùng cho 'transform: true'
  @IsOptional()
  weight?: number;

}