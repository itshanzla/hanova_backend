import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  LISTING_RESPONSE_EXAMPLE,
  LISTING_ARRAY_RESPONSE_EXAMPLE,
  DRAFT_LISTING_RESPONSE_EXAMPLE,
  DISCOUNT_RESPONSE_EXAMPLE,
  DISCOUNT_ARRAY_RESPONSE_EXAMPLE,
  DELETE_RESPONSE_EXAMPLE,
} from './response-schemas';
import {
  ValidationErrorResponse,
  UnauthorizedErrorResponse,
  ForbiddenErrorResponse,
  NotFoundErrorResponse,
  BadRequestErrorResponse,
  InvalidDiscountIdsErrorResponse,
} from './error-schemas';
import {
  Step1PropertyDetailsDto,
  Step2AmenitiesMediaDto,
  Step3BookingPricingDto,
  Step4DiscountsDto,
  CreateDiscountDto,
  UpdateDiscountDto,
} from '../dto';

// =====================
// Common Error Responses
// =====================
const CommonAuthErrors = [
  ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid JWT token',
    type: UnauthorizedErrorResponse,
  }),
];

const CommonHostErrors = [
  ...CommonAuthErrors,
  ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have HOST role or does not own the resource',
    type: ForbiddenErrorResponse,
  }),
];

const CommonAdminErrors = [
  ...CommonAuthErrors,
  ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have ADMIN role',
    type: ForbiddenErrorResponse,
  }),
];

// =====================
// Listing Controller Decorators
// =====================

export function ApiCreateDraft() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Create a new draft listing',
      description: 'Creates a new listing in DRAFT status. The host can then fill in details using step APIs.',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Draft listing created successfully',
      schema: { example: DRAFT_LISTING_RESPONSE_EXAMPLE },
    }),
    ...CommonHostErrors,
  );
}

export function ApiGetMyListings() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all listings for current host',
      description: 'Returns all listings owned by the authenticated host, including drafts.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Listings retrieved successfully',
      schema: { example: LISTING_ARRAY_RESPONSE_EXAMPLE },
    }),
    ...CommonHostErrors,
  );
}

export function ApiGetMyListing() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get a specific listing',
      description: 'Returns details of a listing owned by the authenticated host.',
    }),
    ApiParam({
      name: 'id',
      description: 'Listing UUID',
      example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Listing retrieved successfully',
      schema: { example: LISTING_RESPONSE_EXAMPLE },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Listing not found',
      type: NotFoundErrorResponse,
    }),
    ...CommonHostErrors,
  );
}

