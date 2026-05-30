const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
    this.requestId = null;
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  generateRequestId() {
    return crypto.randomBytes(16).toString('hex');
  }

  setRequestId(requestId) {
    this.requestId = requestId;
  }

  formatLogEntry(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      requestId: this.requestId || 'system',
      environment: process.env.NODE_ENV || 'development',
      ...meta
    };

    return JSON.stringify(logEntry);
  }

  writeLog(level, message, meta = {}) {
    const logEntry = this.formatLogEntry(level, message, meta);
    const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
    
    // Write to log file
    fs.appendFileSync(logFile, logEntry + '\n');
    
    // Also log to console with appropriate formatting
    if (process.env.NODE_ENV !== 'production') {
      const colorMap = {
        error: '\x1b[31m',   // Red
        warn: '\x1b[33m',    // Yellow
        info: '\x1b[36m',    // Cyan
        debug: '\x1b[37m'    // White
      };
      const reset = '\x1b[0m';
      const color = colorMap[level] || '';
      console.log(`${color}[${level.toUpperCase()}]${reset} ${message}`, meta);
    }
  }

  // Authentication events
  auth(message, success = true, meta = {}) {
    this.writeLog('info', message, {
      category: 'authentication',
      success,
      ...meta
    });
  }

  // Payment events
  payment(message, success = true, meta = {}) {
    this.writeLog('info', message, {
      category: 'payment',
      success,
      ...meta
    });
  }

  // Order events
  order(message, success = true, meta = {}) {
    this.writeLog('info', message, {
      category: 'order',
      success,
      ...meta
    });
  }

  // Database events
  database(message, success = true, meta = {}) {
    this.writeLog('info', message, {
      category: 'database',
      success,
      ...meta
    });
  }

  // API events
  api(message, method, url, statusCode, meta = {}) {
    this.writeLog('info', message, {
      category: 'api',
      method,
      url,
      statusCode,
      ...meta
    });
  }

  // Security events
  security(message, threat = 'unknown', meta = {}) {
    this.writeLog('warn', message, {
      category: 'security',
      threat,
      ...meta
    });
  }

  // Performance events
  performance(message, duration, meta = {}) {
    this.writeLog('info', message, {
      category: 'performance',
      duration,
      ...meta
    });
  }

  // Rate limit events
  rateLimit(message, ip, meta = {}) {
    this.writeLog('warn', message, {
      category: 'rate_limit',
      ip,
      ...meta
    });
  }

  // Standard logging methods
  info(message, meta = {}) {
    this.writeLog('info', message, meta);
  }

  error(message, meta = {}) {
    this.writeLog('error', message, meta);
  }

  warn(message, meta = {}) {
    this.writeLog('warn', message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog('debug', message, meta);
    }
  }

  // Structured error logging
  logError(error, context = {}) {
    this.error(error.message, {
      stack: error.stack,
      name: error.name,
      code: error.code,
      ...context
    });
  }

  // Health check logging
  health(message, checks = {}) {
    this.writeLog('info', message, {
      category: 'health',
      checks,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new Logger();
