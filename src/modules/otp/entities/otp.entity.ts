import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OtpType } from '../enums/otp-type.enum';
import { User } from '../../user/entities/user.entity';

@Entity('otps')
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 6 })
  code: string;

  @Column({
    type: 'enum',
    enum: OtpType,
  })
  type: OtpType;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.otps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}