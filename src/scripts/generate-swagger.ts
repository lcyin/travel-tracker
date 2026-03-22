import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

async function generateSwaggerSchema() {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Travel Tracker API')
    .setDescription('API documentation for Travel Tracker backend services')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter access token',
      },
      'access-token',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  const outputPath = resolve(process.cwd(), 'openapi.json');

  writeFileSync(outputPath, JSON.stringify(swaggerDocument, null, 2), 'utf-8');

  await app.close();
}

generateSwaggerSchema().catch((error: unknown) => {
  console.error('Failed to generate Swagger schema:', error);
  process.exit(1);
});
