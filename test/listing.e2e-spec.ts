import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ListingModule } from '../src/modules/listing/listing.module';
import { Listing, ListingPhoto, Discount } from '../src/modules/listing/entities';
import { User } from '../src/modules/user/entities/user.entity';
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
const getErrorMessage = (body: any): string => {
  if (Array.isArray(body.message)) {
    return body.message.join(' ');
  }
  return body.message || '';
};

describe('Listing API (e2e)', () => {
  let app: INestApplication;
  let listingRepository: any;
  let photoRepository: any;
  let discountRepository: any;

  // Valid UUID v4s for testing (format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where y is 8,9,a,b)
  const mockHostId = '11111111-1111-4111-a111-111111111111';
  const mockAdminId = '22222222-2222-4222-a222-222222222222';
  const mockUserId = '33333333-3333-4333-a333-333333333333';
  const mockListingId = '44444444-4444-4444-a444-444444444444';
  const mockDiscountId = '55555555-5555-4555-a555-555555555555';

  const mockHost = {
    id: mockHostId,
    email: 'host@example.com',
    role: UserRole.HOST,
  };

  const mockAdmin = {
    id: mockAdminId,
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  const mockUser = {
    id: mockUserId,
    email: 'user@example.com',
    role: UserRole.USER,
  };

  const mockListing = {
    id: mockListingId,
    hostId: mockHostId,
    status: ListingStatus.DRAFT,
    step1Completed: false,
    step2Completed: false,
    step3Completed: false,
    step4Completed: false,
    photos: [],
    discounts: [],
  };

  const mockDiscount = {
    id: mockDiscountId,
    name: 'Weekly Discount',
    description: 'Get 10% off',
    discountPercentage: 10,
    isActive: true,
  };

  // Mock the guards to inject different users
  let currentUser = mockHost;

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockImplementation((context) => {
      const request = context.switchToHttp().getRequest();
      request.user = currentUser;
      return true;
    }),
  };

  const mockRolesGuard = {
    canActivate: jest.fn().mockImplementation((context) => {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      const handler = context.getHandler();
      const classRef = context.getClass();

      // For simplicity, we'll allow all in tests and test role logic in unit tests
      return true;
    }),
  };

  beforeAll(async () => {
    const mockListingRepo = {
      create: jest.fn().mockReturnValue(mockListing),
      save: jest.fn().mockResolvedValue(mockListing),
      findOne: jest.fn().mockResolvedValue(mockListing),
      find: jest.fn().mockResolvedValue([mockListing]),
      remove: jest.fn().mockResolvedValue(mockListing),
    };

    const mockPhotoRepo = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    };

    const mockDiscountRepo = {
      create: jest.fn().mockReturnValue(mockDiscount),
      save: jest.fn().mockResolvedValue(mockDiscount),
      find: jest.fn().mockResolvedValue([mockDiscount]),
      findOne: jest.fn().mockResolvedValue(mockDiscount),
      remove: jest.fn().mockResolvedValue(mockDiscount),
    };

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
    describe('POST /listings', () => {
      it('should create a draft listing', async () => {
        const response = await request(app.getHttpServer())
          .post('/listings')
          .expect(201);

        expect([200, 201]).toContain(response.body.status);
        expect(response.body.data.status).toBe(ListingStatus.DRAFT);
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

    describe('PUT /listings/:id/step-1', () => {
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

      it('should update step 1 with valid data', async () => {
        listingRepository.save.mockResolvedValue({
          ...mockListing,
          ...validStep1Data,
          step1Completed: true,
        });

        const response = await request(app.getHttpServer())
          .put(`/listings/${mockListingId}/step-1`)
          .send(validStep1Data)
          .expect(200);

        expect([200, 201]).toContain(response.body.status);
      });

      it('should reject invalid category', async () => {
        const invalidData = { ...validStep1Data, category: 'invalid_category' };

        const response = await request(app.getHttpServer())
          .put(`/listings/${mockListingId}/step-1`)
          .send(invalidData)
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('category must be one of');
      });

      it('should reject invalid bathroom value', async () => {
        const invalidData = { ...validStep1Data, privateBathroom: 2 };

        const response = await request(app.getHttpServer())
          .put(`/listings/${mockListingId}/step-1`)
          .send(invalidData)
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('privateBathroom must be 0, 0.5, or 1');
      });

      it('should reject guests <= 0', async () => {
        const invalidData = { ...validStep1Data, guests: 0 };

        const response = await request(app.getHttpServer())
          .put(`/listings/${mockListingId}/step-1`)
          .send(invalidData)
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('guests must be greater than 0');
      });
    });

    describe('PUT /listings/:id/step-2', () => {
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

      it('should update step 2 with valid data', async () => {
        listingRepository.save.mockResolvedValue({
          ...mockListing,
          step2Completed: true,
        });

        const response = await request(app.getHttpServer())
          .put(`/listings/${mockListingId}/step-2`)
          .send(validStep2Data)
          .expect(200);

        expect([200, 201]).toContain(response.body.status);
      });

      it('should reject less than 2 highlights', async () => {
        const invalidData = { ...validStep2Data, highlights: [Highlight.CHARMING] };

        const response = await request(app.getHttpServer())
          .put(`/listings/${mockListingId}/step-2`)
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
          .put(`/listings/${mockListingId}/step-2`)
          .send(invalidData)
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('Maximum 5 photos allowed');
      });
    });

    describe('PUT /listings/:id/step-3', () => {
      const validStep3Data = {
        bookingSetting: BookingSetting.INSTANT_BOOK,
        weekdayPrice: 100,
        weekendPrice: 120,
      };

      it('should update step 3 with valid data', async () => {
        listingRepository.save.mockResolvedValue({
          ...mockListing,
          step3Completed: true,
        });

        const response = await request(app.getHttpServer())
          .put(`/listings/${mockListingId}/step-3`)
          .send(validStep3Data)
          .expect(200);

        expect([200, 201]).toContain(response.body.status);
      });

      it('should reject negative prices', async () => {
        const invalidData = { ...validStep3Data, weekdayPrice: -10 };

        const response = await request(app.getHttpServer())
          .put(`/listings/${mockListingId}/step-3`)
          .send(invalidData)
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('weekdayPrice must be 0 or greater');
      });

      it('should reject invalid booking setting', async () => {
        const invalidData = { ...validStep3Data, bookingSetting: 'invalid' };

        const response = await request(app.getHttpServer())
          .put(`/listings/${mockListingId}/step-3`)
          .send(invalidData)
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('bookingSetting must be one of');
      });
    });

    describe('PUT /listings/:id/step-4', () => {
      it('should update step 4 with valid discount IDs', async () => {
        const discountWithCorrectId = {
          ...mockDiscount,
          id: mockDiscountId,
        };
        discountRepository.find.mockResolvedValue([discountWithCorrectId]);
        listingRepository.save.mockResolvedValue({
          ...mockListing,
          step4Completed: true,
          discounts: [discountWithCorrectId],
        });

        const response = await request(app.getHttpServer())
          .put(`/listings/${mockListingId}/step-4`)
          .send({ discountIds: [mockDiscountId] });

        // If the test fails, log the actual response for debugging
        if (response.status !== 200) {
          console.log('Step-4 response:', JSON.stringify(response.body, null, 2));
        }
        expect(response.status).toBe(200);
        expect([200, 201]).toContain(response.body.status);
      });

      it('should accept empty discount array', async () => {
        listingRepository.save.mockResolvedValue({
          ...mockListing,
          step4Completed: true,
          discounts: [],
        });

        const response = await request(app.getHttpServer())
          .put(`/listings/${mockListingId}/step-4`)
          .send({ discountIds: [] })
          .expect(200);

        expect([200, 201]).toContain(response.body.status);
      });

      it('should reject invalid UUID format', async () => {
        const response = await request(app.getHttpServer())
          .put(`/listings/${mockListingId}/step-4`)
          .send({ discountIds: ['invalid-uuid'] })
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('Each discount ID must be a valid UUID');
      });
    });

    describe('POST /listings/:id/publish', () => {
      it('should publish listing when all steps are complete', async () => {
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
          .expect(201); // NestJS POST returns 201 by default

        expect([200, 201]).toContain(response.body.status);
        expect(response.body.data.status).toBe(ListingStatus.PUBLISHED);
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

  describe('Admin APIs', () => {
    beforeEach(() => {
      currentUser = mockAdmin;
    });

    describe('GET /admin/listings', () => {
      it('should return all listings for admin', async () => {
        const response = await request(app.getHttpServer())
          .get('/admin/listings')
          .expect(200);

        expect([200, 201]).toContain(response.body.status);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('POST /admin/discounts', () => {
      it('should create a new discount', async () => {
        const discountData = {
          name: 'New Discount',
          description: 'A new discount',
          discountPercentage: 15,
        };

        const response = await request(app.getHttpServer())
          .post('/admin/discounts')
          .send(discountData)
          .expect(201);

        expect([200, 201]).toContain(response.body.status);
        expect(discountRepository.create).toHaveBeenCalled();
      });

      it('should reject discount percentage > 100', async () => {
        const invalidData = {
          name: 'Invalid Discount',
          discountPercentage: 150,
        };

        const response = await request(app.getHttpServer())
          .post('/admin/discounts')
          .send(invalidData)
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('discountPercentage cannot exceed 100');
      });

      it('should reject discount percentage < 0', async () => {
        const invalidData = {
          name: 'Invalid Discount',
          discountPercentage: -10,
        };

        const response = await request(app.getHttpServer())
          .post('/admin/discounts')
          .send(invalidData)
          .expect(400);

        expect(getErrorMessage(response.body)).toContain('discountPercentage must be at least 0');
      });
    });

    describe('PUT /admin/discounts/:id', () => {
      it('should update a discount', async () => {
        discountRepository.save.mockResolvedValue({
          ...mockDiscount,
          name: 'Updated Discount',
        });

        const response = await request(app.getHttpServer())
          .put(`/admin/discounts/${mockDiscountId}`)
          .send({ name: 'Updated Discount' })
          .expect(200);

        expect([200, 201]).toContain(response.body.status);
      });
    });

    describe('DELETE /admin/discounts/:id', () => {
      it('should delete a discount', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/admin/discounts/${mockDiscountId}`)
          .expect(200);

        expect([200, 201]).toContain(response.body.status);
        expect(discountRepository.remove).toHaveBeenCalled();
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
