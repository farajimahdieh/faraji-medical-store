import { Transform, TransformFnParams } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

function trimIfString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpdateWishlistNoteDto {
  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MaxLength(500)
  // Plain text only — reject anything that looks like an HTML/markup tag
  // rather than trying to sanitize it.
  @Matches(/^[^<>]*$/, { message: 'یادداشت نباید حاوی HTML باشد' })
  note?: string | null;
}
