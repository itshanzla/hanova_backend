import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Listing, ListingPhoto, Discount } from '../entities';
import { ListingStatus } from '../enums';
import {
  Step1PropertyDetailsDto,
  Step2AmenitiesMediaDto,
  Step3BookingPricingDto,
  Step4DiscountsDto,
} from '../dto';
import { User } from '../../user/entities/user.entity';
import { UserRole } from '../../user/enums/role.enum';

@Injectable()
export class ListingService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(ListingPhoto)
    private readonly photoRepository: Repository<ListingPhoto>,
    @InjectRepository(Discount)
    private readonly discountRepository: Repository<Discount>,
  ) {}

  /**
   * Create a new draft listing for a host
   */
  async createDraft(hostId: string): Promise<Listing> {
    const listing = this.listingRepository.create({
      hostId,
      status: ListingStatus.DRAFT,
    });
    return this.listingRepository.save(listing);
  }

  /**
   * Get listing by ID with ownership check
   */
  async getListingWithOwnershipCheck(
    listingId: string,
    user: User,
  ): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: ['photos', 'discounts', 'host'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Admin can access any listing
    if (user.role === UserRole.ADMIN) {
      return listing;
    }

    // Host can only access their own listings
    if (user.role === UserRole.HOST && listing.hostId !== user.id) {
      throw new ForbiddenException('You do not have access to this listing');
    }

    // Regular user can only see published listings
    if (user.role === UserRole.USER && listing.status !== ListingStatus.PUBLISHED) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  /**
   * Update Step 1: Property Details
   */
  async updateStep1(
    listingId: string,
    hostId: string,
    dto: Step1PropertyDetailsDto,
  ): Promise<Listing> {
    const listing = await this.findListingForHost(listingId, hostId);

    // Update all step 1 fields
    listing.category = dto.category;
    listing.placeType = dto.placeType;
    listing.country = dto.country;
    listing.streetAddress = dto.streetAddress;
    listing.floor = dto.floor ?? null;
    listing.city = dto.city;
    listing.state = dto.state;
    listing.postalCode = dto.postalCode;
    listing.guests = dto.guests;
    listing.bedrooms = dto.bedrooms;
    listing.beds = dto.beds;
    listing.homePrecise = dto.homePrecise;
    listing.bedroomLock = dto.bedroomLock;
    listing.privateBathroom = dto.privateBathroom;
    listing.dedicatedBathroom = dto.dedicatedBathroom;
    listing.sharedBathroom = dto.sharedBathroom;
    listing.bathroomUsage = dto.bathroomUsage;
    listing.step1Completed = true;

    return this.listingRepository.save(listing);
  }

  /**
   * Update Step 2: Amenities, Safety & Media
   */
  async updateStep2(
    listingId: string,
    hostId: string,
    dto: Step2AmenitiesMediaDto,
  ): Promise<Listing> {
    const listing = await this.findListingForHost(listingId, hostId);

    // Update amenities and safety
    listing.favorites = dto.favorites || [];
    listing.amenities = dto.amenities || [];
    listing.safetyItems = dto.safetyItems || [];

    // Handle photos - delete existing and add new ones
    if (dto.photos && dto.photos.length > 0) {
      // Delete existing photos
      await this.photoRepository.delete({ listingId });

      // Create new photos
      const photos = dto.photos.map((photo, index) =>
        this.photoRepository.create({
          publicId: photo.publicId,
          secureUrl: photo.secureUrl,
          listingId,
          order: index,
        }),
      );
      await this.photoRepository.save(photos);
    }

    // Update content
    listing.title = dto.title;
    listing.highlights = dto.highlights;
    listing.description = dto.description;
    listing.step2Completed = true;

    return this.listingRepository.save(listing);
  }

  /**
   * Update Step 3: Booking & Pricing
   */
  async updateStep3(
    listingId: string,
    hostId: string,
    dto: Step3BookingPricingDto,
  ): Promise<Listing> {
    const listing = await this.findListingForHost(listingId, hostId);

    listing.bookingSetting = dto.bookingSetting;
    listing.weekdayPrice = dto.weekdayPrice;
    listing.weekendPrice = dto.weekendPrice;
    listing.step3Completed = true;

    return this.listingRepository.save(listing);
  }

  /**
   * Update Step 4: Discounts (validates discount IDs)
   */
  async updateStep4(
    listingId: string,
    hostId: string,
    dto: Step4DiscountsDto,
  ): Promise<Listing> {
    const listing = await this.findListingForHost(listingId, hostId);

    if (dto.discountIds && dto.discountIds.length > 0) {
      // Validate all discount IDs exist and are active
      const discounts = await this.discountRepository.find({
        where: {
          id: In(dto.discountIds),
          isActive: true,
        },
      });

      if (discounts.length !== dto.discountIds.length) {
        const foundIds = discounts.map((d) => d.id);
        const invalidIds = dto.discountIds.filter((id) => !foundIds.includes(id));
        throw new BadRequestException(
          `Invalid or inactive discount IDs: ${invalidIds.join(', ')}`,
        );
      }

      listing.discounts = discounts;
    } else {
      listing.discounts = [];
    }

    listing.step4Completed = true;

    return this.listingRepository.save(listing);
  }

  /**
   * Publish a listing (all steps must be completed)
   */
  async publish(listingId: string, hostId: string): Promise<Listing> {
    const listing = await this.findListingForHost(listingId, hostId);

    // Validate all steps are completed
    const incompleteSteps: string[] = [];
    if (!listing.step1Completed) incompleteSteps.push('Step 1 (Property Details)');
    if (!listing.step2Completed) incompleteSteps.push('Step 2 (Amenities & Media)');
    if (!listing.step3Completed) incompleteSteps.push('Step 3 (Booking & Pricing)');
    // Step 4 is optional (discounts)

    if (incompleteSteps.length > 0) {
      throw new BadRequestException(
        `Cannot publish listing. Incomplete steps: ${incompleteSteps.join(', ')}`,
      );
    }

    listing.status = ListingStatus.PUBLISHED;
    return this.listingRepository.save(listing);
  }

  /**
   * Unpublish a listing (convert to draft)
   */
  async unpublish(listingId: string, hostId: string): Promise<Listing> {
    const listing = await this.findListingForHost(listingId, hostId);
    listing.status = ListingStatus.DRAFT;
    return this.listingRepository.save(listing);
  }

  /**
   * Get all listings for a host (ownership enforced)
   */
  async getHostListings(hostId: string): Promise<Listing[]> {
    return this.listingRepository.find({
      where: { hostId },
      relations: ['photos', 'discounts'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a single listing for a host
   */
  async getHostListing(listingId: string, hostId: string): Promise<Listing> {
    return this.findListingForHost(listingId, hostId);
  }

  /**
   * Delete a listing (host only)
   */
  async deleteListing(listingId: string, hostId: string): Promise<void> {
    const listing = await this.findListingForHost(listingId, hostId);
    await this.listingRepository.remove(listing);
  }

  /**
   * Get all listings (admin only)
   */
  async getAllListings(): Promise<Listing[]> {
    return this.listingRepository.find({
      relations: ['photos', 'discounts', 'host'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all published listings (public)
   */
  async getPublishedListings(): Promise<Listing[]> {
    return this.listingRepository.find({
      where: { status: ListingStatus.PUBLISHED },
      relations: ['photos', 'discounts'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a single published listing (public)
   */
  async getPublishedListing(listingId: string): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: {
        id: listingId,
        status: ListingStatus.PUBLISHED,
      },
      relations: ['photos', 'discounts'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  /**
   * Helper: Find listing for host with ownership check
   */
  private async findListingForHost(
    listingId: string,
    hostId: string,
  ): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: ['photos', 'discounts'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.hostId !== hostId) {
      throw new ForbiddenException('You do not have access to this listing');
    }

    return listing;
  }
}
