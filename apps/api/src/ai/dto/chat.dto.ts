import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

function trimIfString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class ChatDto {
  @Transform(trimIfString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
