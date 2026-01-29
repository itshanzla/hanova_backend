import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../user/enums/role.enum';
import { User } from '../../user/entities/user.entity';
import { ListingService } from '../services/listing.service';
import { DiscountService } from '../services/discount.service';
import {
  Step1PropertyDetailsDto,
  Step2AmenitiesMediaDto,
  Step3BookingPricingDto,
  Step4DiscountsDto,
} from '../dto';
import { ApiResponse as ApiResponseUtil } from '../../../utils/apiResponse';
import {
  ApiCreateDraft,
  ApiGetMyListings,
  ApiGetMyListing,
  ApiUpdateStep1,
  ApiUpdateStep2,
  ApiUpdateStep3,
  ApiUpdateStep4,
  ApiPublishListing,
  ApiUnpublishListing,
  ApiDeleteListing,
  ApiGetAvailableDiscounts,
} from '../swagger';

@ApiTags('Listings (Host)')
@Controller('listings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HOST)
export class ListingController {
  constructor(
    private readonly listingService: ListingService,
    private readonly discountService: DiscountService,
  ) {}

  @Post()
  @ApiCreateDraft()
  async createDraft(@CurrentUser() user: User) {
    const listing = await this.listingService.createDraft(user.id);
    return ApiResponseUtil.CREATED(listing, 'Draft listing created');
  }

  @Get()
  @ApiGetMyListings()
  async getMyListings(@CurrentUser() user: User) {
    const listings = await this.listingService.getHostListings(user.id);
    return ApiResponseUtil.SUCCESS(listings, 'Listings retrieved');
  }

  @Get('discounts/available')
  @ApiGetAvailableDiscounts()
  async getAvailableDiscounts() {
    const discounts = await this.discountService.findActive();
    return ApiResponseUtil.SUCCESS(discounts, 'Active discounts retrieved');
  }

  @Get(':id')
  @ApiGetMyListing()
  async getMyListing(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const listing = await this.listingService.getHostListing(id, user.id);
    return ApiResponseUtil.SUCCESS(listing, 'Listing retrieved');
  }

  @Put(':id/step-1')
  @ApiUpdateStep1()
  async updateStep1(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Step1PropertyDetailsDto,
    @CurrentUser() user: User,
  ) {
    const listing = await this.listingService.updateStep1(id, user.id, dto);
    return ApiResponseUtil.SUCCESS(listing, 'Step 1 updated');
  }

  @Put(':id/step-2')
  @ApiUpdateStep2()
  async updateStep2(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Step2AmenitiesMediaDto,
    @CurrentUser() user: User,
  ) {
    const listing = await this.listingService.updateStep2(id, user.id, dto);
    return ApiResponseUtil.SUCCESS(listing, 'Step 2 updated');
  }

  @Put(':id/step-3')
  @ApiUpdateStep3()
  async updateStep3(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Step3BookingPricingDto,
    @CurrentUser() user: User,
  ) {
    const listing = await this.listingService.updateStep3(id, user.id, dto);
    return ApiResponseUtil.SUCCESS(listing, 'Step 3 updated');
  }

  @Put(':id/step-4')
  @ApiUpdateStep4()
  async updateStep4(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Step4DiscountsDto,
    @CurrentUser() user: User,
  ) {
    const listing = await this.listingService.updateStep4(id, user.id, dto);
    return ApiResponseUtil.SUCCESS(listing, 'Step 4 updated');
  }

  @Post(':id/publish')
  @ApiPublishListing()
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const listing = await this.listingService.publish(id, user.id);
    return ApiResponseUtil.SUCCESS(listing, 'Listing published');
  }

  @Post(':id/unpublish')
  @ApiUnpublishListing()
  async unpublish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const listing = await this.listingService.unpublish(id, user.id);
    return ApiResponseUtil.SUCCESS(listing, 'Listing unpublished');
  }

  @Delete(':id')
  @ApiDeleteListing()
  async deleteListing(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.listingService.deleteListing(id, user.id);
    return ApiResponseUtil.SUCCESS(null, 'Listing deleted');
  }
}
