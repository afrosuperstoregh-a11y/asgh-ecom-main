import { PrismaClient } from '@prisma/client';

class DatabaseClient {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        errorFormat: 'pretty',
      });
    }

    return DatabaseClient.instance;
  }

  public static async connect(): Promise<void> {
    try {
      const prisma = DatabaseClient.getInstance();
      await prisma.$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  public static async disconnect(): Promise<void> {
    try {
      const prisma = DatabaseClient.getInstance();
      await prisma.$disconnect();
      console.log('Database disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      const prisma = DatabaseClient.getInstance();
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

export const db = DatabaseClient.getInstance();

export const initializeDatabase = async (): Promise<void> => {
  await DatabaseClient.connect();
};
