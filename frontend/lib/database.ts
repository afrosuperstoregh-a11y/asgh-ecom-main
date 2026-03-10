// Serverless-compatible database connection
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

// Create a singleton database connection for serverless
let db: any = null;

export function getDatabase() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    
    const pool = new Pool({ connectionString });
    db = drizzle(pool);
  }
  return db;
}

// Helper function for serverless database operations
export async function withDatabase<T>(
  operation: (db: any) => Promise<T>
): Promise<T> {
  const db = getDatabase();
  try {
    return await operation(db);
  } catch (error) {
    console.error('Database operation failed:', error);
    throw error;
  }
}
