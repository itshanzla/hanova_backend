import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PropertyCategory,
  PlaceType,
  BathroomUsage,
  FavoriteAmenity,
  Amenity,
  SafetyItem,
  Highlight,
  BookingSetting,
  ListingStatus,
} from '../enums';

// =====================
// Photo Response Schema
// =====================
export class PhotoResponseDto {
  @ApiProperty({
    description: 'Photo UUID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Cloudinary public ID',
    example: 'listings/abc123xyz',
  })
  publicId: string;

  @ApiProperty({
    description: 'Cloudinary secure URL',
    example: 'https://res.cloudinary.com/demo/image/upload/v1/listings/abc123xyz.jpg',
  })
  secureUrl: string;

  @ApiProperty({
    description: 'Display order',
    example: 0,
  })
  order: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;
}

// =====================
// Discount Response Schema
// =====================
export class DiscountResponseDto {
  @ApiProperty({
    description: 'Discount UUID',
    example: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  })
  id: string;

  @ApiProperty({
    description: 'Discount name',
    example: 'Weekly Stay Discount',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Discount description',
    example: 'Get 10% off for stays of 7 days or more',
  })
  description?: string;

  @ApiProperty({
    description: 'Discount percentage (0-100)',
    example: 10,
  })
  discountPercentage: number;

  @ApiProperty({
    description: 'Whether the discount is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}

// =====================
// Listing Response Schema
// =====================
export class ListingResponseDto {
  @ApiProperty({
    description: 'Listing UUID',
    example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
  })
  id: string;

  // Step 1 Fields
  @ApiPropertyOptional({
    enum: PropertyCategory,
    description: 'Property category',
    example: PropertyCategory.APARTMENT,
  })
  category?: PropertyCategory;

  @ApiPropertyOptional({
    enum: PlaceType,
    description: 'Place type',
    example: PlaceType.ROOM,
  })
  placeType?: PlaceType;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'United States',
  })
  country?: string;

  @ApiPropertyOptional({
    description: 'Street address',
    example: '123 Main Street, Apt 4B',
  })
  streetAddress?: string;

  @ApiPropertyOptional({
    description: 'Floor',
    example: '3rd Floor',
  })
  floor?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'New York',
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'State/Province',
    example: 'NY',
  })
  state?: string;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '10001',
  })
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Maximum guests',
    example: 4,
  })
  guests?: number;

  @ApiPropertyOptional({
    description: 'Number of bedrooms',
    example: 2,
  })
  bedrooms?: number;

  @ApiPropertyOptional({
    description: 'Number of beds',
    example: 3,
  })
  beds?: number;

  @ApiProperty({
    description: 'Is location precise',
    example: true,
  })
  homePrecise: boolean;

  @ApiProperty({
    description: 'Does bedroom have a lock',
    example: true,
  })
  bedroomLock: boolean;

  @ApiPropertyOptional({
    description: 'Private bathroom count (0, 0.5, or 1)',
    example: 1,
  })
  privateBathroom?: number;

  @ApiPropertyOptional({
    description: 'Dedicated bathroom count (0, 0.5, or 1)',
    example: 0,
  })
  dedicatedBathroom?: number;

  @ApiPropertyOptional({
    description: 'Shared bathroom count (0, 0.5, or 1)',
    example: 0.5,
  })
  sharedBathroom?: number;

  @ApiPropertyOptional({
    enum: BathroomUsage,
    description: 'Bathroom usage type',
    example: BathroomUsage.OTHER_GUESTS,
  })
  bathroomUsage?: BathroomUsage;

  // Step 2 Fields
  @ApiPropertyOptional({
    enum: FavoriteAmenity,
    isArray: true,
    description: 'Favorite amenities',
    example: [FavoriteAmenity.WIFI, FavoriteAmenity.TV, FavoriteAmenity.KITCHEN],
  })
  favorites?: FavoriteAmenity[];

  @ApiPropertyOptional({
    enum: Amenity,
    isArray: true,
    description: 'Additional amenities',
    example: [Amenity.POOL, Amenity.HOT_TUB],
  })
  amenities?: Amenity[];

  @ApiPropertyOptional({
    enum: SafetyItem,
    isArray: true,
    description: 'Safety items',
    example: [SafetyItem.SMOKE_ALARM, SafetyItem.FIRST_AID],
  })
  safetyItems?: SafetyItem[];

  @ApiPropertyOptional({
    description: 'Listing photos (max 5)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        publicId: { type: 'string', example: 'listings/abc123xyz' },
        secureUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1/listings/abc123xyz.jpg' },
        order: { type: 'number', example: 0 },
        createdAt: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
      },
    },
  })
  photos?: PhotoResponseDto[];

  @ApiPropertyOptional({
    description: 'Listing title',
    example: 'Cozy Downtown Apartment with City Views',
  })
  title?: string;

  @ApiPropertyOptional({
    enum: Highlight,
    isArray: true,
    description: 'Listing highlights (minimum 2)',
    example: [Highlight.CHARMING, Highlight.CENTRAL, Highlight.STYLISH],
  })
  highlights?: Highlight[];

  @ApiPropertyOptional({
    description: 'Listing description',
    example: 'Experience urban living at its finest in this beautifully decorated apartment...',
  })
  description?: string;

  // Step 3 Fields
  @ApiPropertyOptional({
    enum: BookingSetting,
    description: 'Booking setting',
    example: BookingSetting.INSTANT_BOOK,
  })
  bookingSetting?: BookingSetting;

  @ApiPropertyOptional({
    description: 'Price per weekday night',
    example: 150.0,
  })
  weekdayPrice?: number;

  @ApiPropertyOptional({
    description: 'Price per weekend night',
    example: 180.0,
  })
  weekendPrice?: number;

  @ApiPropertyOptional({
    description: 'Calculated weekend charge percentage (not stored)',
    example: 20.0,
  })
  weekendChargePercentage?: number;

  // Step 4 Fields
  @ApiPropertyOptional({
    description: 'Applied discounts',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'b2c3d4e5-f6a7-8901-bcde-f23456789012' },
        name: { type: 'string', example: 'Weekly Stay Discount' },
        description: { type: 'string', example: 'Get 10% off for stays of 7 days or more' },
        discountPercentage: { type: 'number', example: 10 },
        isActive: { type: 'boolean', example: true },
      },
    },
  })
  discounts?: DiscountResponseDto[];

  // Status Fields
  @ApiProperty({
    enum: ListingStatus,
    description: 'Listing status',
    example: ListingStatus.DRAFT,
  })
  status: ListingStatus;

  @ApiProperty({
    description: 'Step 1 completion status',
    example: true,
  })
  step1Completed: boolean;

  @ApiProperty({
    description: 'Step 2 completion status',
    example: true,
  })
  step2Completed: boolean;

  @ApiProperty({
    description: 'Step 3 completion status',
    example: false,
  })
  step3Completed: boolean;

  @ApiProperty({
    description: 'Step 4 completion status',
    example: false,
  })
  step4Completed: boolean;

  @ApiProperty({
    description: 'Host user ID',
    example: 'd4e5f6a7-b8c9-0123-def4-567890123456',
  })
  hostId: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}

