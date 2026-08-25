import { Transform, TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

function trimIfString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateSearchHistoryDto {
  @Transform(trimIfString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  query: string;
}
