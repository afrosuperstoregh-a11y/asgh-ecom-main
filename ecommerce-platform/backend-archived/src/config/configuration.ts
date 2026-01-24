import * as dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string, defaultValue: string): string => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required but not set`);
    }
    return defaultValue;
  }
  return value;
};

export const config = {
  database: {
    host: getEnv('DB_HOST', 'localhost'),
    port: parseInt(getEnv('DB_PORT', '5432'), 10),
    username: getEnv('DB_USERNAME', 'postgres'),
    password: getEnv('DB_PASSWORD', 'postgres'),
    database: getEnv('DB_NAME', 'ecommerce_db'),
  },
  // Add other configuration as needed
} as const;
