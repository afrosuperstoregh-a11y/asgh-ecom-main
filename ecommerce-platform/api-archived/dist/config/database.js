"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.db = void 0;
const client_1 = require("@prisma/client");
class DatabaseClient {
    constructor() { }
    static getInstance() {
        if (!DatabaseClient.instance) {
            DatabaseClient.instance = new client_1.PrismaClient({
                log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
                errorFormat: 'pretty',
            });
        }
        return DatabaseClient.instance;
    }
    static async connect() {
        try {
            const prisma = DatabaseClient.getInstance();
            await prisma.$connect();
            console.log('Database connected successfully');
        }
        catch (error) {
            console.error('Failed to connect to database:', error);
            throw error;
        }
    }
    static async disconnect() {
        try {
            const prisma = DatabaseClient.getInstance();
            await prisma.$disconnect();
            console.log('Database disconnected successfully');
        }
        catch (error) {
            console.error('Error disconnecting from database:', error);
            throw error;
        }
    }
    static async healthCheck() {
        try {
            const prisma = DatabaseClient.getInstance();
            await prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }
}
exports.db = DatabaseClient.getInstance();
const initializeDatabase = async () => {
    await DatabaseClient.connect();
};
exports.initializeDatabase = initializeDatabase;
