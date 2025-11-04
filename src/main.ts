import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TokenService } from '@modules/auth/services/token.service';
import { AuthGuard } from '@common/guards/auth.guard';
import { GlobalExceptionFilter } from '@common/filters/http-exception.filter';

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

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global authentication guard
  const reflector = app.get(Reflector);
  const tokenService = app.get(TokenService);
  app.useGlobalGuards(new AuthGuard(reflector, tokenService));

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('World Cup Prediction API')
    .setDescription(
      'API for World Cup group stage predictions with OTP authentication',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Token',
        description: 'Enter your authentication token',
      },
      'bearer',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('prediction', 'Prediction endpoints')
    .addTag('team', 'Team management')
    .addTag('admin', 'Admin operations')
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
