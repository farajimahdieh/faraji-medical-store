import { ArrayNotEmpty, IsUUID } from 'class-validator';

export class ReorderProductImagesDto {
  @IsUUID('4', { each: true })
  @ArrayNotEmpty()
  orderedImageIds: string[];
}
