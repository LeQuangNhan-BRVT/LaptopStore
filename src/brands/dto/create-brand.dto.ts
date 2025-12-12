import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class CreateBranDto {
    @IsNotEmpty({message: 'Tên thương hiệu là bắt buộc'})
    @Length(1, 100, {message: 'Tối đa tên thương hiệu là 100 ký tự' })
    @IsString()
    name: string;

}