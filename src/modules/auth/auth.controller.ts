import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { OtpType } from '../otp/enums/otp-type.enum';
import { ApiResponse } from '../../utils/apiResponse';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @SwaggerApiResponse({
    status: 201,
    description: 'User registered successfully. Please verify your email with the OTP sent.',
    schema: {
      example: {
        status: 201,
        response: 'Created',
        message: 'User registered successfully. Please verify your email with the OTP sent.',
        data: {
          userId: 'uuid-here',
          name: 'John Doe',
          email: 'john@example.com',
          isEmailVerified: false,
          role: 'host',
        },
      },
    },
  })
  @SwaggerApiResponse({
    status: 409,
    description: 'Email already exists',
  })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with OTP' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      example: {
        status: 200,
        response: 'OK',
        message: 'Email verified successfully',
        data: null,
      },
    },
  })
  @SwaggerApiResponse({
    status: 400,
    description: 'Invalid or expired OTP',
  })
  async verifyEmail(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyEmail(verifyOtpDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        status: 200,
        response: 'OK',
        message: 'Login successful',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 'uuid-here',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'user',
          },
        },
      },
    },
  })
  @SwaggerApiResponse({
    status: 401,
    description: 'Invalid credentials or email not verified',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset OTP' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Password reset otp sent to your email',
    schema: {
      example: {
        status: 200,
        response: 'OK',
        message: 'Password reset otp sent to your email',
        data: null,
      },
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with OTP' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      example: {
        status: 200,
        response: 'OK',
        message: 'Password reset successfully',
        data: null,
      },
    },
  })
  @SwaggerApiResponse({
    status: 400,
    description: 'Invalid or expired OTP',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'john@example.com',
        },
        type: {
          type: 'string',
          enum: ['email_verification', 'password_reset'],
          example: 'email_verification',
        },
      },
    },
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    schema: {
      example: {
        status: 200,
        response: 'OK',
        message: 'OTP sent successfully',
        data: null,
      },
    },
  })
  @SwaggerApiResponse({
    status: 400,
    description: 'User not found or email already verified',
  })
  async resendOtp(
    @Body('email') email: string,
    @Body('type') type: OtpType,
  ) {
    return this.authService.resendOtp(email, type);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      example: {
        status: 200,
        response: 'OK',
        message: 'Token refreshed successfully',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @SwaggerApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @SwaggerApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        status: 200,
        response: 'OK',
        message: 'User profile retrieved successfully',
        data: {
          id: 'uuid-here',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'host',
          isEmailVerified: true,
        },
      },
    },
  })
  @SwaggerApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login (redirects to Google)' })
  @ApiExcludeEndpoint()
  async googleAuth() {
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.handleSocialLogin(req.user);

    const redirectUrl =
      this.configService.get<string>('FRONTEND_REDIRECT_URL') ||
      'http://localhost:5173/auth/callback';

    const fullRedirectUrl = `${redirectUrl}?accessToken=${result.data.accessToken}&refreshToken=${result.data.refreshToken}&isNewUser=${result.data.isNewUser}`;

    return res.redirect(fullRedirectUrl);
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Initiate Facebook OAuth login (redirects to Facebook)' })
  @ApiExcludeEndpoint()
  async facebookAuth() {
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @ApiExcludeEndpoint()
  async facebookAuthCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.handleSocialLogin(req.user);

    const redirectUrl =
      this.configService.get<string>('FRONTEND_REDIRECT_URL') ||
      'http://localhost:5173/auth/callback';

    const fullRedirectUrl = `${redirectUrl}?accessToken=${result.data.accessToken}&refreshToken=${result.data.refreshToken}&isNewUser=${result.data.isNewUser}`;

    return res.redirect(fullRedirectUrl);
  }
}