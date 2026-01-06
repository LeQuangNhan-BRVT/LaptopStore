import { IsString, MaxLength, IsNotEmpty, IsEmail, MinLength } from "class-validator";

export class UpdateStaffDto{
    
    @IsString({message: 'Mật khẩu phải là một chuỗi ký tự'})
    @MaxLength(255)
    password_hash?: string


}
export class ForgotPasswordDto {
    @IsNotEmpty({ message: 'Email không được để trống' })
    @IsEmail({}, { message: 'Email không đúng định dạng' })
    email: string;
  }
  
  export class ResetPasswordDto {
    @IsNotEmpty({ message: 'Token không được để trống' })
    token: string;
  
    @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
    @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    newPassword: string;
  }




