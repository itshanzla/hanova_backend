import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  LISTING_RESPONSE_EXAMPLE,
  LISTING_ARRAY_RESPONSE_EXAMPLE,
  DRAFT_LISTING_RESPONSE_EXAMPLE,
  DELETE_RESPONSE_EXAMPLE,
  UPLOAD_PHOTOS_RESPONSE_EXAMPLE,
} from './response-schemas';
import {
  ValidationErrorResponse,
  UnauthorizedErrorResponse,
  ForbiddenErrorResponse,
  NotFoundErrorResponse,
  BadRequestErrorResponse,
} from './error-schemas';
import {
  Step1PropertyDetailsDto,
  Step2AmenitiesMediaDto,
  Step3BookingPricingDto,
  Step4DiscountsDto,
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

// =====================
// Listing Controller Decorators
// =====================

export function ApiCreateListing() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Create a new listing with property details',
      description: `Creates a new listing in DRAFT status with Step 1 (Property Details) data.

**Required fields:**
- Category (31 property types available)
- Place type (room or shared_room)
- Address (country, street, city, state, postal code)
- Capacity (guests > 0, bedrooms >= 0, beds >= 0)
- Property flags (home_precise, bedroom_lock)
- Bathroom distribution (values must be 0, 0.5, or 1)
- Bathroom usage

After creating, continue with:
- POST /listings/{id}/step-2 (Amenities & Media)
- POST /listings/{id}/step-3 (Booking & Pricing)
- POST /listings/{id}/step-4 (Discounts - optional)
- POST /listings/{id}/publish`,
    }),
    ApiBody({
      type: Step1PropertyDetailsDto,
      description: 'Property details for the new listing',
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
      status: HttpStatus.CREATED,
      description: 'Listing created with property details',
      schema: { example: LISTING_RESPONSE_EXAMPLE },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: ValidationErrorResponse,
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

// =====================
// COMPLETE STEP APIs (POST - First time)
// =====================

export function ApiCompleteStep2() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Complete Step 2: Amenities, Safety & Media',
      description: `Complete amenities, safety items, photos, and listing content (first time). Use PATCH to update later.

**Constraints:**
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
            description: 'Experience urban living at its finest in this beautifully decorated apartment.',
          },
        },
        minimal: {
          summary: 'Minimal Example',
          value: {
            title: 'Cozy Room in Quiet Neighborhood',
            highlights: ['charming', 'unique'],
            description: 'A peaceful retreat perfect for solo travelers or couples.',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Step 2 completed successfully',
      schema: { example: LISTING_RESPONSE_EXAMPLE },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error or step already completed',
      type: BadRequestErrorResponse,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Listing not found',
      type: NotFoundErrorResponse,
    }),
    ...CommonHostErrors,
  );
}

export function ApiUploadListingPhotos() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Upload listing photos',
      description:
        'Uploads up to 5 images to Cloudinary and returns publicId + secureUrl for Step 2 payload.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          photos: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
          },
        },
        required: ['photos'],
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Photos uploaded successfully',
      schema: { example: UPLOAD_PHOTOS_RESPONSE_EXAMPLE },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid files or upload limit exceeded',
      type: BadRequestErrorResponse,
    }),
    ...CommonHostErrors,
  );
}

export function ApiCompleteStep3() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Complete Step 3: Booking & Pricing',
      description: `Complete booking settings and pricing (first time). Weekdays are Monday to Thursday, weekends are Friday to Sunday. Use PATCH to update later.

**Notes:**
- weekend_charge_percentage is calculated dynamically (NOT stored)
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
            weekdayPrice: 150.0,
            weekdayAfterTaxPrice: 165.0,
            weekendPrice: 180.0,
            weekendAfterTaxPrice: 198.0,
          },
        },
        approvalRequired: {
          summary: 'Approval Required',
          value: {
            bookingSetting: 'approve_before_booking',
            weekdayPrice: 200.0,
            weekdayAfterTaxPrice: 220.0,
            weekendPrice: 250.0,
            weekendAfterTaxPrice: 275.0,
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Step 3 completed successfully',
      schema: { example: LISTING_RESPONSE_EXAMPLE },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error or step already completed',
      type: BadRequestErrorResponse,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Listing not found',
      type: NotFoundErrorResponse,
    }),
    ...CommonHostErrors,
  );
}

