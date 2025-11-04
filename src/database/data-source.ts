import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'worldcup',

  // Entity locations (same as your config)
  entities: [__dirname + '/../**/*.entity.{js,ts}'],

  // Migration locations (same as your config)
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],

  // Important: synchronize should be FALSE for migrations
  synchronize: false,
});
