import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import {
  CloudinaryService,
  type CloudinaryUploadResult,
} from '../../../common/cloudinary/cloudinary.service';

@Injectable()
export class ListingService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(ListingPhoto)
    private readonly photoRepository: Repository<ListingPhoto>,
    @InjectRepository(Discount)
    private readonly discountRepository: Repository<Discount>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Create a new listing with Step 1 data (Property Details)
   */
  async createListing(hostId: string, dto: Step1PropertyDetailsDto): Promise<Listing> {
    const listing = this.listingRepository.create({
      hostId,
      status: ListingStatus.DRAFT,
      // Step 1 fields
      category: dto.category,
      placeType: dto.placeType,
      country: dto.country,
      streetAddress: dto.streetAddress,
      floor: dto.floor ?? null,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      guests: dto.guests,
      bedrooms: dto.bedrooms,
      beds: dto.beds,
      homePrecise: dto.homePrecise,
      bedroomLock: dto.bedroomLock,
      privateBathroom: dto.privateBathroom,
      dedicatedBathroom: dto.dedicatedBathroom,
      sharedBathroom: dto.sharedBathroom,
      bathroomUsage: dto.bathroomUsage,
      step1Completed: true,
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
   * Complete Step 2: Amenities, Safety & Media (first time)
   */
  async completeStep2(
    listingId: string,
    hostId: string,
    dto: Step2AmenitiesMediaDto,
  ): Promise<Listing> {
    const listing = await this.findListingForHost(listingId, hostId);

    if (listing.step2Completed) {
      throw new BadRequestException('Step 2 already completed. Use PATCH to update.');
    }

    return this.applyStep2(listing, listingId, dto);
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
    return this.applyStep2(listing, listingId, dto);
  }

  /**
   * Apply Step 2 data to listing
   */
  private async applyStep2(
    listing: Listing,
    listingId: string,
    dto: Step2AmenitiesMediaDto,
  ): Promise<Listing> {
    const favorites = dto.favorites || [];
    const amenities = dto.amenities || [];
    const safetyItems = dto.safetyItems || [];

    if (dto.photos && dto.photos.length > 5) {
      throw new BadRequestException('Maximum 5 photos allowed');
    }

    // Handle photos: delete existing, then insert with raw SQL so listing_id is always set
    if (dto.photos && dto.photos.length > 0) {
      await this.photoRepository.delete({ listingId });

      const now = new Date();
      for (let i = 0; i < dto.photos.length; i++) {
        const p = dto.photos[i];
        await this.photoRepository.manager.query(
          `INSERT INTO listing_photos (id, "publicId", "secureUrl", "order", listing_id, "createdAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
          [p.publicId, p.secureUrl, i, listingId, now],
        );
      }
    }

    // Update listing fields without cascading relations
    await this.listingRepository.update(listingId, {
      favorites,
      amenities,
      safetyItems,
      title: dto.title,
      highlights: dto.highlights,
      description: dto.description,
      step2Completed: true,
    });

    return this.findListingForHost(listingId, listing.hostId);
  }

  async uploadListingPhotos(files: Express.Multer.File[]): Promise<CloudinaryUploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No photos uploaded');
    }

    if (files.length > 5) {
      throw new BadRequestException('Maximum 5 photos allowed');
    }

    return Promise.all(files.map((file) => this.cloudinaryService.uploadListingPhoto(file)));
  }

  /**
   * Complete Step 3: Booking & Pricing (first time)
   */
  async completeStep3(
    listingId: string,
    hostId: string,
    dto: Step3BookingPricingDto,
  ): Promise<Listing> {
    const listing = await this.findListingForHost(listingId, hostId);

    if (listing.step3Completed) {
      throw new BadRequestException('Step 3 already completed. Use PATCH to update.');
    }

    return this.applyStep3(listing, dto);
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
    return this.applyStep3(listing, dto);
  }

  /**
   * Apply Step 3 data to listing
   */
  private async applyStep3(
    listing: Listing,
    dto: Step3BookingPricingDto,
  ): Promise<Listing> {
    listing.bookingSetting = dto.bookingSetting;
    listing.weekdayPrice = dto.weekdayPrice;
    listing.weekdayAfterTaxPrice = dto.weekdayAfterTaxPrice;
    listing.weekendPrice = dto.weekendPrice;
    listing.weekendAfterTaxPrice = dto.weekendAfterTaxPrice;
    listing.step3Completed = true;

    return this.listingRepository.save(listing);
  }

  /**
   * Complete Step 4: Discounts (first time) - Creates discounts for listing
   */
  async completeStep4(
    listingId: string,
    hostId: string,
    dto: Step4DiscountsDto,
  ): Promise<Listing> {
    const listing = await this.findListingForHost(listingId, hostId);

    if (listing.step4Completed) {
      throw new BadRequestException('Step 4 already completed. Use PATCH to update.');
    }

    return this.applyStep4(listing, dto);
  }

  /**
   * Update Step 4: Discounts
   */
  async updateStep4(
    listingId: string,
    hostId: string,
    dto: Step4DiscountsDto,
  ): Promise<Listing> {
    const listing = await this.findListingForHost(listingId, hostId);
    return this.applyStep4(listing, dto);
  }

  /**
   * Apply Step 4 data to listing - Creates/replaces discounts
   */
  private async applyStep4(
    listing: Listing,
    dto: Step4DiscountsDto,
  ): Promise<Listing> {
    await this.discountRepository.delete({ listingId: listing.id });

    if (dto.discounts && dto.discounts.length > 0) {
      const now = new Date();
      const listingId = listing.id;
      for (const d of dto.discounts) {
        await this.discountRepository.manager.query(
          `INSERT INTO discounts (id, listing_id, name, description, "discountPercentage", "isActive", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)`,
          [
            listingId,
            d.name,
            d.description ?? null,
            d.discountPercentage,
            d.isActive ?? true,
            now,
            now,
          ],
        );
      }
    }

    await this.listingRepository.update(listing.id, {
      safetyDetails: dto.safetyDetails,
      hostCountry: dto.hostCountry,
      hostStreetAddress: dto.hostStreetAddress,
      hostAptFloor: dto.hostAptFloor ?? null,
      hostCity: dto.hostCity,
      hostState: dto.hostState,
      hostPostalCode: dto.hostPostalCode ?? null,
      hostingAsBusiness: dto.hostingAsBusiness,
      step4Completed: true,
    });
    return this.findListingForHost(listing.id, listing.hostId);
  }

  /**
   * Publish a listing (all required steps must be completed)
   */
  async publish(listingId: string, hostId: string): Promise<Listing> {
    const listing = await this.findListingForHost(listingId, hostId);

    // Validate required steps are completed
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
    await this.findListingForHost(listingId, hostId);
    await this.listingRepository.delete({ id: listingId });
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
