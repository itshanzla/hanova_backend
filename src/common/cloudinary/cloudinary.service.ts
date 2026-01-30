import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
}

@Injectable()
export class CloudinaryService {
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    this.isConfigured = Boolean(cloudName && apiKey && apiSecret);

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  private ensureConfigured(): void {
    if (!this.isConfigured) {
      throw new InternalServerErrorException('Cloudinary is not configured');
    }
  }

  async uploadListingPhoto(file: Express.Multer.File): Promise<CloudinaryUploadResult> {
    this.ensureConfigured();

    if (!file?.buffer) {
      throw new InternalServerErrorException('Upload failed: missing file buffer');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'listings',
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            return reject(new InternalServerErrorException('Failed to upload image'));
          }
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }
}
