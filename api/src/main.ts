import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Punto de entrada de la aplicación NestJS — configura Swagger, pipes globales y arranca el servidor
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Pipe de validación global — transforma y valida DTOs automáticamente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de Swagger/OpenAPI — documentación interactiva en /api/docs
  const config = new DocumentBuilder()
    .setTitle('Associated API')
    .setDescription('ERP ligero para colectividades españolas')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Puerto configurado por variable de entorno o 3000 por defecto
  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
}

bootstrap().catch((err: unknown) => {
  console.error('Error al arrancar la aplicación:', err);
  process.exit(1);
});
