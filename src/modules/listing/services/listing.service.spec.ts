import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ListingService } from './listing.service';
import { Listing, ListingPhoto, Discount } from '../entities';
import {
  PropertyCategory,
  PlaceType,
  BathroomUsage,
  BookingSetting,
  ListingStatus,
  Highlight,
  FavoriteAmenity,
  Amenity,
  SafetyItem,
} from '../enums';
import { User } from '../../user/entities/user.entity';
import { UserRole } from '../../user/enums/role.enum';

describe('ListingService', () => {
  let service: ListingService;
  let listingRepository: jest.Mocked<Repository<Listing>>;
  let photoRepository: jest.Mocked<Repository<ListingPhoto>>;
  let discountRepository: jest.Mocked<Repository<Discount>>;

  const mockHostId = 'host-uuid-123';
  const mockListingId = 'listing-uuid-456';

  const mockHost: Partial<User> = {
    id: mockHostId,
    email: 'host@example.com',
    role: UserRole.HOST,
  };

  const mockAdmin: Partial<User> = {
    id: 'admin-uuid-789',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  const mockUser: Partial<User> = {
    id: 'user-uuid-101',
    email: 'user@example.com',
    role: UserRole.USER,
  };

  const mockListing: Partial<Listing> = {
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

  const mockDiscount: Partial<Discount> = {
    id: 'discount-uuid-1',
    listingId: mockListingId,
    name: 'Weekly Discount',
    discountPercentage: 10,
    isActive: true,
  };

  beforeEach(async () => {
    const mockListingRepo = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    const mockPhotoRepo = {
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      insert: jest.fn(),
      manager: { query: jest.fn().mockResolvedValue(undefined) },
    };

    const mockDiscountRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      insert: jest.fn(),
      manager: { query: jest.fn().mockResolvedValue(undefined) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingService,
        {
          provide: getRepositoryToken(Listing),
          useValue: mockListingRepo,
        },
        {
          provide: getRepositoryToken(ListingPhoto),
          useValue: mockPhotoRepo,
        },
        {
          provide: getRepositoryToken(Discount),
          useValue: mockDiscountRepo,
        },
      ],
    }).compile();

    service = module.get<ListingService>(ListingService);
    listingRepository = module.get(getRepositoryToken(Listing));
    photoRepository = module.get(getRepositoryToken(ListingPhoto));
    discountRepository = module.get(getRepositoryToken(Discount));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createListing', () => {
    const step1Dto = {
      category: PropertyCategory.APARTMENT,
      placeType: PlaceType.ROOM,
      country: 'United States',
      streetAddress: '123 Main St',
      floor: '3rd',
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

    it('should create a listing with step 1 data', async () => {
      const expectedListing = {
        ...mockListing,
        ...step1Dto,
        hostId: mockHostId,
        step1Completed: true,
      };
      listingRepository.create.mockReturnValue(expectedListing as Listing);
      listingRepository.save.mockResolvedValue(expectedListing as Listing);

      const result = await service.createListing(mockHostId, step1Dto);

      expect(listingRepository.create).toHaveBeenCalled();
      expect(listingRepository.save).toHaveBeenCalled();
      expect(result.hostId).toBe(mockHostId);
      expect(result.status).toBe(ListingStatus.DRAFT);
      expect(result.step1Completed).toBe(true);
    });
  });

  describe('getListingWithOwnershipCheck', () => {
    it('should allow admin to access any listing', async () => {
      listingRepository.findOne.mockResolvedValue(mockListing as Listing);

      const result = await service.getListingWithOwnershipCheck(
        mockListingId,
        mockAdmin as User,
      );

      expect(result).toEqual(mockListing);
    });

    it('should allow host to access their own listing', async () => {
      listingRepository.findOne.mockResolvedValue(mockListing as Listing);

      const result = await service.getListingWithOwnershipCheck(
        mockListingId,
        mockHost as User,
      );

      expect(result).toEqual(mockListing);
    });

    it('should deny host access to another hosts listing', async () => {
      const otherHostListing = { ...mockListing, hostId: 'other-host-id' };
      listingRepository.findOne.mockResolvedValue(otherHostListing as Listing);

      await expect(
        service.getListingWithOwnershipCheck(mockListingId, mockHost as User),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should deny user access to draft listings', async () => {
      listingRepository.findOne.mockResolvedValue(mockListing as Listing);

      await expect(
        service.getListingWithOwnershipCheck(mockListingId, mockUser as User),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow user to access published listings', async () => {
      const publishedListing = { ...mockListing, status: ListingStatus.PUBLISHED };
      listingRepository.findOne.mockResolvedValue(publishedListing as Listing);

      const result = await service.getListingWithOwnershipCheck(
        mockListingId,
        mockUser as User,
      );

      expect(result.status).toBe(ListingStatus.PUBLISHED);
    });

    it('should throw NotFoundException if listing not found', async () => {
      listingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getListingWithOwnershipCheck(mockListingId, mockHost as User),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStep1', () => {
    const step1Dto = {
      category: PropertyCategory.APARTMENT,
      placeType: PlaceType.ROOM,
      country: 'United States',
      streetAddress: '123 Main St Updated',
      floor: '4th',
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

    it('should update step 1 fields', async () => {
      const completedListing = { ...mockListing, step1Completed: true };
      listingRepository.findOne.mockResolvedValue(completedListing as Listing);
      listingRepository.save.mockImplementation((listing) =>
        Promise.resolve({ ...listing } as Listing),
      );

      const result = await service.updateStep1(
        mockListingId,
        mockHostId,
        step1Dto,
      );

      expect(listingRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if host tries to update another hosts listing', async () => {
      const otherHostListing = { ...mockListing, hostId: 'other-host-id' };
      listingRepository.findOne.mockResolvedValue(otherHostListing as Listing);

      await expect(
        service.updateStep1(mockListingId, mockHostId, step1Dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('completeStep2', () => {
    const step2Dto = {
      favorites: [FavoriteAmenity.WIFI, FavoriteAmenity.TV],
      amenities: [Amenity.POOL, Amenity.HOT_TUB],
      safetyItems: [SafetyItem.SMOKE_ALARM, SafetyItem.FIRST_AID],
      photos: [
        { publicId: 'photo-1', secureUrl: 'https://example.com/photo1.jpg' },
      ],
      title: 'Cozy Apartment',
      highlights: [Highlight.CHARMING, Highlight.CENTRAL],
      description: 'A beautiful apartment',
    };

    it('should complete step 2 fields and handle photos', async () => {
      listingRepository.findOne
        .mockResolvedValueOnce(mockListing as Listing)
        .mockResolvedValueOnce({ ...mockListing, step2Completed: true } as Listing);
      photoRepository.delete.mockResolvedValue({} as any);
      (photoRepository.manager.query as jest.Mock).mockResolvedValue(undefined);
      listingRepository.update.mockResolvedValue({} as any);

      const result = await service.completeStep2(
        mockListingId,
        mockHostId,
        step2Dto,
      );

      expect(photoRepository.delete).toHaveBeenCalledWith({ listingId: mockListingId });
      expect(photoRepository.manager.query).toHaveBeenCalled();
      expect(result.step2Completed).toBe(true);
    });

    it('should throw BadRequestException if step 2 already completed', async () => {
      const completedListing = { ...mockListing, step2Completed: true };
      listingRepository.findOne.mockResolvedValue(completedListing as Listing);

      await expect(
        service.completeStep2(mockListingId, mockHostId, step2Dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeStep3', () => {
    const step3Dto = {
      bookingSetting: BookingSetting.INSTANT_BOOK,
      weekdayPrice: 100,
      weekdayAfterTaxPrice: 110,
      weekendPrice: 120,
      weekendAfterTaxPrice: 132,
    };

    it('should complete step 3 fields', async () => {
      listingRepository.findOne.mockResolvedValue(mockListing as Listing);
      listingRepository.save.mockImplementation((listing) =>
        Promise.resolve({ ...listing, step3Completed: true } as Listing),
      );

      const result = await service.completeStep3(
        mockListingId,
        mockHostId,
        step3Dto,
      );

      expect(result.step3Completed).toBe(true);
    });

    it('should throw BadRequestException if step 3 already completed', async () => {
      const completedListing = { ...mockListing, step3Completed: true };
      listingRepository.findOne.mockResolvedValue(completedListing as Listing);

      await expect(
        service.completeStep3(mockListingId, mockHostId, step3Dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeStep4', () => {
    const step4Dto = {
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
          name: 'Weekly Discount',
          description: 'Get 10% off',
          discountPercentage: 10,
          isActive: true,
        },
      ],
    };

    it('should complete step 4 and create discounts', async () => {
      listingRepository.findOne
        .mockResolvedValueOnce(mockListing as Listing)
        .mockResolvedValueOnce({ ...mockListing, step4Completed: true } as Listing);
      discountRepository.delete.mockResolvedValue({} as any);
      (discountRepository.manager.query as jest.Mock).mockResolvedValue(undefined);
      listingRepository.update.mockResolvedValue({} as any);

      const result = await service.completeStep4(
        mockListingId,
        mockHostId,
        step4Dto,
      );

      expect(discountRepository.delete).toHaveBeenCalledWith({ listingId: mockListingId });
      expect(discountRepository.manager.query).toHaveBeenCalled();
      expect(result.step4Completed).toBe(true);
    });

    it('should throw BadRequestException if step 4 already completed', async () => {
      const completedListing = { ...mockListing, step4Completed: true };
      listingRepository.findOne.mockResolvedValue(completedListing as Listing);

      await expect(
        service.completeStep4(mockListingId, mockHostId, step4Dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should complete step 4 with empty discounts', async () => {
      listingRepository.findOne
        .mockResolvedValueOnce(mockListing as Listing)
        .mockResolvedValueOnce({
          ...mockListing,
          step4Completed: true,
          discounts: [],
        } as Listing);
      discountRepository.delete.mockResolvedValue({} as any);
      listingRepository.update.mockResolvedValue({} as any);

      const result = await service.completeStep4(
        mockListingId,
        mockHostId,
        {
          safetyDetails: ['Smoke alarm in living room'],
          hostCountry: 'Nigeria',
          hostStreetAddress: '12 Ademola Street',
          hostCity: 'Lagos',
          hostState: 'Lagos',
          hostingAsBusiness: true,
          discounts: [],
        },
      );

      expect(result.step4Completed).toBe(true);
    });
  });

  describe('updateStep4', () => {
    const step4Dto = {
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
          name: 'Updated Discount',
          description: 'Get 15% off',
          discountPercentage: 15,
          isActive: true,
        },
      ],
    };

    it('should replace all discounts', async () => {
      const completedListing = { ...mockListing, step4Completed: true, discounts: [mockDiscount] };
      listingRepository.findOne
        .mockResolvedValueOnce(completedListing as Listing)
        .mockResolvedValueOnce(completedListing as Listing);
      discountRepository.delete.mockResolvedValue({} as any);
      (discountRepository.manager.query as jest.Mock).mockResolvedValue(undefined);
      listingRepository.update.mockResolvedValue({} as any);

      await service.updateStep4(mockListingId, mockHostId, step4Dto);

      expect(discountRepository.delete).toHaveBeenCalledWith({ listingId: mockListingId });
      expect(discountRepository.manager.query).toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('should publish listing when all required steps are completed', async () => {
      const completedListing = {
        ...mockListing,
        step1Completed: true,
        step2Completed: true,
        step3Completed: true,
      };
      listingRepository.findOne.mockResolvedValue(completedListing as Listing);
      listingRepository.save.mockImplementation((listing) =>
        Promise.resolve({ ...listing, status: ListingStatus.PUBLISHED } as Listing),
      );

      const result = await service.publish(mockListingId, mockHostId);

      expect(result.status).toBe(ListingStatus.PUBLISHED);
    });

    it('should throw BadRequestException if step 1 is incomplete', async () => {
      const incompleteListing = {
        ...mockListing,
        step1Completed: false,
        step2Completed: true,
        step3Completed: true,
      };
      listingRepository.findOne.mockResolvedValue(incompleteListing as Listing);

      await expect(
        service.publish(mockListingId, mockHostId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if multiple steps are incomplete', async () => {
      const allStepsIncompleteListing = {
        ...mockListing,
        step1Completed: false,
        step2Completed: false,
        step3Completed: false,
      };
      listingRepository.findOne.mockResolvedValue(allStepsIncompleteListing as Listing);

      await expect(
        service.publish(mockListingId, mockHostId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('unpublish', () => {
    it('should unpublish a published listing', async () => {
      const publishedListing = {
        ...mockListing,
        status: ListingStatus.PUBLISHED,
      };
      listingRepository.findOne.mockResolvedValue(publishedListing as Listing);
      listingRepository.save.mockImplementation((listing) =>
        Promise.resolve({ ...listing, status: ListingStatus.DRAFT } as Listing),
      );

      const result = await service.unpublish(mockListingId, mockHostId);

      expect(result.status).toBe(ListingStatus.DRAFT);
    });
  });

  describe('getHostListings', () => {
    it('should return only listings owned by the host', async () => {
      const hostListings = [
        { ...mockListing, id: '1' },
        { ...mockListing, id: '2' },
      ];
      listingRepository.find.mockResolvedValue(hostListings as Listing[]);

      const result = await service.getHostListings(mockHostId);

      expect(listingRepository.find).toHaveBeenCalledWith({
        where: { hostId: mockHostId },
        relations: ['photos', 'discounts'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('getAllListings', () => {
    it('should return all listings (admin only)', async () => {
      const allListings = [
        { ...mockListing, id: '1', hostId: 'host-1' },
        { ...mockListing, id: '2', hostId: 'host-2' },
      ];
      listingRepository.find.mockResolvedValue(allListings as Listing[]);

      const result = await service.getAllListings();

      expect(result).toHaveLength(2);
    });
  });

  describe('getPublishedListings', () => {
    it('should return only published listings', async () => {
      const publishedListings = [
        { ...mockListing, status: ListingStatus.PUBLISHED },
      ];
      listingRepository.find.mockResolvedValue(publishedListings as Listing[]);

      const result = await service.getPublishedListings();

      expect(listingRepository.find).toHaveBeenCalledWith({
        where: { status: ListingStatus.PUBLISHED },
        relations: ['photos', 'discounts'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getPublishedListing', () => {
    it('should return a published listing', async () => {
      const publishedListing = {
        ...mockListing,
        status: ListingStatus.PUBLISHED,
      };
      listingRepository.findOne.mockResolvedValue(publishedListing as Listing);

      const result = await service.getPublishedListing(mockListingId);

      expect(result.status).toBe(ListingStatus.PUBLISHED);
    });

    it('should throw NotFoundException for draft listing', async () => {
      listingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getPublishedListing(mockListingId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteListing', () => {
    it('should delete a listing owned by the host', async () => {
      listingRepository.findOne.mockResolvedValue(mockListing as Listing);
      listingRepository.remove.mockResolvedValue(mockListing as Listing);

      await service.deleteListing(mockListingId, mockHostId);

      expect(listingRepository.remove).toHaveBeenCalledWith(mockListing);
    });

    it('should throw ForbiddenException when deleting another hosts listing', async () => {
      const otherHostListing = { ...mockListing, hostId: 'other-host-id' };
      listingRepository.findOne.mockResolvedValue(otherHostListing as Listing);

      await expect(
        service.deleteListing(mockListingId, mockHostId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
