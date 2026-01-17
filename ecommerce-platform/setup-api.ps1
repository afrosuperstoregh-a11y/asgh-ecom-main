# API Setup Script for E-commerce Platform
# Run this script from the ecommerce-platform directory

# Set error action preference
$ErrorActionPreference = "Stop"

function Write-Header($text) {
    Write-Host "`n=== $text ===" -ForegroundColor Cyan
}

function Write-Success($text) {
    Write-Host "✓ $text" -ForegroundColor Green
}

function Write-Info($text) {
    Write-Host "• $text" -ForegroundColor Blue
}

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script requires administrator privileges. Please run as administrator." -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Success "Node.js is installed (Version: $nodeVersion)"
} catch {
    Write-Host "Node.js is not installed. Please install Node.js v18 or later and try again." -ForegroundColor Red
    exit 1
}

# Check if Docker is running
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker is not running"
    }
    Write-Success "Docker is running"
} catch {
    Write-Host "Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Create API directory structure
Write-Header "Creating API directory structure"

$apiDirs = @(
    "api/src/config",
    "api/src/controllers",
    "api/src/middleware",
    "api/src/routes",
    "api/src/services",
    "api/src/types",
    "api/src/utils"
)

foreach ($dir in $apiDirs) {
    if (-not (Test-Path -Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Info "Created directory: $dir"
    }
}

# Install dependencies
Write-Header "Installing dependencies"
Set-Location api

# Install production dependencies
Write-Info "Installing production dependencies..."
npm install --save express cors helmet morgan express-rate-limit http-status-codes redis @prisma/client bcryptjs jsonwebtoken dotenv winston typesense stripe

# Install development dependencies
Write-Info "Installing development dependencies..."
npm install --save-dev typescript ts-node-dev @types/node @types/express @types/cors @types/morgan @types/jsonwebtoken @types/bcryptjs @types/redis tsconfig-paths @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint prettier eslint-config-prettier eslint-plugin-prettier

# Initialize TypeScript if tsconfig.json doesn't exist
if (-not (Test-Path -Path "tsconfig.json")) {
    Write-Info "Initializing TypeScript..."
    npx tsc --init --target ES2020 --module CommonJS --outDir ./dist --rootDir ./src --strict --esModuleInterop --skipLibCheck true --forceConsistentCasingInFileNames
    
    # Update tsconfig.json
    $tsConfig = Get-Content -Path "tsconfig.json" -Raw | ConvertFrom-Json
    $tsConfig.compilerOptions.baseUrl = "."
    $tsConfig.compilerOptions.paths = @{
        "@/*" = @("src/*")
    }
    $tsConfig | ConvertTo-Json -Depth 10 | Set-Content -Path "tsconfig.json"
}

# Create .env file if it doesn't exist
if (-not (Test-Path -Path ".env")) {
    Write-Info "Creating .env file..."
    @"
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce?schema=public"

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=30d

# Redis
REDIS_URL=redis://localhost:6379

# Typesense
TYPESENSE_API_KEY=your_typesense_api_key
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Client URL
CLIENT_URL=http://localhost:3000
"@ | Set-Content -Path ".env"
}

# Create basic files if they don't exist
$srcPath = "src"

# Create basic error handler
if (-not (Test-Path -Path "$srcPath/middleware/errorHandler.ts")) {
    @"
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  console.error('Unhandled error:', err);
  
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
  });
};
"@ | Set-Content -Path "$srcPath/middleware/errorHandler.ts"
}

# Create ApiError utility
if (-not (Test-Path -Path "$srcPath/utils/ApiError.ts")) {
    @"
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
"@ | Set-Content -Path "$srcPath/utils/ApiError.ts"
}

# Create logger utility
if (-not (Test-Path -Path "$srcPath/utils/logger.ts")) {
    @"
import winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, align } = winston.format;

// Define log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ecommerce-api' },
  transports: [
    // Write all logs with level 'error' and below to 'error.log'
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: combine(timestamp(), logFormat)
    }),
    // Write all logs with level 'info' and below to 'combined.log'
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: combine(timestamp(), logFormat)
    }),
  ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      align(),
      logFormat
    ),
  }));
}

export { logger };
"@ | Set-Content -Path "$srcPath/utils/logger.ts"
}

# Create Redis config
if (-not (Test-Path -Path "$srcPath/config/redis.ts")) {
    @"
import { createClient } from 'redis';
import { logger } from '@/utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const connectRedis = async () => {
  try {
    const client = createClient({
      url: redisUrl,
    });

    client.on('error', (err) => {
      logger.error('Redis Client Error', err);
    });

    await client.connect();
    logger.info('Connected to Redis');
    
    return client;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    process.exit(1);
  }
};
"@ | Set-Content -Path "$srcPath/config/redis.ts"
}

# Create Typesense config
if (-not (Test-Path -Path "$srcPath/config/typesense.ts")) {
    @"
import { Client } from 'typesense';
import { logger } from '@/utils/logger';

export const connectTypesense = async () => {
  try {
    const client = new Client({
      nodes: [
        {
          host: process.env.TYPESENSE_HOST || 'localhost',
          port: parseInt(process.env.TYPESENSE_PORT || '8108'),
          protocol: process.env.TYPESENSE_PROTOCOL || 'http',
        },
      ],
      apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
      connectionTimeoutSeconds: 2,
    });

    // Test the connection
    await client.health.retrieve();
    logger.info('Connected to Typesense');
    
    return client;
  } catch (error) {
    logger.error('Failed to connect to Typesense:', error);
    process.exit(1);
  }
};
"@ | Set-Content -Path "$srcPath/config/typesense.ts"
}

# Create routes/index.ts
if (-not (Test-Path -Path "$srcPath/routes/index.ts")) {
    @"
import { Router } from 'express';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
"@ | Set-Content -Path "$srcPath/routes/index.ts"
}

# Create logs directory if it doesn't exist
if (-not (Test-Path -Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

# Generate Prisma client
Write-Header "Setting up Prisma"

# Create .env file for Prisma if it doesn't exist
if (-not (Test-Path -Path ".env")) {
    @"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce?schema=public"
"@ | Set-Content -Path ".env"
}

# Generate Prisma client
npx prisma generate

Write-Header "API Setup Complete"
Write-Success "API project has been set up successfully!"
Write-Info "Next steps:"
Write-Info "1. Update the .env file with your configuration"
Write-Info "2. Run 'npx prisma migrate dev --name init' to create the database schema"
Write-Info "3. Run 'npm run dev' to start the development server"
Write-Info "4. The API will be available at http://localhost:3001"

Set-Location ..
