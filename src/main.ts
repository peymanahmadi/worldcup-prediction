import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get Configurtion
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port');

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('World Cup Prediction API')
    .setDescription(
      'API for World Cup group stage predictions with OTP authentication',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  await app.listen(port ?? 3000);

  console.log(`
    🚀 Application is running on: http://localhost:${port}
    📚 Swagger Documentation: http://localhost:${port}/api/docs
    🐰 RabbitMQ Management: http://localhost:15672
  `);
}
bootstrap();
