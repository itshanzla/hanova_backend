import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: INestApplication;

async function createApp(): Promise<INestApplication> {
  if (app) {
    return app;
  }

  app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = configService
    .get<string>('ALLOWED_ORIGINS')
    ?.split(',')
    .map((origin) => origin.trim()) || ['http://localhost:5173', 'http://localhost:3001'];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization,Accept',
  });

  const backendUrl = configService.get<string>('BACKEND_URL') || 'http://localhost:3000';

  const config = new DocumentBuilder()
    .setTitle('Havnova API')
    .setDescription(
      `Havnova Backend API Documentation\n\n` +
        `## Roles\n` +
        `- **HOST** - Creates and manages rental listings\n` +
        `- **ADMIN** - Manages all listings and discounts\n` +
        `- **USER** - Views published listings\n\n` +
        `## Listing Creation Flow\n` +
        `1. Create a draft listing (POST /listings)\n` +
        `2. Complete Step 1: Property Details\n` +
        `3. Complete Step 2: Amenities, Safety & Media\n` +
        `4. Complete Step 3: Booking & Pricing\n` +
        `5. (Optional) Step 4: Apply Discounts\n` +
        `6. Publish the listing\n\n` +
        `**Social Login URLs:**\n` +
        `- Google Login: [${backendUrl}/auth/google](${backendUrl}/auth/google)\n` +
        `- Facebook Login: [${backendUrl}/auth/facebook](${backendUrl}/auth/facebook)`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT access token',
        in: 'header',
      },
    )
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Listings (Host)', 'Host endpoints for creating and managing rental listings')
    .addTag('Admin - Listings & Discounts', 'Admin endpoints for managing all listings and discounts')
    .addTag('Public - Listings', 'Public endpoints for viewing published listings')
    .addTag('Admin', 'Admin-specific endpoints (User management)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    ],
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
    ],
  });

  return app;
}

async function bootstrap() {
  const app = await createApp();
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await createApp();
  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
}

if (!process.env.VERCEL) {
  bootstrap();
}
