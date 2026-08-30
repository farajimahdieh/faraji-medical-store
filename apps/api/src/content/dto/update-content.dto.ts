import { IsString } from 'class-validator';

export class UpdateContentDto {
  @IsString()
  title: string;

  @IsString()
  body: string;
}
