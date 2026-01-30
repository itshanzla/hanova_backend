import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Listing, ListingPhoto, Discount } from './entities';
import { ListingService } from './services';
import { ListingController, PublicController } from './controllers';
import { CloudinaryModule } from '../../common/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Listing, ListingPhoto, Discount]), CloudinaryModule],
  controllers: [ListingController, PublicController],
  providers: [ListingService],
  exports: [ListingService],
})
export class ListingModule {}