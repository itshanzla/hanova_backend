import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Listing, ListingPhoto, Discount } from './entities';
import { ListingService, DiscountService } from './services';
import { ListingController, AdminController, PublicController } from './controllers';

@Module({
  imports: [TypeOrmModule.forFeature([Listing, ListingPhoto, Discount])],
  controllers: [ListingController, AdminController, PublicController],
  providers: [ListingService, DiscountService],
  exports: [ListingService, DiscountService],
})
export class ListingModule {}
