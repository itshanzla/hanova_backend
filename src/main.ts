import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ConfigService } from '@nestjs/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/** OpenAPI request body content for application/json */
interface JsonContent {
  schema?: unknown;
  example?: unknown;
  examples?: Record<string, { value?: unknown }>;
}

interface OperationWithRequestBody {
  requestBody?: {
    content?: {
      'application/json'?: JsonContent;
    };
  };
}

/**
 * Ensures every request body in the OpenAPI document has a default `example`
 * so Swagger UI "Try it out" shows a pre-filled request payload.
 */
function patchRequestBodyExamples(document: Record<string, unknown>): void {
  const paths = document.paths as Record<string, Record<string, OperationWithRequestBody>> | undefined;
  if (!paths) return;

  for (const pathKey of Object.keys(paths)) {
    const pathItem = paths[pathKey];
    if (!pathItem || typeof pathItem !== 'object') continue;

    const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation?.requestBody) continue;

      const content = operation.requestBody.content;
      if (!content) continue;

      const jsonContent = content['application/json'];
      if (!jsonContent) continue;

      // Ensure Swagger UI "Try it out" shows a pre-filled request body: set top-level example from first example
      if (jsonContent.example === undefined && jsonContent.examples && typeof jsonContent.examples === 'object') {
        const firstKey = Object.keys(jsonContent.examples)[0];
        const firstExample = firstKey ? jsonContent.examples[firstKey] : null;
        if (firstExample && typeof firstExample === 'object' && 'value' in firstExample) {
          jsonContent.example = firstExample.value;
          // Some Swagger UI versions also use schema.example
          if (jsonContent.schema && typeof jsonContent.schema === 'object' && !('$ref' in jsonContent.schema)) {
            (jsonContent.schema as Record<string, unknown>).example = firstExample.value;
          }
        }
      }
    }
  }
}

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
  app.useGlobalInterceptors(new LoggingInterceptor());

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
        `- **HOST** - Creates and manages rental listings with discounts\n` +
        `- **USER** - Views published listings\n\n` +
        `## Listing Creation Flow\n` +
        `1. **POST /listings** - Create listing with Property Details (Step 1)\n` +
        `2. **POST /listings/{id}/step-2** - Complete Step 2: Amenities, Safety & Media\n` +
        `3. **POST /listings/{id}/step-3** - Complete Step 3: Booking & Pricing\n` +
        `4. **POST /listings/{id}/step-4** - (Optional) Complete Step 4: Create Discounts\n` +
        `5. **POST /listings/{id}/publish** - Publish the listing\n\n` +
        `## Updating Steps\n` +
        `Use **PATCH /listings/{id}/step-X** to update any completed step.\n\n` +
        `**Request body & examples:** Click **Try it out** to see and edit the example payload.\n\n` +
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
    .addTag('Listings (Host)', 'Host endpoints for creating and managing rental listings with discounts')
    .addTag('Public - Listings', 'Public endpoints for viewing published listings')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Ensure request body examples are visible in Swagger UI "Try it out"
  patchRequestBodyExamples(document as unknown as Record<string, unknown>);

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      displayRequestDuration: true,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
      tryItOutEnabled: true,
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
  const portValue = configService.get<string>('PORT') ?? process.env.PORT ?? '3000';
  const port = Number(portValue) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}`);
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
