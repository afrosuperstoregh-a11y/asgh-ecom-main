# Initialize API project
Write-Host "Initializing API project..." -ForegroundColor Green

# Create required directories
$directories = @(
    "src/config",
    "src/controllers",
    "src/middleware",
    "src/models",
    "src/routes",
    "src/services",
    "src/types",
    "src/utils"
)

foreach ($dir in $directories) {
    $fullPath = Join-Path -Path "api" -ChildPath $dir
    if (-not (Test-Path -Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "Created directory: $fullPath" -ForegroundColor Cyan
    }
}

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Green
Set-Location api

# Install production dependencies
npm install --save express cors helmet morgan express-rate-limit http-status-codes redis @prisma/client bcryptjs jsonwebtoken dotenv winston typesense

# Install development dependencies
npm install --save-dev typescript ts-node-dev @types/node @types/express @types/cors @types/morgan @types/jsonwebtoken @types/bcryptjs @types/redis tsconfig-paths

# Initialize TypeScript
npx tsc --init

# Initialize Prisma
npx prisma generate

Write-Host "`nAPI project setup complete!" -ForegroundColor Green
Write-Host "Run 'docker-compose up -d' to start the development environment." -ForegroundColor Yellow
