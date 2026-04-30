import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Họ và tên là bắt buộc' })
  @IsString()
  full_name!: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsString()
  @Length(6, 255, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password!: string;

  @IsOptional()
  @Matches(/^\d{10}$/, {
    message: 'Số điện thoại không hợp lệ, phải là 10 chữ số',
  })
  phone_number?: string;
}


