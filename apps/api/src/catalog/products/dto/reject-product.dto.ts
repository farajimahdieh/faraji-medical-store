import { IsNotEmpty, IsString } from 'class-validator';

export class RejectProductDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
