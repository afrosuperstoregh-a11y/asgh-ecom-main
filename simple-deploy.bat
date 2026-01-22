@echo off
REM AfroSuperStore Simple Deployment Script
REM Step-by-step deployment with better error handling

setlocal enabledelayedexpansion

echo ========================================
echo AfroSuperStore Simple Deployment
echo ========================================
echo.

REM Configuration
set DREAMHOST_USER=dh_t5hb7x
set DREAMHOST_SERVER=vps68200.dreamhostps.com
set DOMAIN=www.afrosuperstore.ca

echo Checking SSH connection...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "echo 'SSH connection successful'"
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to server
    echo Please check your SSH credentials and server address
    pause
    exit /b 1
)

echo SSH connection successful!
echo.

:menu
echo ========================================
echo Choose step to run:
echo ========================================
echo 1. Create directories
echo 2. Upload files
echo 3. Start services
echo 4. Setup SSL
echo 5. Run migrations
echo 6. Exit
echo ========================================
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto directories
if "%choice%"=="2" goto upload
if "%choice%"=="3" goto services
if "%choice%"=="4" goto ssl
if "%choice%"=="5" goto migrations
if "%choice%"=="6" exit
echo Invalid choice.
goto menu

:directories
echo.
echo Creating directory structure...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "mkdir -p ~/afrosuperstore.ca && mkdir -p ~/afrosuperstore.ca/nginx && mkdir -p ~/afrosuperstore.ca/nginx/ssl && mkdir -p ~/afrosuperstore.ca/logs && mkdir -p ~/afrosuperstore.ca/database"
if %errorlevel% equ 0 (
    echo ✓ Directories created successfully
) else (
    echo ✗ Failed to create directories
)
pause
goto menu

:upload
echo.
echo Uploading files...
echo Uploading docker-compose.yml...
scp docker-compose.dreamhost.yml %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/afrosuperstore.ca/
if %errorlevel% equ 0 (
    echo ✓ docker-compose.yml uploaded
) else (
    echo ✗ Failed to upload docker-compose.yml
)

echo Uploading nginx configuration...
scp -r nginx/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/afrosuperstore.ca/
if %errorlevel% equ 0 (
    echo ✓ nginx configuration uploaded
) else (
    echo ✗ Failed to upload nginx configuration
)

echo Uploading application...
scp -r ecommerce-platform/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/afrosuperstore.ca/
if %errorlevel% equ 0 (
    echo ✓ application uploaded
) else (
    echo ✗ Failed to upload application
)

echo Uploading environment file...
scp .env.dreamhost %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/afrosuperstore.ca/.env
if %errorlevel% equ 0 (
    echo ✓ environment file uploaded
) else (
    echo ✗ Failed to upload environment file
)

echo.
echo File upload completed!
pause
goto menu

:services
echo.
echo Managing Docker services...
echo Stopping existing services...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd ~/afrosuperstore.ca && docker-compose down"
if %errorlevel% equ 0 (
    echo ✓ Services stopped
) else (
    echo ✗ Failed to stop services
)

echo Starting services...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd ~/afrosuperstore.ca && docker-compose up -d --build"
if %errorlevel% equ 0 (
    echo ✓ Services started
) else (
    echo ✗ Failed to start services
)

echo Checking service status...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd ~/afrosuperstore.ca && docker-compose ps"
pause
goto menu

:ssl
echo.
echo Setting up SSL certificates...
echo.
echo SSL Options:
echo 1. Let's Encrypt (recommended)
echo 2. Manual upload
set /p ssl_choice="Choose SSL option (1-2): "

if "%ssl_choice%"=="1" goto letsencrypt
if "%ssl_choice%"=="2" goto manual_ssl
echo Invalid choice.
goto ssl

:letsencrypt
echo Setting up Let's Encrypt...
scp scripts/setup-ssl.sh %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "chmod +x ~/setup-ssl.sh && ~/setup-ssl.sh letsencrypt"
if %errorlevel% equ 0 (
    echo ✓ Let's Encrypt setup initiated
) else (
    echo ✗ Let's Encrypt setup failed
)
pause
goto menu

:manual_ssl
echo Manual SSL setup...
set /p cert_file="Enter path to certificate file: "
set /p key_file="Enter path to private key file: "

if exist "%cert_file%" (
    if exist "%key_file%" (
        echo Uploading SSL certificates...
        scp "%cert_file%" %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/afrosuperstore.ca/nginx/ssl/www.afrosuperstore.ca.crt
        scp "%key_file%" %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/afrosuperstore.ca/nginx/ssl/www.afrosuperstore.ca.key
        
        if %errorlevel% equ 0 (
            echo ✓ SSL certificates uploaded
            echo Restarting nginx...
            ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd ~/afrosuperstore.ca && docker-compose restart nginx"
        ) else (
            echo ✗ Failed to upload SSL certificates
        )
    ) else (
        echo ✗ Private key file not found
    )
) else (
    echo ✗ Certificate file not found
)
pause
goto menu

:migrations
echo.
echo Running database migrations...
scp database/migrate.sh %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/
scp -r database/migrations/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "chmod +x ~/migrate.sh && ~/migrate.sh migrate"
if %errorlevel% equ 0 (
    echo ✓ Database migrations completed
) else (
    echo ✗ Database migrations failed
)
pause
goto menu

:exit
echo.
echo Thank you for using AfroSuperStore Deployment!
pause
