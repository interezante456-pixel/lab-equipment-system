import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Cabeceras de seguridad HTTP con Helmet
  app.use(helmet());

  // 2. CORS habilitado para frontend React (Vite y Nginx)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Prefijo global de API
  app.setGlobalPrefix('api');

  // 4. Validación estricta con class-validator (Regex de N0XXXXXXXX, etc.)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Servidor backend de Laboratorio corriendo en: http://localhost:${port}/api`);
}

bootstrap();
