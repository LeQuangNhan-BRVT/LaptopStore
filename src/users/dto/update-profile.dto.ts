import { IsString, IsOptional, MaxLength, IsDate } from "class-validator";

export class UpdateProfileDto{
    @IsOptional()
    @IsString({message: 'Tên phải là một chuỗi ký tự'})
    @MaxLength(150)
    full_name?: string

    @IsOptional()
    @IsString({message: 'SDT phải là một chuỗi ký tự'})
    @MaxLength(12)
    phone_number?: string

    @IsOptional()
    @IsString({message: 'Địa chỉ phải là một chuỗi ký tự'})
    address?: string

    @IsOptional()
    @IsDate()
    birthday?: Date



}




