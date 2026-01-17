import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config/configuration';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  migrationsRun: false,
  migrationsTableName: 'migrations',
});

// For TypeORM CLI
export default AppDataSource;
