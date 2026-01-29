import {
  IsEnum,
  IsString,
  IsArray,
  IsNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FavoriteAmenity, Amenity, SafetyItem, Highlight } from '../enums';

export class PhotoDto {
  @ApiProperty({
    description: 'Cloudinary public ID',
    example: 'listings/abc123',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  publicId: string;

  @ApiProperty({
    description: 'Cloudinary secure URL',
    example: 'https://res.cloudinary.com/demo/image/upload/v1/listings/abc123',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  secureUrl: string;
}

export class Step2AmenitiesMediaDto {
  @ApiProperty({
    enum: FavoriteAmenity,
    isArray: true,
    description: 'List of favorite amenities',
    example: [FavoriteAmenity.WIFI, FavoriteAmenity.TV],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(FavoriteAmenity, {
    each: true,
    message: `Each favorite must be one of: ${Object.values(FavoriteAmenity).join(', ')}`,
  })
  favorites?: FavoriteAmenity[];

  @ApiProperty({
    enum: Amenity,
    isArray: true,
    description: 'List of amenities',
    example: [Amenity.POOL, Amenity.HOT_TUB],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Amenity, {
    each: true,
    message: `Each amenity must be one of: ${Object.values(Amenity).join(', ')}`,
  })
  amenities?: Amenity[];

  @ApiProperty({
    enum: SafetyItem,
    isArray: true,
    description: 'List of safety items',
    example: [SafetyItem.SMOKE_ALARM, SafetyItem.FIRST_AID],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SafetyItem, {
    each: true,
    message: `Each safety item must be one of: ${Object.values(SafetyItem).join(', ')}`,
  })
  safetyItems?: SafetyItem[];

  @ApiProperty({
    type: [PhotoDto],
    description: 'Photos (max 5)',
    example: [
      {
        publicId: 'listings/abc123',
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/listings/abc123',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: 'Maximum 5 photos allowed' })
  @ValidateNested({ each: true })
  @Type(() => PhotoDto)
  photos?: PhotoDto[];

  @ApiProperty({
    description: 'Listing title',
    example: 'Cozy Apartment in Downtown',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    enum: Highlight,
    isArray: true,
    description: 'Listing highlights (minimum 2 required)',
    example: [Highlight.CHARMING, Highlight.CENTRAL],
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(2, { message: 'At least 2 highlights are required' })
  @IsEnum(Highlight, {
    each: true,
    message: `Each highlight must be one of: ${Object.values(Highlight).join(', ')}`,
  })
  highlights: Highlight[];

  @ApiProperty({
    description: 'Listing description',
    example: 'A beautiful apartment located in the heart of the city...',
  })
  @IsNotEmpty()
  @IsString()
  description: string;
}
