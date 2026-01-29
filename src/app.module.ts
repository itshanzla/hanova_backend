import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { OtpModule } from './modules/otp/otp.module';
import { EmailModule } from './common/email/email.module';
import { ListingModule } from './modules/listing/listing.module';
import { User } from './modules/user/entities/user.entity';
import { Otp } from './modules/otp/entities/otp.entity';
import { Listing, ListingPhoto, Discount } from './modules/listing/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [User, Otp, Listing, ListingPhoto, Discount],
          migrations: ['dist/migrations/*.js'],
          synchronize: false,
          ssl: databaseUrl?.includes('localhost') ? false : {
            rejectUnauthorized: false,
          },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    OtpModule,
    EmailModule,
    ListingModule,
  ],
})
export class AppModule {}
