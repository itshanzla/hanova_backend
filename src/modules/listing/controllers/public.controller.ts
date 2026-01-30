import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListingService } from '../services/listing.service';
import { ApiResponse as ApiResponseUtil } from '../../../utils/apiResponse';
import {
  ApiGetPublishedListings,
  ApiGetPublishedListing,
} from '../swagger';

@ApiTags('Public - Listings')
@Controller('public/listings')
export class PublicController {
  constructor(private readonly listingService: ListingService) {}

  @Get()
  @ApiGetPublishedListings()
  async getPublishedListings() {
    const listings = await this.listingService.getPublishedListings();
    return ApiResponseUtil.SUCCESS(listings, 'Published listings retrieved');
  }

  @Get(':id')
  @ApiGetPublishedListing()
  async getPublishedListing(@Param('id', ParseUUIDPipe) id: string) {
    const listing = await this.listingService.getPublishedListing(id);
    return ApiResponseUtil.SUCCESS(listing, 'Listing retrieved');
  }
}