// =====================
// Example Response Objects (for schema property in ApiResponse)
// =====================
export const LISTING_RESPONSE_EXAMPLE = {
  status: 200,
  response: 'OK',
  message: 'Listing retrieved successfully',
  data: {
    id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    category: 'apartment',
    placeType: 'room',
    country: 'United States',
    streetAddress: '123 Main Street, Apt 4B',
    floor: '4th Floor',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    guests: 4,
    bedrooms: 2,
    beds: 3,
    homePrecise: true,
    bedroomLock: true,
    privateBathroom: 1,
    dedicatedBathroom: 0,
    sharedBathroom: 0,
    bathroomUsage: 'other_guests',
    favorites: ['wifi', 'tv', 'kitchen'],
    amenities: ['pool', 'hot_tub'],
    safetyItems: ['smoke_alarm', 'first_aid'],
    photos: [
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        publicId: 'listings/living-room-abc123',
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/listings/living-room-abc123.jpg',
        order: 0,
        createdAt: '2024-01-15T10:30:00.000Z',
      },
    ],
    title: 'Cozy Downtown Apartment with City Views',
    highlights: ['charming', 'central', 'stylish'],
    description: 'Experience urban living at its finest...',
    bookingSetting: 'instant_book',
    weekdayPrice: 150.0,
    weekendPrice: 180.0,
    weekendChargePercentage: 20.0,
    discounts: [],
    status: 'published',
    step1Completed: true,
    step2Completed: true,
    step3Completed: true,
    step4Completed: true,
    hostId: 'd4e5f6a7-b8c9-0123-def4-567890123456',
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-01-15T10:30:00.000Z',
  },
};

export const LISTING_ARRAY_RESPONSE_EXAMPLE = {
  status: 200,
  response: 'OK',
  message: 'Listings retrieved successfully',
  data: [LISTING_RESPONSE_EXAMPLE.data],
};

export const DRAFT_LISTING_RESPONSE_EXAMPLE = {
  status: 201,
  response: 'Created',
  message: 'Draft listing created',
  data: {
    id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    status: 'draft',
    step1Completed: false,
    step2Completed: false,
    step3Completed: false,
    step4Completed: false,
    hostId: 'd4e5f6a7-b8c9-0123-def4-567890123456',
    homePrecise: false,
    bedroomLock: false,
    photos: [],
    discounts: [],
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-01-15T10:30:00.000Z',
  },
};

export const DISCOUNT_RESPONSE_EXAMPLE = {
  status: 200,
  response: 'OK',
  message: 'Discount retrieved successfully',
  data: {
    id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Weekly Stay Discount',
    description: 'Get 10% off for stays of 7 days or more',
    discountPercentage: 10,
    isActive: true,
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-01-15T10:30:00.000Z',
  },
};

export const DISCOUNT_ARRAY_RESPONSE_EXAMPLE = {
  status: 200,
  response: 'OK',
  message: 'Discounts retrieved successfully',
  data: [DISCOUNT_RESPONSE_EXAMPLE.data],
};

export const DELETE_RESPONSE_EXAMPLE = {
  status: 200,
  response: 'OK',
  message: 'Resource deleted successfully',
  data: null,
};
