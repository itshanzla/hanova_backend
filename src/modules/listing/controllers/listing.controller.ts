import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../user/enums/role.enum';
import { User } from '../../user/entities/user.entity';
import { ListingService } from '../services/listing.service';
import type { CloudinaryUploadResult } from '../../../common/cloudinary/cloudinary.service';
import {
  Step1PropertyDetailsDto,
  Step2AmenitiesMediaDto,
  Step3BookingPricingDto,
  Step4DiscountsDto,
} from '../dto';
import {
  ApiResponse as ApiResponseUtil,
  type ApiResponsePayload,
} from '../../../utils/apiResponse';
import {
  ApiCreateListing,
  ApiGetMyListings,
  ApiGetMyListing,
  ApiCompleteStep2,
  ApiCompleteStep3,
  ApiCompleteStep4,
  ApiUpdateStep1,
  ApiUpdateStep2,
  ApiUpdateStep3,
  ApiUpdateStep4,
  ApiPublishListing,
  ApiUnpublishListing,
  ApiDeleteListing,
  ApiUploadListingPhotos,
} from '../swagger';

@ApiTags('Listings (Host)')
@Controller('listings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HOST)
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  // =====================
  // CREATE LISTING (with Step 1)
  // =====================

  @Post()
  @ApiCreateListing()
  async createListing(
    @Body() dto: Step1PropertyDetailsDto,
    @CurrentUser() user: User,
  ) {
    const listing = await this.listingService.createListing(user.id, dto);
    return ApiResponseUtil.CREATED(listing, 'Listing created with property details');
  }

  // =====================
  // GET LISTINGS
  // =====================

  @Get()
  @ApiGetMyListings()
  async getMyListings(@CurrentUser() user: User) {
    const listings = await this.listingService.getHostListings(user.id);
    return ApiResponseUtil.SUCCESS(listings, 'Listings retrieved');
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

  // =====================
  // COMPLETE STEPS (POST - First time)
  // =====================

  @Post('photos/upload')
  @ApiUploadListingPhotos()
  @UseInterceptors(
    FilesInterceptor('photos', 5, {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5,
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(new BadRequestException('Only image files are allowed'), false);
        }
        return callback(null, true);
      },
    }),
  )
  async uploadListingPhotos(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ApiResponsePayload<CloudinaryUploadResult[]>> {
    const uploads = await this.listingService.uploadListingPhotos(files);
    return ApiResponseUtil.CREATED(uploads, 'Photos uploaded');
  }

  @Post(':id/step-2')
  @ApiCompleteStep2()
  async completeStep2(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Step2AmenitiesMediaDto,
    @CurrentUser() user: User,
  ) {
    const listing = await this.listingService.completeStep2(id, user.id, dto);
    return ApiResponseUtil.CREATED(listing, 'Step 2 completed');
  }

  @Post(':id/step-3')
  @ApiCompleteStep3()
  async completeStep3(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Step3BookingPricingDto,
    @CurrentUser() user: User,
  ) {
    const listing = await this.listingService.completeStep3(id, user.id, dto);
    return ApiResponseUtil.CREATED(listing, 'Step 3 completed');
  }

  @Post(':id/step-4')
  @ApiCompleteStep4()
  async completeStep4(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Step4DiscountsDto,
    @CurrentUser() user: User,
  ) {
    const listing = await this.listingService.completeStep4(id, user.id, dto);
    return ApiResponseUtil.CREATED(listing, 'Step 4 completed');
  }

  // =====================
  // UPDATE STEPS (PATCH)
  // =====================

  @Patch(':id/step-1')
  @ApiUpdateStep1()
  async updateStep1(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Step1PropertyDetailsDto,
    @CurrentUser() user: User,
  ) {
    const listing = await this.listingService.updateStep1(id, user.id, dto);
    return ApiResponseUtil.SUCCESS(listing, 'Step 1 updated');
  }

  @Patch(':id/step-2')
  @ApiUpdateStep2()
  async updateStep2(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Step2AmenitiesMediaDto,
    @CurrentUser() user: User,
  ) {
    const listing = await this.listingService.updateStep2(id, user.id, dto);
    return ApiResponseUtil.SUCCESS(listing, 'Step 2 updated');
  }

  @Patch(':id/step-3')
  @ApiUpdateStep3()
  async updateStep3(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Step3BookingPricingDto,
    @CurrentUser() user: User,
  ) {
    const listing = await this.listingService.updateStep3(id, user.id, dto);
    return ApiResponseUtil.SUCCESS(listing, 'Step 3 updated');
  }

  @Patch(':id/step-4')
  @ApiUpdateStep4()
  async updateStep4(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Step4DiscountsDto,
    @CurrentUser() user: User,
  ) {
    const listing = await this.listingService.updateStep4(id, user.id, dto);
    return ApiResponseUtil.SUCCESS(listing, 'Step 4 updated');
  }

  // =====================
  // PUBLISH / UNPUBLISH
  // =====================

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

  // =====================
  // DELETE
  // =====================

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
