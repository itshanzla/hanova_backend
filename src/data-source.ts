import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './modules/user/entities/user.entity';
import { Otp } from './modules/otp/entities/otp.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Otp],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false,
  },
});