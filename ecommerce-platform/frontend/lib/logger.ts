// Environment-safe logging utility
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[DEV] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(`[DEV] ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.error(`[DEV] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.info(`[DEV] ${message}`, ...args);
    }
  },
  
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.debug(`[DEV] ${message}`, ...args);
    }
  },
  
  // Safe logging for sensitive operations - never logs sensitive data
  auth: (operation: string, success: boolean, error?: string) => {
    if (isDevelopment) {
      console.log(`[AUTH] ${operation}: ${success ? 'SUCCESS' : 'FAILED'}`);
      if (error && isDevelopment) {
        console.log(`[AUTH] Error: ${error}`);
      }
    }
  }
};

export default logger;