export function ApiUpdateStep1() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update Step 1: Property Details',
      description: `Updates property details for a listing. Required fields include:
- Category (31 property types available)
- Place type (room or shared_room)
- Address (country, street, city, state, postal code)
- Capacity (guests > 0, bedrooms >= 0, beds >= 0)
- Property flags (home_precise, bedroom_lock)
- Bathroom distribution (values must be 0, 0.5, or 1)
- Bathroom usage`,
    }),
    ApiParam({
      name: 'id',
      description: 'Listing UUID',
      example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    }),
    ApiBody({
      type: Step1PropertyDetailsDto,
      description: 'Property details',
      examples: {
        apartment: {
          summary: 'Apartment Example',
          value: {
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
          },
        },
        cabin: {
          summary: 'Cabin Example',
          value: {
            category: 'cabin',
            placeType: 'shared_room',
            country: 'Canada',
            streetAddress: '456 Forest Road',
            city: 'Banff',
            state: 'Alberta',
            postalCode: 'T1L 1A1',
            guests: 6,
            bedrooms: 3,
            beds: 4,
            homePrecise: false,
            bedroomLock: false,
            privateBathroom: 0.5,
            dedicatedBathroom: 0.5,
            sharedBathroom: 1,
            bathroomUsage: 'my_family',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Step 1 updated successfully',
      schema: { example: LISTING_RESPONSE_EXAMPLE },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: ValidationErrorResponse,
      schema: {
        example: {
          message: [
            'category must be one of: house, apartment, barn, breakfast, boat, cabin, camper, casa_particular, castle, cave, container, cycladic_home, dammuso, dome, earth_home, farm, guest_house, hotel, houseboat, kazhan, minsu, riad, ryokan, shepherd, tent, tiny_home, tower, treehouse, trullo, windmill, yurt',
            'guests must be greater than 0',
            'privateBathroom must be 0, 0.5, or 1',
          ],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Listing not found',
      type: NotFoundErrorResponse,
    }),
    ...CommonHostErrors,
  );
}

export function ApiUpdateStep2() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update Step 2: Amenities, Safety & Media',
      description: `Updates amenities, safety items, photos, and listing content. Constraints:
- Photos: Maximum 5 images (upload via Cloudinary first)
- Highlights: Minimum 2 selections required
- Title: Required, max 100 characters
- Description: Required`,
    }),
    ApiParam({
      name: 'id',
      description: 'Listing UUID',
      example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    }),
    ApiBody({
      type: Step2AmenitiesMediaDto,
      description: 'Amenities and media details',
      examples: {
        full: {
          summary: 'Full Example',
          value: {
            favorites: ['wifi', 'tv', 'kitchen', 'washer', 'air_conditioning'],
            amenities: ['pool', 'hot_tub', 'patio', 'bbq_grill'],
            safetyItems: ['smoke_alarm', 'first_aid', 'fire_extinguisher'],
            photos: [
              {
                publicId: 'listings/living-room-abc123',
                secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/listings/living-room-abc123.jpg',
              },
              {
                publicId: 'listings/bedroom-def456',
                secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/listings/bedroom-def456.jpg',
              },
            ],
            title: 'Stunning Downtown Apartment with Amazing City Views',
            highlights: ['charming', 'central', 'stylish'],
            description: 'Experience urban living at its finest in this beautifully decorated apartment. Located in the heart of downtown, you will have easy access to restaurants, shops, and entertainment.',
          },
        },
        minimal: {
          summary: 'Minimal Example',
          value: {
            title: 'Cozy Room in Quiet Neighborhood',
            highlights: ['charming', 'unique'],
            description: 'A peaceful retreat perfect for solo travelers or couples looking to explore the city.',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Step 2 updated successfully',
      schema: { example: LISTING_RESPONSE_EXAMPLE },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      schema: {
        example: {
          message: [
            'At least 2 highlights are required',
            'Maximum 5 photos allowed',
            'Each highlight must be one of: charming, hip, stylish, upscale, central, unique',
          ],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Listing not found',
      type: NotFoundErrorResponse,
    }),
    ...CommonHostErrors,
  );
}

export function ApiUpdateStep3() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update Step 3: Booking & Pricing',
      description: `Updates booking settings and pricing. Notes:
- weekend_charge_percentage is calculated dynamically from weekday and weekend prices (NOT stored)
- Both prices must be >= 0`,
    }),
    ApiParam({
      name: 'id',
      description: 'Listing UUID',
      example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    }),
    ApiBody({
      type: Step3BookingPricingDto,
      description: 'Booking and pricing details',
      examples: {
        instantBook: {
          summary: 'Instant Book',
          value: {
            bookingSetting: 'instant_book',
            weekdayPrice: 150.00,
            weekendPrice: 180.00,
          },
        },
        approvalRequired: {
          summary: 'Approval Required',
          value: {
            bookingSetting: 'approve_before_booking',
            weekdayPrice: 200.00,
            weekendPrice: 250.00,
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Step 3 updated successfully',
      schema: { example: LISTING_RESPONSE_EXAMPLE },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      schema: {
        example: {
          message: [
            'bookingSetting must be one of: instant_book, approve_before_booking',
            'weekdayPrice must be 0 or greater',
          ],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Listing not found',
      type: NotFoundErrorResponse,
    }),
    ...CommonHostErrors,
  );
}

export function ApiUpdateStep4() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update Step 4: Discounts',
      description: `Associates discounts with the listing. Rules:
- Discounts are managed by admins only
- All provided discount IDs must exist and be active
- Empty array removes all discounts`,
    }),
    ApiParam({
      name: 'id',
      description: 'Listing UUID',
      example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    }),
    ApiBody({
      type: Step4DiscountsDto,
      description: 'Discount IDs to apply',
      examples: {
        withDiscounts: {
          summary: 'Apply Discounts',
          value: {
            discountIds: [
              'b2c3d4e5-f6a7-4901-bcde-f23456789012',
              'e5f6a7b8-c9d0-4234-ef56-789012345678',
            ],
          },
        },
        noDiscounts: {
          summary: 'Remove All Discounts',
          value: {
            discountIds: [],
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Step 4 updated successfully',
      schema: { example: LISTING_RESPONSE_EXAMPLE },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid or inactive discount IDs',
      type: InvalidDiscountIdsErrorResponse,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Listing not found',
      type: NotFoundErrorResponse,
    }),
    ...CommonHostErrors,
  );
}

export function ApiPublishListing() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Publish a listing',
      description: `Publishes a listing (makes it visible to users). Requirements:
- Step 1 (Property Details) must be completed
- Step 2 (Amenities & Media) must be completed
- Step 3 (Booking & Pricing) must be completed
- Step 4 (Discounts) is optional`,
    }),
    ApiParam({
      name: 'id',
      description: 'Listing UUID',
      example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Listing published successfully',
      schema: { example: { ...LISTING_RESPONSE_EXAMPLE, data: { ...LISTING_RESPONSE_EXAMPLE.data, status: 'published' } } },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Cannot publish - incomplete steps',
      type: BadRequestErrorResponse,
      schema: {
        example: {
          message: 'Cannot publish listing. Incomplete steps: Step 1 (Property Details), Step 3 (Booking & Pricing)',
          error: 'Bad Request',
          statusCode: 400,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Listing not found',
      type: NotFoundErrorResponse,
    }),
    ...CommonHostErrors,
  );
}

export function ApiUnpublishListing() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Unpublish a listing',
      description: 'Converts a published listing back to draft status.',
    }),
    ApiParam({
      name: 'id',
      description: 'Listing UUID',
      example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Listing unpublished successfully',
      schema: { example: { ...LISTING_RESPONSE_EXAMPLE, data: { ...LISTING_RESPONSE_EXAMPLE.data, status: 'draft' } } },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Listing not found',
      type: NotFoundErrorResponse,
    }),
    ...CommonHostErrors,
  );
}

