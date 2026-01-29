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
import { CreateDiscountDto, UpdateDiscountDto } from '../dto';
import { ApiResponse as ApiResponseUtil } from '../../../utils/apiResponse';
import {
  ApiAdminGetAllListings,
  ApiAdminGetListing,
  ApiCreateDiscount,
  ApiGetAllDiscounts,
  ApiGetDiscount,
  ApiUpdateDiscount,
  ApiDeleteDiscount,
} from '../swagger';

@ApiTags('Admin - Listings & Discounts')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly listingService: ListingService,
    private readonly discountService: DiscountService,
  ) {}

  // ========================
  // LISTINGS (Admin)
  // ========================

  @Get('listings')
  @ApiAdminGetAllListings()
  async getAllListings() {
    const listings = await this.listingService.getAllListings();
    return ApiResponseUtil.SUCCESS(listings, 'All listings retrieved');
  }

  @Get('listings/:id')
  @ApiAdminGetListing()
  async getListingById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const listing = await this.listingService.getListingWithOwnershipCheck(id, user);
    return ApiResponseUtil.SUCCESS(listing, 'Listing retrieved');
  }

  // ========================
  // DISCOUNTS (Admin)
  // ========================

  @Post('discounts')
  @ApiCreateDiscount()
  async createDiscount(@Body() dto: CreateDiscountDto) {
    const discount = await this.discountService.create(dto);
    return ApiResponseUtil.CREATED(discount, 'Discount created');
  }

  @Get('discounts')
  @ApiGetAllDiscounts()
  async getAllDiscounts() {
    const discounts = await this.discountService.findAll();
    return ApiResponseUtil.SUCCESS(discounts, 'Discounts retrieved');
  }

  @Get('discounts/:id')
  @ApiGetDiscount()
  async getDiscountById(@Param('id', ParseUUIDPipe) id: string) {
    const discount = await this.discountService.findById(id);
    return ApiResponseUtil.SUCCESS(discount, 'Discount retrieved');
  }

  @Put('discounts/:id')
  @ApiUpdateDiscount()
  async updateDiscount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDiscountDto,
  ) {
    const discount = await this.discountService.update(id, dto);
    return ApiResponseUtil.SUCCESS(discount, 'Discount updated');
  }

  @Delete('discounts/:id')
  @ApiDeleteDiscount()
  async deleteDiscount(@Param('id', ParseUUIDPipe) id: string) {
    await this.discountService.delete(id);
    return ApiResponseUtil.SUCCESS(null, 'Discount deleted');
  }
}
