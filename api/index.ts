import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';

const server: Express = express();

const createNestServer = async (expressInstance: Express) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

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
      `Use the **Authorize** button above to add your JWT token for protected endpoints.`
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
  });

  await app.init();

  return app;
};

createNestServer(server)
  .then(() => console.log('Nest Ready'))
  .catch((err) => console.error('Nest broken', err));

export default server;
