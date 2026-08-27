import { IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginPasswordDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
