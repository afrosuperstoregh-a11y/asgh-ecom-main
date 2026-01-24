// backend/ormconfig.js
require('ts-node/register');
const { config } = require('./src/config/configuration');

module.exports = {
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: false, // Keep this false to use migrations
  logging: process.env.NODE_ENV === 'development',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  cli: {
    migrationsDir: 'src/migrations',
  },
};