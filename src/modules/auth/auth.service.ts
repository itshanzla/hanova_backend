import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { OtpService } from '../otp/otp.service';
import { EmailService } from '../../common/email/email.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { OtpType } from '../otp/enums/otp-type.enum';
import { ApiResponse } from '../../utils/apiResponse';
import { UserRole } from '../user/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private otpService: OtpService,
    private emailService: EmailService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'default-secret',
      expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION') || '15m',
    } as any);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'default-secret',
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION') || '7d',
    } as any);

    return { accessToken, refreshToken };
  }

  async signup(signupDto: SignupDto) {
    const { name, email, password, role } = signupDto;

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userService.create({
      name,
      email,
      password: hashedPassword,
      role,
      isEmailVerified: false,
    });

    const otp = await this.otpService.createOtp(
      user.id,
      OtpType.EMAIL_VERIFICATION,
    );

    await this.emailService.sendOtpEmail(
      email,
      otp.code,
      OtpType.EMAIL_VERIFICATION,
    );

    return ApiResponse.CREATED(
      { userId: user.id, name: user.name, email: user.email, isEmailVerified: user.isEmailVerified, role: user.role },
      'User registered successfully. Please verify your email with the OTP sent.',
    );
  }

  async verifyEmail(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const isValid = await this.otpService.verifyOtp(
      user.id,
      otp,
      OtpType.EMAIL_VERIFICATION,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.userService.update(user.id, { isEmailVerified: true });

    await this.otpService.deleteUserOtps(user.id, OtpType.EMAIL_VERIFICATION);

    await this.emailService.sendWelcomeEmail(user.email, user.name);

    return ApiResponse.SUCCESS(null, 'Email verified successfully');
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    return ApiResponse.SUCCESS(
      {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      'Login successful',
    );
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = this.generateTokens(user.id, user.email, user.role);

      return ApiResponse.SUCCESS(
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        'Token refreshed successfully',
      );
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.userService.findByEmail(email);
    if (!user) {
      return ApiResponse.SUCCESS(
        null,
        'Password reset otp sent to your email',
      );
    }

    await this.otpService.deleteUserOtps(user.id, OtpType.PASSWORD_RESET);

    const otp = await this.otpService.createOtp(user.id, OtpType.PASSWORD_RESET);

    await this.emailService.sendOtpEmail(
      email,
      otp.code,
      OtpType.PASSWORD_RESET,
    );

    return ApiResponse.SUCCESS(
      null,
      'Password reset email sent to your email',
    );
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, otp, newPassword } = resetPasswordDto;

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid request');
    }

    const isValid = await this.otpService.verifyOtp(
      user.id,
      otp,
      OtpType.PASSWORD_RESET,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userService.update(user.id, { password: hashedPassword });

    await this.otpService.deleteUserOtps(user.id, OtpType.PASSWORD_RESET);

    return ApiResponse.SUCCESS(null, 'Password reset successfully');
  }

  async resendOtp(email: string, type: OtpType) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (type === OtpType.EMAIL_VERIFICATION && user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.otpService.deleteUserOtps(user.id, type);

    const otp = await this.otpService.createOtp(user.id, type);

    await this.emailService.sendOtpEmail(email, otp.code, type);

    return ApiResponse.SUCCESS(null, 'OTP sent successfully');
  }

  async getProfile(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return ApiResponse.SUCCESS(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      'User profile retrieved successfully',
    );
  }

  // Handle Social Login (Google, Facebook, Apple)
  async handleSocialLogin(profile: any) {
    const { email, name, googleId, facebookId, picture } = profile;

    if (!email) {
      throw new BadRequestException('Email not provided by OAuth provider');
    }

    let authProvider: 'google' | 'facebook' | 'apple' = 'google';
    let providerId = googleId;

    if (facebookId) {
      authProvider = 'facebook';
      providerId = facebookId;
    }

    let user = await this.userService.findByEmail(email);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await this.userService.create({
        name: name || email.split('@')[0],
        email,
        password: await bcrypt.hash(providerId || email, 10),
        role: UserRole.USER,
        isEmailVerified: true,
        authProvider,
        socialProviderId: providerId,
        profilePicture: picture || null,
      });

      await this.emailService.sendWelcomeEmail(user.email, user.name);
    }

    const { accessToken, refreshToken } = this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    return ApiResponse.SUCCESS(
      {
        accessToken,
        refreshToken,
        isNewUser,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          authProvider: user.authProvider,
          profilePicture: user.profilePicture,
        },
      },
      isNewUser ? 'Account created successfully' : 'Social login successful',
    );
  }
}