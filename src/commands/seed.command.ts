import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TeamSeeder } from '../database/seeds/team.seeder';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SeedCommand');

  try {
    logger.log('🌱 Starting database seeding...');

    const app = await NestFactory.createApplicationContext(AppModule);

    // Get seeder
    const teamSeeder = app.get(TeamSeeder);

    // Run seed
    await teamSeeder.seed();

    logger.log('✅ Database seeding completed successfully');

    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

bootstrap();
