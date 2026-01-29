import {
  IsArray,
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DiscountItemDto {
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

export class Step4DiscountsDto {
  @ApiProperty({
    type: [String],
    description: 'Safety details provided by the host',
    example: ['Fire extinguisher in kitchen', 'First aid kit in hallway'],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  safetyDetails: string[];

  @ApiProperty({
    description: 'Host residential country/region',
    example: 'Nigeria',
  })
  @IsNotEmpty()
  @IsString()
  hostCountry: string;

  @ApiProperty({
    description: 'Host residential street address',
    example: '12 Ademola Street',
  })
  @IsNotEmpty()
  @IsString()
  hostStreetAddress: string;

  @ApiProperty({
    description: 'Apartment, floor, or building (if applicable)',
    example: 'Apt 3B',
    required: false,
  })
  @IsOptional()
  @IsString()
  hostAptFloor?: string;

  @ApiProperty({
    description: 'Host residential city / town / village',
    example: 'Lagos',
  })
  @IsNotEmpty()
  @IsString()
  hostCity: string;

  @ApiProperty({
    description: 'Host residential province / state / territory (if applicable)',
    example: 'Lagos',
  })
  @IsNotEmpty()
  @IsString()
  hostState: string;

  @ApiProperty({
    description: 'Host residential postal code (if applicable)',
    example: '100001',
    required: false,
  })
  @IsOptional()
  @IsString()
  hostPostalCode?: string;

  @ApiProperty({
    description: 'Is the host hosting as a business?',
    example: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  hostingAsBusiness: boolean;

  @ApiProperty({
    type: [DiscountItemDto],
    description: 'Array of discounts to create for this listing',
    example: [
      {
        name: 'Weekly Stay Discount',
        description: 'Get 10% off for stays of 7 days or more',
        discountPercentage: 10,
        isActive: true,
      },
      {
        name: 'Monthly Stay Discount',
        description: 'Get 25% off for stays of 28 days or more',
        discountPercentage: 25,
        isActive: true,
      },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiscountItemDto)
  discounts?: DiscountItemDto[];
}
