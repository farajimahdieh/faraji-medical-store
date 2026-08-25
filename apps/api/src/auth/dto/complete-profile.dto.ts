import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CompleteProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  // Optional. Date-only ('YYYY-MM-DD'), never mandatory to complete signup.
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'تاریخ تولد باید به فرم YYYY-MM-DD باشد',
  })
  @IsDateString({ strict: true }, { message: 'تاریخ تولد نامعتبر است' })
  birthDate?: string;
}