export function ApiDeleteListing() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Delete a listing',
      description: 'Permanently deletes a listing and all associated data (photos, discount associations).',
    }),
    ApiParam({
      name: 'id',
      description: 'Listing UUID',
      example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Listing deleted successfully',
      schema: { example: DELETE_RESPONSE_EXAMPLE },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Listing not found',
      type: NotFoundErrorResponse,
    }),
    ...CommonHostErrors,
  );
}

export function ApiGetAvailableDiscounts() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all active discounts',
      description: 'Returns all active discounts that hosts can apply to their listings.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Active discounts retrieved',
      schema: { example: DISCOUNT_ARRAY_RESPONSE_EXAMPLE },
    }),
    ...CommonHostErrors,
  );
}

// =====================
// Admin Controller Decorators
// =====================

export function ApiAdminGetAllListings() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all listings (Admin)',
      description: 'Returns all listings in the system, including drafts from all hosts.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'All listings retrieved',
      schema: { example: LISTING_ARRAY_RESPONSE_EXAMPLE },
    }),
    ...CommonAdminErrors,
  );
}

export function ApiAdminGetListing() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get any listing by ID (Admin)',
      description: 'Returns details of any listing regardless of owner or status.',
    }),
    ApiParam({
      name: 'id',
      description: 'Listing UUID',
      example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Listing retrieved',
      schema: { example: LISTING_RESPONSE_EXAMPLE },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Listing not found',
      type: NotFoundErrorResponse,
    }),
    ...CommonAdminErrors,
  );
}

