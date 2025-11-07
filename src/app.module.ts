import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

// Import Configuration
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import rabbitmqConfig from './config/rabbitmq.config';

// Import modules
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './modules/redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { LoggerMiddleware } from '@common/middleware/logger.middleware';
import { TeamModule } from './modules/team/team.module';
import { PredictionModule } from './modules/prediction/prediction.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { QueueModule } from '@modules/queue/queue.module';
import { AdminModule } from '@modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, rabbitmqConfig],
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get<TypeOrmModuleOptions>('database')!,
    }),
    AuthModule,
    RedisModule,
    HealthModule,
    TeamModule,
    PredictionModule,
    ScoringModule,
    // QueueModule,
    AdminModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
