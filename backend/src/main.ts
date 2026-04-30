import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://dh52111401.id.vn', // Frontend tunnel
      
    ],
    methods: 'GET, HEAD, PUT, POST, PATCH, DELETE, OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  app.use(json({limit: '50mb'}))
  app.use(urlencoded({extended: true, limit: '50mb'}))
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });
  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  
}
bootstrap();
