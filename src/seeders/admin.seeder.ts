import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { User } from '../modules/user/entities/user.entity';
import { Otp } from '../modules/otp/entities/otp.entity';
import { UserRole } from '../modules/user/enums/role.enum';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Otp],
  synchronize: false,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false,
  },
});

async function seedAdmin() {
  try {
    await AppDataSource.initialize();

    const userRepository = AppDataSource.getRepository(User);
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@havnova.com' },
    });

    if (existingAdmin) {
      await AppDataSource.destroy();
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    const admin = userRepository.create({
      name: 'Admin User',
      email: 'admin@havnova.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isEmailVerified: true,
    });

    await userRepository.save(admin);

    console.log('Admin user created successfully!');
    console.log('Email: admin@havnova.com');
    console.log('Password: Admin@123');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seedAdmin();