export function ApiCreateDiscount() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Create a new discount (Admin)',
      description: 'Creates a new discount that hosts can apply to their listings.',
    }),
    ApiBody({
      type: CreateDiscountDto,
      description: 'Discount details',
      examples: {
        weekly: {
          summary: 'Weekly Discount',
          value: {
            name: 'Weekly Stay Discount',
            description: 'Get 10% off for stays of 7 days or more',
            discountPercentage: 10,
            isActive: true,
          },
        },
        monthly: {
          summary: 'Monthly Discount',
          value: {
            name: 'Monthly Stay Discount',
            description: 'Get 25% off for stays of 28 days or more',
            discountPercentage: 25,
            isActive: true,
          },
        },
        newListing: {
          summary: 'New Listing Discount',
          value: {
            name: 'New Listing Special',
            description: 'Special discount for new listings to attract first guests',
            discountPercentage: 20,
            isActive: true,
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Discount created successfully',
      schema: {
        example: {
          ...DISCOUNT_RESPONSE_EXAMPLE,
          status: 201,
          response: 'Created',
          message: 'Discount created',
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      schema: {
        example: {
          message: [
            'discountPercentage must be at least 0',
            'discountPercentage cannot exceed 100',
          ],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
    }),
    ...CommonAdminErrors,
  );
}

export function ApiGetAllDiscounts() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all discounts (Admin)',
      description: 'Returns all discounts including inactive ones.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'All discounts retrieved',
      schema: { example: DISCOUNT_ARRAY_RESPONSE_EXAMPLE },
    }),
    ...CommonAdminErrors,
  );
}

export function ApiGetDiscount() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get a specific discount (Admin)',
      description: 'Returns details of a specific discount.',
    }),
    ApiParam({
      name: 'id',
      description: 'Discount UUID',
      example: 'b2c3d4e5-f6a7-4901-bcde-f23456789012',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Discount retrieved',
      schema: { example: DISCOUNT_RESPONSE_EXAMPLE },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Discount not found',
      type: NotFoundErrorResponse,
    }),
    ...CommonAdminErrors,
  );
}

export function ApiUpdateDiscount() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update a discount (Admin)',
      description: 'Updates an existing discount. All fields are optional.',
    }),
    ApiParam({
      name: 'id',
      description: 'Discount UUID',
      example: 'b2c3d4e5-f6a7-4901-bcde-f23456789012',
    }),
    ApiBody({
      type: UpdateDiscountDto,
      description: 'Fields to update',
      examples: {
        updatePercentage: {
          summary: 'Update Percentage',
          value: {
            discountPercentage: 15,
          },
        },
        deactivate: {
          summary: 'Deactivate Discount',
          value: {
            isActive: false,
          },
        },
        fullUpdate: {
          summary: 'Full Update',
          value: {
            name: 'Updated Weekly Discount',
            description: 'New description for the discount',
            discountPercentage: 12,
            isActive: true,
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Discount updated successfully',
      schema: { example: DISCOUNT_RESPONSE_EXAMPLE },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: ValidationErrorResponse,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Discount not found',
      type: NotFoundErrorResponse,
    }),
    ...CommonAdminErrors,
  );
}

export function ApiDeleteDiscount() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Delete a discount (Admin)',
      description: 'Permanently deletes a discount. Listings using this discount will have it removed.',
    }),
    ApiParam({
      name: 'id',
      description: 'Discount UUID',
      example: 'b2c3d4e5-f6a7-4901-bcde-f23456789012',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Discount deleted successfully',
      schema: { example: DELETE_RESPONSE_EXAMPLE },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Discount not found',
      type: NotFoundErrorResponse,
    }),
    ...CommonAdminErrors,
  );
}

// =====================
// Public Controller Decorators
// =====================

export function ApiGetPublishedListings() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all published listings',
      description: 'Returns all published listings visible to users. Draft listings are not included.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Published listings retrieved',
      schema: { example: LISTING_ARRAY_RESPONSE_EXAMPLE },
    }),
  );
}

export function ApiGetPublishedListing() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a published listing by ID',
      description: 'Returns details of a published listing. Returns 404 if listing is not published or does not exist.',
    }),
    ApiParam({
      name: 'id',
      description: 'Listing UUID',
      example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Listing retrieved',
      schema: { example: LISTING_RESPONSE_EXAMPLE },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Listing not found or not published',
      type: NotFoundErrorResponse,
    }),
  );
}
