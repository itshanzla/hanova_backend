import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './modules/user/entities/user.entity';
import { Otp } from './modules/otp/entities/otp.entity';
import { Listing } from './modules/listing/entities/listing.entity';
import { ListingPhoto } from './modules/listing/entities/listing-photo.entity';
import { Discount } from './modules/listing/entities/discount.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Otp, Listing, ListingPhoto, Discount],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false,
  },
});