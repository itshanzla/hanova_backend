import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Otp } from './entities/otp.entity';
import { OtpType } from './enums/otp-type.enum';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    private configService: ConfigService,
  ) {}

  generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createOtp(userId: string, type: OtpType): Promise<Otp> {
    const code = this.generateOtpCode();
    const expirationMinutes = this.configService.get<number>(
      'OTP_EXPIRATION_MINUTES',
      5,
    );
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

    const otp = this.otpRepository.create({
      code,
      type,
      userId,
      expiresAt,
    });

    return await this.otpRepository.save(otp);
  }

  async verifyOtp(
    userId: string,
    code: string,
    type: OtpType,
  ): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: {
        userId,
        code,
        type,
        isUsed: false,
      },
    });

    if (!otp) {
      return false;
    }

    if (new Date() > otp.expiresAt) {
      return false;
    }

    otp.isUsed = true;
    await this.otpRepository.save(otp);

    return true;
  }

  async deleteExpiredOtps(): Promise<void> {
    await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async deleteUserOtps(userId: string, type: OtpType): Promise<void> {
    await this.otpRepository.delete({
      userId,
      type,
    });
  }
}