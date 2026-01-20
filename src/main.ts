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
  const port = configService.get<number>('PORT') || 3000;
  const backendUrl = configService.get<string>('BACKEND_URL') || `http://localhost:${port}`;
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

  const config = new DocumentBuilder()
    .setTitle('Havnova API')
    .setDescription(
      `# Havnova Backend API\n\n` +
        `## API Information\n` +
        `- **Backend URL**: ${backendUrl}\n` +
        `- **Frontend URL**: ${frontendUrl}\n` +
        `- **API Documentation**: ${backendUrl}/api-docs\n\n` +
        `## Social Login URLs\n` +
        `- **Google Login**: [${backendUrl}/auth/google](${backendUrl}/auth/google)\n` +
        `- **Facebook Login**: [${backendUrl}/auth/facebook](${backendUrl}/auth/facebook)\n\n` +
        `## Authentication Methods\n` +
        `### Email/Password Authentication\n` +
        `1. Sign up with email and password\n` +
        `2. Verify email with OTP\n` +
        `3. Login with credentials\n\n` +
        `### Social Login (Google/Facebook)\n` +
        `1. Click on the social login link above\n` +
        `2. Authorize with provider\n` +
        `3. Auto-register or auto-login\n` +
        `4. Redirect to frontend with JWT tokens\n\n` +
        `## Authorization\n` +
        `Use the **Authorize** button above to add your JWT token for protected endpoints.`,
    )
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Admin', 'Admin-only user management endpoints')
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
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'Havnova API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customCss: `
      .swagger-ui .topbar {
        background-color: #f8f9fa;
        border-bottom: 2px solid #e9ecef;
      }
      .swagger-ui .info {
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }
      .swagger-ui .info .title {
        color: #1a1a1a;
        font-weight: 600;
      }
      .swagger-ui .info .description {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 6px;
        border-left: 4px solid #007bff;
        margin-top: 15px;
      }
      .swagger-ui {
        background-color: #f5f5f5;
      }
      .swagger-ui .scheme-container {
        background-color: #ffffff;
        padding: 15px;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }
      .swagger-ui .opblock {
        background-color: #ffffff;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        margin-bottom: 15px;
      }
      .swagger-ui .opblock .opblock-summary {
        border-radius: 6px 6px 0 0;
      }
      .swagger-ui .btn.authorize {
        background-color: #28a745;
        border-color: #28a745;
      }
      .swagger-ui .btn.authorize:hover {
        background-color: #218838;
        border-color: #1e7e34;
      }
      .swagger-ui .opblock-tag {
        background-color: #ffffff;
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }
    `,
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
