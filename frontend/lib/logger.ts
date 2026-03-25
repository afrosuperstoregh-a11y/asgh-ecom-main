// Production-ready logging utility
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Log levels for structured logging
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

// Log entry interface for structured logging
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Sanitize sensitive data from logs
const sanitizeData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'auth', 'credential',
    'ssn', 'socialSecurityNumber', 'creditCard', 'cardNumber',
    'bankAccount', 'routingNumber', 'pin', 'cvv', 'cvc'
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    if (typeof key === 'string' && sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    )) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
};

// Production logging service interface
interface LoggingService {
  sendLogs(logs: LogEntry[]): Promise<void>;
}

// Mock logging service for development
class MockLoggingService implements LoggingService {
  async sendLogs(logs: LogEntry[]): Promise<void> {
    if (isDevelopment) {
      logs.forEach(log => {
        const levelName = LogLevel[log.level];
        const contextStr = log.context ? ` | Context: ${JSON.stringify(log.context)}` : '';
        const componentStr = log.component ? ` | Component: ${log.component}` : '';
        const actionStr = log.action ? ` | Action: ${log.action}` : '';
        
        console.log(`[${levelName}] ${log.timestamp} | ${log.message}${contextStr}${componentStr}${actionStr}`);
        
        if (log.error) {
          console.error('Error details:', log.error);
        }
      });
    }
  }
}

// Production logging service (would integrate with your logging provider)
class ProductionLoggingService implements LoggingService {
  private endpoint: string;
  private apiKey: string;

  constructor() {
    this.endpoint = process.env.NEXT_PUBLIC_LOG_ENDPOINT || '/api/logs';
    this.apiKey = process.env.NEXT_PUBLIC_LOG_API_KEY || '';
  }

  async sendLogs(logs: LogEntry[]): Promise<void> {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ logs }),
      });
    } catch (error) {
      // Fail silently in production to avoid breaking the app
      if (isDevelopment) {
        console.error('Failed to send logs to service:', error);
      }
    }
  }
}

export class Logger {
  private static instance: Logger;
  private logBuffer: LogEntry[] = [];
  private loggingService: LoggingService;
  private flushInterval: NodeJS.Timeout | null = null;
  private maxBufferSize = 100;
  private flushDelay = 5000; // 5 seconds

  private constructor() {
    this.loggingService = isDevelopment ? new MockLoggingService() : new ProductionLoggingService();
    
    // Set up periodic flushing in production
    if (!isDevelopment && !isTest) {
      this.flushInterval = setInterval(() => {
        this.flush();
      }, this.flushDelay);
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    options: {
      context?: Record<string, any>;
      userId?: string;
      sessionId?: string;
      component?: string;
      action?: string;
      error?: Error;
    } = {}
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: options.context ? sanitizeData(options.context) : undefined,
      userId: options.userId,
      sessionId: options.sessionId,
      component: options.component,
      action: options.action,
      error: options.error ? {
        name: options.error.name,
        message: options.error.message,
        stack: options.error.stack
      } : undefined
    };
  }

  private log(entry: LogEntry): void {
    if (isDevelopment) {
      // In development, log immediately
      this.loggingService.sendLogs([entry]);
    } else {
      // In production, buffer logs
      this.logBuffer.push(entry);
      
      // Flush if buffer is full
      if (this.logBuffer.length >= this.maxBufferSize) {
        this.flush();
      }
    }
  }

  // Flush buffered logs to the logging service
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.loggingService.sendLogs(logsToSend);
    } catch (error) {
      // In production, add failed logs back to buffer (up to a limit)
      if (!isDevelopment && this.logBuffer.length < this.maxBufferSize / 2) {
        this.logBuffer.unshift(...logsToSend);
      }
    }
  }

  // Logging methods
  error(message: string, options?: Omit<Parameters<typeof this.createLogEntry>[2], 'error'>, error?: Error): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, { ...options, error });
    this.log(entry);
  }

  warn(message: string, options?: Omit<Parameters<typeof this.createLogEntry>[2], 'error'>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, options);
    this.log(entry);
  }

  info(message: string, options?: Omit<Parameters<typeof this.createLogEntry>[2], 'error'>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, options);
    this.log(entry);
  }

  debug(message: string, options?: Omit<Parameters<typeof this.createLogEntry>[2], 'error'>): void {
    if (isDevelopment) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, options);
      this.log(entry);
    }
  }

  trace(message: string, options?: Omit<Parameters<typeof this.createLogEntry>[2], 'error'>): void {
    if (isDevelopment) {
      const entry = this.createLogEntry(LogLevel.TRACE, message, options);
      this.log(entry);
    }
  }

  // Specialized logging methods
  auth(operation: string, success: boolean, error?: string, userId?: string): void {
    const message = `Auth operation: ${operation} - ${success ? 'SUCCESS' : 'FAILED'}`;
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    
    const entry = this.createLogEntry(level, message, {
      component: 'Auth',
      action: operation,
      userId,
      context: { success, error }
    });
    
    this.log(entry);
  }

  api(method: string, url: string, status: number, duration: number, error?: Error): void {
    const success = status >= 200 && status < 400;
    const message = `API ${method} ${url} - ${status} (${duration}ms)`;
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    
    const entry = this.createLogEntry(level, message, {
      component: 'API',
      action: `${method} ${url}`,
      context: { method, url, status, duration },
      error
    });
    
    this.log(entry);
  }

  performance(operation: string, duration: number, context?: Record<string, any>): void {
    const message = `Performance: ${operation} took ${duration}ms`;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, {
      component: 'Performance',
      action: operation,
      context: { duration, ...context }
    });
    
    this.log(entry);
  }

  user(action: string, userId?: string, context?: Record<string, any>): void {
    const message = `User action: ${action}`;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, {
      component: 'User',
      action,
      userId,
      context
    });
    
    this.log(entry);
  }

  // Cleanup method
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export backward compatible API
export const legacyLogger = {
  log: (message: string, ...args: any[]) => logger.debug(message, { context: { args } }),
  warn: (message: string, ...args: any[]) => logger.warn(message, { context: { args } }),
  error: (message: string, ...args: any[]) => logger.error(message, { context: { args } }),
  info: (message: string, ...args: any[]) => logger.info(message, { context: { args } }),
  debug: (message: string, ...args: any[]) => logger.debug(message, { context: { args } }),
  auth: (operation: string, success: boolean, error?: string) => logger.auth(operation, success, error)
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    logger.flush();
  });
}

export default logger;
