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

  // Configure CORS with allowed origins from environment variables
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

  // Swagger Configuration
  const backendUrl = configService.get<string>('BACKEND_URL') || 'http://localhost:3000';

  const config = new DocumentBuilder()
    .setTitle('Havnova API')
    .setDescription(
      `Havnova Backend API Documentation\n\n` +
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
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and authorization endpoints')
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

// Local development
async function bootstrap() {
  const app = await createApp();
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await createApp();
  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
}

// Run bootstrap only in non-Vercel environment
if (!process.env.VERCEL) {
  bootstrap();
}
