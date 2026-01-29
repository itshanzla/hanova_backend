import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDiscountDto {
  @ApiProperty({
    description: 'Discount name',
    example: 'Weekly Stay Discount',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Discount description',
    example: 'Get 10% off for stays of 7 days or more',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Discount percentage (0-100)',
    example: 10,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'discountPercentage must be at least 0' })
  @Max(100, { message: 'discountPercentage cannot exceed 100' })
  discountPercentage: number;

  @ApiProperty({
    description: 'Is the discount active?',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDiscountDto extends PartialType(CreateDiscountDto) {}
