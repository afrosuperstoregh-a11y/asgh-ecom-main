# Simplified API Setup Script
# Run this script from the ecommerce-platform directory

# 1. Create directory structure
$apiDirs = @(
    "api/src/config",
    "api/src/controllers",
    "api/src/middleware",
    "api/src/routes",
    "api/src/services",
    "api/src/types",
    "api/src/utils",
    "api/prisma",
    "api/logs"
)

foreach ($dir in $apiDirs) {
    if (-not (Test-Path -Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Green
    }
}

# 2. Initialize package.json if it doesn't exist
if (-not (Test-Path -Path "api\package.json")) {
    Set-Location api
    npm init -y
    Set-Location ..
}

# 3. Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Cyan
Set-Location api

# Install production dependencies
npm install --save express cors helmet morgan express-rate-limit http-status-codes redis @prisma/client bcryptjs jsonwebtoken dotenv winston typesense

# Install development dependencies
npm install --save-dev typescript ts-node-dev @types/node @types/express @types/cors @types/morgan @types/jsonwebtoken @types/bcryptjs @types/redis tsconfig-paths

# 4. Create basic files
# Create .env file
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
"@ | Out-File -FilePath ".env" -Encoding utf8

# Create tsconfig.json
@"
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
"@ | Out-File -FilePath "tsconfig.json" -Encoding utf8

# Create basic error handler
$errorHandler = @"
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
"@
$errorHandler | Out-File -FilePath "src\middleware\errorHandler.ts" -Encoding utf8

# Create ApiError utility
$apiError = @"
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
"@
$apiError | Out-File -FilePath "src\utils\ApiError.ts" -Encoding utf8

# 5. Initialize Prisma
npx prisma init

# 6. Update package.json scripts
$packageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json

# Create a new scripts object with properly escaped strings
$scripts = @{
    "dev" = "ts-node-dev --respawn --transpile-only src/index.ts"
    "build" = "tsc"
    "start" = "node dist/index.js"
    "test" = "echo `"Error: no test specified`""
    "prisma:generate" = "prisma generate"
    "prisma:migrate" = "prisma migrate dev"
    "prisma:studio" = "prisma studio"
}

# Convert the scripts to a proper JSON string
$scriptsJson = $scripts | ConvertTo-Json -Compress

# Update the package.json
$packageJson.scripts = $scripts
$packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path "package.json" -Encoding utf8

# 7. Create basic index.ts
$indexTs = @"
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
"@
$indexTs | Out-File -FilePath "src\index.ts" -Encoding utf8

# 8. Create logger utility
$logger = @"
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ecommerce-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export { logger };
"@
$logger | Out-File -FilePath "src\utils\logger.ts" -Encoding utf8

Write-Host "`nAPI setup complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update the .env file with your configuration"
Write-Host "2. Run 'npx prisma generate' to generate the Prisma client"
Write-Host "3. Run 'npx prisma migrate dev --name init' to create the database schema"
Write-Host "4. Run 'npm run dev' to start the development server"
Write-Host "`nThe API will be available at http://localhost:3001" -ForegroundColor Cyan

Set-Location ..