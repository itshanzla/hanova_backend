import { IsEnum, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BookingSetting } from '../enums';

export class Step3BookingPricingDto {
  @ApiProperty({
    enum: BookingSetting,
    description: 'Booking setting',
    example: BookingSetting.INSTANT_BOOK,
  })
  @IsNotEmpty()
  @IsEnum(BookingSetting, {
    message: `bookingSetting must be one of: ${Object.values(BookingSetting).join(', ')}`,
  })
  bookingSetting: BookingSetting;

  @ApiProperty({
    description: 'Price per weekday night (Monday to Thursday)',
    example: 100.0,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'weekdayPrice must be 0 or greater' })
  weekdayPrice: number;

  @ApiProperty({
    description: 'Price per weekend night (Friday to Sunday)',
    example: 120.0,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'weekendPrice must be 0 or greater' })
  weekendPrice: number;

  @ApiProperty({
    description: 'After-tax price per weekday night (Monday to Thursday)',
    example: 110.0,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'weekdayAfterTaxPrice must be 0 or greater' })
  weekdayAfterTaxPrice: number;

  @ApiProperty({
    description: 'After-tax price per weekend night (Friday to Sunday)',
    example: 132.0,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'weekendAfterTaxPrice must be 0 or greater' })
  weekendAfterTaxPrice: number;
}
