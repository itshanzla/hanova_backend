import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<string>('EMAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async sendOtpEmail(email: string, otp: string, type: string): Promise<void> {
    const subject =
      type === 'email_verification'
        ? 'Havnova - Email Verification OTP'
        : 'Havnova - Password Reset OTP';
    const title = type === 'email_verification' ? 'Verify Your Email' : 'Reset Your Password';
    const greeting =
      type === 'email_verification'
        ? 'Welcome to Havnova! You\'re just one step away from getting started.'
        : 'We received a request to reset your password.';
    const instruction =
      type === 'email_verification'
        ? 'Use the verification code below to confirm your email address:'
        : 'Use the code below to reset your password:';

    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_FROM'),
      to: email,
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <!-- Header -->
          <div style="background-color: #A1642E; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 2px;">HAVNOVA</h1>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px; background-color: #ffffff;">
            <h2 style="color: #000000; margin-top: 0; font-size: 24px; font-weight: 600;">${title}</h2>
            <p style="color: #000000; font-size: 16px; line-height: 1.6;">${greeting}</p>
            <p style="color: #000000; font-size: 16px; line-height: 1.6;">${instruction}</p>

            <!-- OTP Box -->
            <div style="background-color: #1a1a1a; padding: 25px; text-align: center; margin: 30px 0; border-radius: 8px; border: 2px solid #A1642E;">
              <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #A1642E;">${otp}</span>
            </div>

            <p style="color: #000000; font-size: 14px; line-height: 1.6;">
              This code will expire in <strong>5 minutes</strong>. Please do not share this code with anyone.
            </p>
            <p style="color: #666666; font-size: 13px; line-height: 1.6;">
              If you didn't request this code, you can safely ignore this email.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8f8f8; padding: 20px; text-align: center;">
            <p style="color: #000000; margin: 0; font-size: 12px;">&copy; ${new Date().getFullYear()} Havnova. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_FROM'),
      to: email,
      subject: 'Havnova - Welcome to Our Platform!',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <!-- Header -->
          <div style="background-color: #A1642E; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 2px;">HAVNOVA</h1>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px; background-color: #ffffff;">
            <h2 style="color: #000000; margin-top: 0; font-size: 28px; font-weight: 600; text-align: center;">Welcome to Havnova!</h2>


            <p style="color: #000000; font-size: 18px; line-height: 1.6; text-align: center; font-weight: 600; margin: 20px 0;">
              Hi ${name},
            </p>

            <p style="color: #000000; font-size: 16px; line-height: 1.8; text-align: center; margin: 15px 0;">
              Congratulations! Your email has been verified successfully.
            </p>

            <p style="color: #000000; font-size: 16px; line-height: 1.6; text-align: center; margin: 25px 0;">
              We're excited to have you on board!
            </p>

            <p style="color: #666666; font-size: 13px; line-height: 1.6; text-align: center;">
              If you have any questions or need assistance, feel free to reach out to our support team.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8f8f8; padding: 20px; text-align: center;">
            <p style="color: #000000; margin: 0; font-size: 12px;">&copy; ${new Date().getFullYear()} Havnova. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  }
}