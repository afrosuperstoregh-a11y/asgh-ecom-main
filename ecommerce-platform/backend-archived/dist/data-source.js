"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const configuration_1 = require("./config/configuration");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: configuration_1.config.database.host,
    port: configuration_1.config.database.port,
    username: configuration_1.config.database.username,
    password: configuration_1.config.database.password,
    database: configuration_1.config.database.database,
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    entities: ['src/**/*.entity{.ts,.js}'],
    migrations: ['src/migrations/*{.ts,.js}'],
    migrationsRun: false,
    migrationsTableName: 'migrations',
});
exports.default = exports.AppDataSource;
//# sourceMappingURL=data-source.js.map