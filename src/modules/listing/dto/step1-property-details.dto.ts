import {
  IsEnum,
  IsString,
  IsInt,
  IsBoolean,
  IsNotEmpty,
  Min,
  Max,
  IsNumber,
  IsIn,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PropertyCategory, PlaceType, BathroomUsage } from '../enums';

export class Step1PropertyDetailsDto {
  @ApiProperty({
    enum: PropertyCategory,
    description: 'Category of the property',
    example: PropertyCategory.APARTMENT,
  })
  @IsNotEmpty()
  @IsEnum(PropertyCategory, {
    message: `category must be one of: ${Object.values(PropertyCategory).join(', ')}`,
  })
  category: PropertyCategory;

  @ApiProperty({
    enum: PlaceType,
    description: 'Type of place',
    example: PlaceType.ROOM,
  })
  @IsNotEmpty()
  @IsEnum(PlaceType, {
    message: `placeType must be one of: ${Object.values(PlaceType).join(', ')}`,
  })
  placeType: PlaceType;

  // Address fields
  @ApiProperty({
    description: 'Country',
    example: 'United States',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  country: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 Main Street',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  streetAddress: string;

  @ApiProperty({
    description: 'Floor number or level',
    example: '3rd Floor',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  floor?: string;

  @ApiProperty({
    description: 'City',
    example: 'New York',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({
    description: 'State or province',
    example: 'NY',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  state: string;

  @ApiProperty({
    description: 'Postal code',
    example: '10001',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  postalCode: string;

  // Capacity
  @ApiProperty({
    description: 'Number of guests allowed (must be > 0)',
    example: 4,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'guests must be greater than 0' })
  guests: number;

  @ApiProperty({
    description: 'Number of bedrooms (must be >= 0)',
    example: 2,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'bedrooms must be 0 or greater' })
  bedrooms: number;

  @ApiProperty({
    description: 'Number of beds (must be >= 0)',
    example: 3,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'beds must be 0 or greater' })
  beds: number;

  // Property flags
  @ApiProperty({
    description: 'Is the home location precise?',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  homePrecise: boolean;

  @ApiProperty({
    description: 'Does the bedroom have a lock?',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  bedroomLock: boolean;

  // Bathroom distribution (only 0, 0.5, 1 allowed)
  @ApiProperty({
    description: 'Private bathroom count (allowed: 0, 0.5, 1)',
    example: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsIn([0, 0.5, 1], { message: 'privateBathroom must be 0, 0.5, or 1' })
  privateBathroom: number;

  @ApiProperty({
    description: 'Dedicated bathroom count (allowed: 0, 0.5, 1)',
    example: 0,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsIn([0, 0.5, 1], { message: 'dedicatedBathroom must be 0, 0.5, or 1' })
  dedicatedBathroom: number;

  @ApiProperty({
    description: 'Shared bathroom count (allowed: 0, 0.5, 1)',
    example: 0.5,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsIn([0, 0.5, 1], { message: 'sharedBathroom must be 0, 0.5, or 1' })
  sharedBathroom: number;

  @ApiProperty({
    enum: BathroomUsage,
    description: 'Who uses the bathroom',
    example: BathroomUsage.OTHER_GUESTS,
  })
  @IsNotEmpty()
  @IsEnum(BathroomUsage, {
    message: `bathroomUsage must be one of: ${Object.values(BathroomUsage).join(', ')}`,
  })
  bathroomUsage: BathroomUsage;
}