export function ApiCompleteStep4() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Complete Step 4: Create Discounts',
      description: `Create discounts and provide safety + host additional information (first time). Use PATCH to update later.

**Notes:**
- Discounts are specific to this listing
- You can add multiple discounts (e.g., weekly, monthly)
- Each discount has a name, description, and percentage (0-100)
- Empty array means no discounts`,
    }),
    ApiParam({
      name: 'id',
      description: 'Listing UUID',
      example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    }),
    ApiBody({
      type: Step4DiscountsDto,
      description: 'Discounts to create for this listing',
      examples: {
        withDiscounts: {
          summary: 'With Discounts',
          value: {
            safetyDetails: ['Fire extinguisher in kitchen', 'First aid kit in hallway'],
            hostCountry: 'Nigeria',
            hostStreetAddress: '12 Ademola Street',
            hostAptFloor: 'Apt 3B',
            hostCity: 'Lagos',
            hostState: 'Lagos',
            hostPostalCode: '100001',
            hostingAsBusiness: false,
            discounts: [
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
          },
        },
        noDiscounts: {
          summary: 'No Discounts',
          value: {
            safetyDetails: ['Smoke alarm in living room'],
            hostCountry: 'Nigeria',
            hostStreetAddress: '12 Ademola Street',
            hostCity: 'Lagos',
            hostState: 'Lagos',
            hostingAsBusiness: true,
            discounts: [],
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Step 4 completed successfully',
      schema: { example: LISTING_RESPONSE_EXAMPLE },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error or step already completed',
      type: BadRequestErrorResponse,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Listing not found',
      type: NotFoundErrorResponse,
    }),
    ...CommonHostErrors,
  );
}

// =====================
// UPDATE STEP APIs (PATCH)
// =====================

export function ApiUpdateStep1() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update Step 1: Property Details',
      description: 'Update property details for an existing listing.',
    }),
    ApiParam({
      name: 'id',
      description: 'Listing UUID',
      example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    }),
    ApiBody({
      type: Step1PropertyDetailsDto,
      description: 'Property details to update',
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
      description: 'Update amenities, safety items, photos, and content for an existing listing.',
    }),
    ApiParam({
      name: 'id',
      description: 'Listing UUID',
      example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    }),
    ApiBody({
      type: Step2AmenitiesMediaDto,
      description: 'Amenities and media details to update',
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
            ],
            title: 'Updated Apartment Title',
            highlights: ['charming', 'central', 'stylish'],
            description: 'Updated description for the apartment.',
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
      type: ValidationErrorResponse,
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
      description:
        'Update booking settings and pricing for an existing listing. Weekdays are Monday to Thursday, weekends are Friday to Sunday.',
    }),
    ApiParam({
      name: 'id',
      description: 'Listing UUID',
      example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    }),
    ApiBody({
      type: Step3BookingPricingDto,
      description: 'Booking and pricing details to update',
      examples: {
        update: {
          summary: 'Update Pricing',
          value: {
            bookingSetting: 'instant_book',
            weekdayPrice: 175.0,
            weekdayAfterTaxPrice: 192.5,
            weekendPrice: 200.0,
            weekendAfterTaxPrice: 220.0,
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
      type: ValidationErrorResponse,
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
      description:
        'Update safety details and host additional information. Replace all discounts for this listing. Existing discounts will be deleted and new ones created.',
    }),
    ApiParam({
      name: 'id',
      description: 'Listing UUID',
      example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    }),
    ApiBody({
      type: Step4DiscountsDto,
      description: 'Updated discounts for this listing',
      examples: {
        update: {
          summary: 'Update Discounts',
          value: {
            safetyDetails: ['Fire extinguisher in kitchen', 'Emergency exit near lobby'],
            hostCountry: 'Nigeria',
            hostStreetAddress: '12 Ademola Street',
            hostAptFloor: 'Apt 3B',
            hostCity: 'Lagos',
            hostState: 'Lagos',
            hostPostalCode: '100001',
            hostingAsBusiness: false,
            discounts: [
              {
                name: 'Updated Weekly Discount',
                description: 'Get 15% off for stays of 7 days or more',
                discountPercentage: 15,
                isActive: true,
              },
            ],
          },
        },
        removeAll: {
          summary: 'Remove All Discounts',
          value: {
            safetyDetails: ['Smoke alarm in living room'],
            hostCountry: 'Nigeria',
            hostStreetAddress: '12 Ademola Street',
            hostCity: 'Lagos',
            hostState: 'Lagos',
            hostingAsBusiness: true,
            discounts: [],
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
      description: 'Validation error',
      type: ValidationErrorResponse,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Listing not found',
      type: NotFoundErrorResponse,
    }),
    ...CommonHostErrors,
  );
}

// =====================
// PUBLISH / UNPUBLISH
// =====================

export function ApiPublishListing() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Publish a listing',
      description: `Publishes a listing (makes it visible to users).

**Requirements:**
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

// =====================
// DELETE
// =====================

export function ApiDeleteListing() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Delete a listing',
      description: 'Permanently deletes a listing and all associated data (photos, discounts).',
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
