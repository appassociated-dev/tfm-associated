import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Punto de entrada de la aplicación NestJS.
 * Configura validación global y documentación Swagger.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Prefijo global para todas las rutas de la API
  app.setGlobalPrefix('api');

  // Validación global con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de Swagger en /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Associated API')
    .setDescription('ERP ligero para colectividades españolas')
    .setVersion('0.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
