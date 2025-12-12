import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsNumber()
  product_id: number;

  @IsNumber()
  quantity: number;
}

export class CreateOrderDto {
  @IsString({message:"Địa chỉ giao hàng là chuỗi ký tự"})
  @IsNotEmpty({message: 'Địa chỉ giao hàng không được để trống'})
  shipping_address: string;

  @IsNumber()
  payment_method_id: number;

  @IsNumber()
  @IsOptional()
  discount_id?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  shipping_fee: number; // Phí ship tính từ GHN ở frontend

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[]; 
}