import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../enums/role.enum';
import { Otp } from '../../otp/entities/otp.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({
    type: 'enum',
    enum: ['email', 'google', 'facebook', 'apple'],
    default: 'email',
    nullable: false,
  })
  authProvider: 'email' | 'google' | 'facebook' | 'apple';

  @Column({ nullable: true })
  socialProviderId: string;

  @Column({ nullable: true })
  profilePicture: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Otp, (otp) => otp.user)
  otps: Otp[];
}