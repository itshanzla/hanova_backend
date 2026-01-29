import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ListingModule } from '../src/modules/listing/listing.module';
import { Listing, ListingPhoto, Discount } from '../src/modules/listing/entities';
import { UserRole } from '../src/modules/user/enums/role.enum';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';
import {
  PropertyCategory,
  PlaceType,
  BathroomUsage,
  BookingSetting,
  ListingStatus,
  Highlight,
} from '../src/modules/listing/enums';

// Helper to extract message string from validation error response
const getErrorMessage = (body: Record<string, unknown>): string => {
  if (Array.isArray(body.message)) {
    return body.message.join(' ');
  }
  return (body.message as string) || '';
};

describe('Listing API (e2e)', () => {
  let app: INestApplication;
  let listingRepository: ReturnType<typeof createMockListingRepo>;
  let photoRepository: ReturnType<typeof createMockPhotoRepo>;
  let discountRepository: ReturnType<typeof createMockDiscountRepo>;

  // Valid UUID v4s for testing
  const mockHostId = '11111111-1111-4111-a111-111111111111';
  const mockListingId = '44444444-4444-4444-a444-444444444444';
  const mockDiscountId = '55555555-5555-4555-a555-555555555555';

  const mockHost = {
    id: mockHostId,
    email: 'host@example.com',
    role: UserRole.HOST,
  };

  const mockListing = {
    id: mockListingId,
    hostId: mockHostId,
    status: ListingStatus.DRAFT,
    step1Completed: false,
    step2Completed: false,
    step3Completed: false,
    step4Completed: false,
    homePrecise: false,
    bedroomLock: false,
    photos: [],
    discounts: [],
  };

  const mockDiscount = {
    id: mockDiscountId,
    listingId: mockListingId,
    name: 'Weekly Discount',
    description: 'Get 10% off',
    discountPercentage: 10,
    isActive: true,
  };

  // Mock the guards to inject different users
  let currentUser = mockHost;

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockImplementation((context) => {
      const req = context.switchToHttp().getRequest();
      req.user = currentUser;
      return true;
    }),
  };

  const mockRolesGuard = {
    canActivate: jest.fn().mockImplementation(() => true),
  };

  function createMockListingRepo() {
    return {
      create: jest.fn().mockReturnValue(mockListing),
      save: jest.fn().mockResolvedValue(mockListing),
      findOne: jest.fn().mockResolvedValue(mockListing),
      find: jest.fn().mockResolvedValue([mockListing]),
      remove: jest.fn().mockResolvedValue(mockListing),
    };
  }

  function createMockPhotoRepo() {
    return {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    };
  }

  function createMockDiscountRepo() {
    return {
      create: jest.fn().mockReturnValue(mockDiscount),
      save: jest.fn().mockResolvedValue([mockDiscount]),
      find: jest.fn().mockResolvedValue([mockDiscount]),
      findOne: jest.fn().mockResolvedValue(mockDiscount),
      delete: jest.fn().mockResolvedValue({}),
      remove: jest.fn().mockResolvedValue(mockDiscount),
    };
  }

  beforeAll(async () => {
    const mockListingRepo = createMockListingRepo();
    const mockPhotoRepo = createMockPhotoRepo();
    const mockDiscountRepo = createMockDiscountRepo();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ListingModule],
    })
      .overrideProvider(getRepositoryToken(Listing))
      .useValue(mockListingRepo)
      .overrideProvider(getRepositoryToken(ListingPhoto))
      .useValue(mockPhotoRepo)
      .overrideProvider(getRepositoryToken(Discount))
      .useValue(mockDiscountRepo)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    listingRepository = moduleFixture.get(getRepositoryToken(Listing));
    photoRepository = moduleFixture.get(getRepositoryToken(ListingPhoto));
    discountRepository = moduleFixture.get(getRepositoryToken(Discount));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    currentUser = mockHost;
    jest.clearAllMocks();
  });

  describe('Host Listing APIs', () => {
    const validStep1Data = {
      category: PropertyCategory.APARTMENT,
      placeType: PlaceType.ROOM,
      country: 'United States',
      streetAddress: '123 Main St',
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
      sharedBathroom: 0.5,
      bathroomUsage: BathroomUsage.OTHER_GUESTS,
    };

    describe('POST /listings (Create with Step 1)', () => {
      it('should create a listing with property details', async () => {
        listingRepository.create.mockReturnValue({
          ...mockListing,
          ...validStep1Data,
          step1Completed: true,
        });
        listingRepository.save.mockResolvedValue({
          ...mockListing,
          ...validStep1Data,
          step1Completed: true,
        });

        const response = await request(app.getHttpServer())
          .post('/listings')
          .send(validStep1Data)
          .expect(201);

        expect([200, 201]).toContain(response.body.status);
        expect(response.body.data.status).toBe(ListingStatus.DRAFT);
        expect(response.body.data.step1Completed).toBe(true);
      });

      it('should reject invalid category', async () => {
        const invalidData = { ...validStep1Data, category: 'invalid_category' };

        const response = await request(app.getHttpServer())
          .post('/listings')
          .send(invalidData)
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('category must be one of');
      });

      it('should reject invalid bathroom value', async () => {
        const invalidData = { ...validStep1Data, privateBathroom: 2 };

        const response = await request(app.getHttpServer())
          .post('/listings')
          .send(invalidData)
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('privateBathroom must be 0, 0.5, or 1');
      });

      it('should reject guests <= 0', async () => {
        const invalidData = { ...validStep1Data, guests: 0 };

        const response = await request(app.getHttpServer())
          .post('/listings')
          .send(invalidData)
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('guests must be greater than 0');
      });
    });

    describe('GET /listings', () => {
      it('should return listings for the current host', async () => {
        const response = await request(app.getHttpServer())
          .get('/listings')
          .expect(200);

        expect([200, 201]).toContain(response.body.status);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('PATCH /listings/:id/step-1 (Update)', () => {
      const updateStep1Data = {
        category: PropertyCategory.APARTMENT,
        placeType: PlaceType.ROOM,
        country: 'United States',
        streetAddress: '123 Main St Updated',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        guests: 5,
        bedrooms: 3,
        beds: 4,
        homePrecise: true,
        bedroomLock: true,
        privateBathroom: 1,
        dedicatedBathroom: 0,
        sharedBathroom: 0,
        bathroomUsage: BathroomUsage.OTHER_GUESTS,
      };

      it('should update step 1 with valid data', async () => {
        listingRepository.findOne.mockResolvedValue({
          ...mockListing,
          step1Completed: true,
        });
        listingRepository.save.mockResolvedValue({
          ...mockListing,
          ...updateStep1Data,
          step1Completed: true,
        });

        const response = await request(app.getHttpServer())
          .patch(`/listings/${mockListingId}/step-1`)
          .send(updateStep1Data)
          .expect(200);

        expect([200, 201]).toContain(response.body.status);
      });
    });

    describe('POST /listings/:id/step-2 (Complete)', () => {
      const validStep2Data = {
        favorites: ['wifi', 'tv'],
        amenities: ['pool', 'hot_tub'],
        safetyItems: ['smoke_alarm', 'first_aid'],
        photos: [
          {
            publicId: 'photo-1',
            secureUrl: 'https://example.com/photo1.jpg',
          },
        ],
        title: 'Cozy Apartment',
        highlights: [Highlight.CHARMING, Highlight.CENTRAL],
        description: 'A beautiful apartment in downtown',
      };

      it('should complete step 2 with valid data', async () => {
        listingRepository.save.mockResolvedValue({
          ...mockListing,
          step2Completed: true,
        });

        const response = await request(app.getHttpServer())
          .post(`/listings/${mockListingId}/step-2`)
          .send(validStep2Data)
          .expect(201);

        expect([200, 201]).toContain(response.body.status);
      });

      it('should reject less than 2 highlights', async () => {
        const invalidData = { ...validStep2Data, highlights: [Highlight.CHARMING] };

        const response = await request(app.getHttpServer())
          .post(`/listings/${mockListingId}/step-2`)
          .send(invalidData)
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('At least 2 highlights are required');
      });

      it('should reject more than 5 photos', async () => {
        const invalidData = {
          ...validStep2Data,
          photos: Array(6).fill({
            publicId: 'photo',
            secureUrl: 'https://example.com/photo.jpg',
          }),
        };

        const response = await request(app.getHttpServer())
          .post(`/listings/${mockListingId}/step-2`)
          .send(invalidData)
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('Maximum 5 photos allowed');
      });
    });

    describe('POST /listings/:id/step-3 (Complete)', () => {
      const validStep3Data = {
        bookingSetting: BookingSetting.INSTANT_BOOK,
        weekdayPrice: 100,
        weekdayAfterTaxPrice: 110,
        weekendPrice: 120,
        weekendAfterTaxPrice: 132,
      };

      it('should complete step 3 with valid data', async () => {
        listingRepository.save.mockResolvedValue({
          ...mockListing,
          step3Completed: true,
        });

        const response = await request(app.getHttpServer())
          .post(`/listings/${mockListingId}/step-3`)
          .send(validStep3Data)
          .expect(201);

        expect([200, 201]).toContain(response.body.status);
      });

      it('should reject negative prices', async () => {
        const invalidData = { ...validStep3Data, weekdayPrice: -10 };

        const response = await request(app.getHttpServer())
          .post(`/listings/${mockListingId}/step-3`)
          .send(invalidData)
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('weekdayPrice must be 0 or greater');
      });

      it('should reject invalid booking setting', async () => {
        const invalidData = { ...validStep3Data, bookingSetting: 'invalid' };

        const response = await request(app.getHttpServer())
          .post(`/listings/${mockListingId}/step-3`)
          .send(invalidData)
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('bookingSetting must be one of');
      });
    });

    describe('POST /listings/:id/step-4 (Complete with Discount Creation)', () => {
      const baseStep4Data = {
        safetyDetails: ['Fire extinguisher in kitchen', 'First aid kit in hallway'],
        hostCountry: 'Nigeria',
        hostStreetAddress: '12 Ademola Street',
        hostAptFloor: 'Apt 3B',
        hostCity: 'Lagos',
        hostState: 'Lagos',
        hostPostalCode: '100001',
        hostingAsBusiness: false,
      };

      it('should complete step 4 with discounts', async () => {
        listingRepository.save.mockResolvedValue({
          ...mockListing,
          step4Completed: true,
        });
        listingRepository.findOne.mockResolvedValue({
          ...mockListing,
          step4Completed: true,
          discounts: [mockDiscount],
        });

        const response = await request(app.getHttpServer())
          .post(`/listings/${mockListingId}/step-4`)
          .send({
            ...baseStep4Data,
            discounts: [
              {
                name: 'Weekly Discount',
                description: 'Get 10% off',
                discountPercentage: 10,
                isActive: true,
              },
            ],
          })
          .expect(201);

        expect([200, 201]).toContain(response.body.status);
      });

      it('should accept empty discount array', async () => {
        listingRepository.save.mockResolvedValue({
          ...mockListing,
          step4Completed: true,
          discounts: [],
        });
        listingRepository.findOne.mockResolvedValue({
          ...mockListing,
          step4Completed: true,
          discounts: [],
        });

        const response = await request(app.getHttpServer())
          .post(`/listings/${mockListingId}/step-4`)
          .send({ ...baseStep4Data, discounts: [] })
          .expect(201);

        expect([200, 201]).toContain(response.body.status);
      });

      it('should reject discount percentage > 100', async () => {
        const response = await request(app.getHttpServer())
          .post(`/listings/${mockListingId}/step-4`)
          .send({
            ...baseStep4Data,
            discounts: [
              {
                name: 'Invalid Discount',
                discountPercentage: 150,
              },
            ],
          })
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('discountPercentage cannot exceed 100');
      });

      it('should reject discount percentage < 0', async () => {
        const response = await request(app.getHttpServer())
          .post(`/listings/${mockListingId}/step-4`)
          .send({
            ...baseStep4Data,
            discounts: [
              {
                name: 'Invalid Discount',
                discountPercentage: -10,
              },
            ],
          })
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('discountPercentage must be at least 0');
      });
    });

    describe('POST /listings/:id/publish', () => {
      it('should publish listing when all required steps are complete', async () => {
        listingRepository.findOne.mockResolvedValue({
          ...mockListing,
          step1Completed: true,
          step2Completed: true,
          step3Completed: true,
        });
        listingRepository.save.mockResolvedValue({
          ...mockListing,
          status: ListingStatus.PUBLISHED,
        });

        const response = await request(app.getHttpServer())
          .post(`/listings/${mockListingId}/publish`)
          .expect(201);

        expect([200, 201]).toContain(response.body.status);
        expect(response.body.data.status).toBe(ListingStatus.PUBLISHED);
      });
    });

    describe('POST /listings/:id/unpublish', () => {
      it('should unpublish a listing', async () => {
        listingRepository.findOne.mockResolvedValue({
          ...mockListing,
          status: ListingStatus.PUBLISHED,
        });
        listingRepository.save.mockResolvedValue({
          ...mockListing,
          status: ListingStatus.DRAFT,
        });

        const response = await request(app.getHttpServer())
          .post(`/listings/${mockListingId}/unpublish`)
          .expect(201);

        expect([200, 201]).toContain(response.body.status);
        expect(response.body.data.status).toBe(ListingStatus.DRAFT);
      });
    });

    describe('DELETE /listings/:id', () => {
      it('should delete a listing', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/listings/${mockListingId}`)
          .expect(200);

        expect([200, 201]).toContain(response.body.status);
        expect(listingRepository.remove).toHaveBeenCalled();
      });
    });
  });

  describe('Public APIs', () => {
    describe('GET /public/listings', () => {
      it('should return only published listings', async () => {
        listingRepository.find.mockResolvedValue([
          { ...mockListing, status: ListingStatus.PUBLISHED },
        ]);

        const response = await request(app.getHttpServer())
          .get('/public/listings')
          .expect(200);

        expect([200, 201]).toContain(response.body.status);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('GET /public/listings/:id', () => {
      it('should return a published listing', async () => {
        listingRepository.findOne.mockResolvedValue({
          ...mockListing,
          status: ListingStatus.PUBLISHED,
        });

        const response = await request(app.getHttpServer())
          .get(`/public/listings/${mockListingId}`)
          .expect(200);

        expect([200, 201]).toContain(response.body.status);
      });

      it('should return 404 for draft listing', async () => {
        listingRepository.findOne.mockResolvedValue(null);

        await request(app.getHttpServer())
          .get(`/public/listings/${mockListingId}`)
          .expect(404);
      });
    });
  });
});
