@echo off
REM AfroSuperStore Windows Deployment Script
REM This script helps deploy to DreamHost VPS from Windows

setlocal enabledelayedexpansion

echo ========================================
echo AfroSuperStore Deployment to DreamHost
echo ========================================
echo.

REM Configuration
set DREAMHOST_USER=afrosuperstore
set DREAMHOST_SERVER=vps68200.dreamhostps.com
set DOMAIN=www.afrosuperstore.ca

echo Checking prerequisites...
where ssh >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: SSH is not installed or not in PATH
    echo Please install Git for Windows or OpenSSH
    pause
    exit /b 1
)

where scp >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: SCP is not installed or not in PATH
    echo Please install Git for Windows or OpenSSH
    pause
    exit /b 1
)

echo Prerequisites check passed!
echo.

:menu
echo ========================================
echo Choose deployment option:
echo ========================================
echo 1. Initial Server Setup
echo 2. Deploy Application
echo 3. Setup SSL Certificates
echo 4. Run Database Migrations
echo 5. Check Monitoring Status
echo 6. Full Deployment (Setup + Deploy + SSL + Migrate)
echo 7. Exit
echo ========================================
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto setup
if "%choice%"=="2" goto deploy
if "%choice%"=="3" goto ssl
if "%choice%"=="4" goto migrate
if "%choice%"=="5" goto monitor
if "%choice%"=="6" goto full
if "%choice%"=="7" exit

echo Invalid choice. Please try again.
goto menu

:setup
echo.
echo Running initial server setup...
echo This will install Docker, configure firewall, and create directories.
echo.
set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" goto menu

echo Copying setup script to server...
scp scripts/setup-dreamhost.sh %DREAMHOST_USER%@%DREAMHOST_SERVER%:/tmp/

echo Running setup script...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "chmod +x /tmp/setup-dreamhost.sh && /tmp/setup-dreamhost.sh"

echo.
echo Initial server setup completed!
echo Next step: Deploy Application (option 2)
pause
goto menu

:deploy
echo.
echo Deploying application...
echo This will deploy all files and start services.
echo.
set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" goto menu

echo Copying deployment files...
scp -r docker-compose.dreamhost.yml %DREAMHOST_USER%@%DREAMHOST_SERVER%:/home/%DREAMHOST_USER%/afrosuperstore.ca/docker-compose.yml
scp -r nginx/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:/home/%DREAMHOST_USER%/afrosuperstore.ca/
scp -r ecommerce-platform/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:/home/%DREAMHOST_USER%/afrosuperstore.ca/
scp .env.dreamhost %DREAMHOST_USER%@%DREAMHOST_SERVER%:/home/%DREAMHOST_USER%/afrosuperstore.ca/.env

echo Starting services...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd /home/%DREAMHOST_USER%/afrosuperstore.ca && docker-compose down && docker-compose up -d --build"

echo Waiting for services to start...
timeout /t 30 /nobreak >nul

echo Checking service status...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd /home/%DREAMHOST_USER%/afrosuperstore.ca && docker-compose ps"

echo.
echo Application deployed!
echo Next step: Setup SSL Certificates (option 3)
pause
goto menu

:ssl
echo.
echo Setting up SSL certificates...
echo.
echo SSL Options:
echo 1. Let's Encrypt (recommended)
echo 2. Manual certificates
echo 3. Self-signed (testing only)
set /p ssl_choice="Choose SSL option (1-3): "

if "%ssl_choice%"=="1" goto letsencrypt
if "%ssl_choice%"=="2" goto manual_ssl
if "%ssl_choice%"=="3" goto self_signed_ssl
echo Invalid choice.
goto ssl

:letsencrypt
echo Setting up Let's Encrypt certificates...
scp scripts/setup-ssl.sh %DREAMHOST_USER%@%DREAMHOST_SERVER%:/tmp/
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "chmod +x /tmp/setup-ssl.sh && /tmp/setup-ssl.sh letsencrypt"
goto ssl_complete

:manual_ssl
echo Manual SSL setup requires certificate files.
echo Please ensure you have:
echo - Certificate file (.crt or .pem)
echo - Private key file (.key)
echo.
set /p confirm="Continue with manual setup? (y/n): "
if /i not "%confirm%"=="y" goto ssl

set /p cert_file="Enter path to certificate file: "
set /p key_file="Enter path to private key file: "

scp "%cert_file%" %DREAMHOST_USER%@%DREAMHOST_SERVER%:/home/%DREAMHOST_USER%/afrosuperstore.ca/nginx/ssl/www.afrosuperstore.ca.crt
scp "%key_file%" %DREAMHOST_USER%@%DREAMHOST_SERVER%:/home/%DREAMHOST_USER%/afrosuperstore.ca/nginx/ssl/www.afrosuperstore.ca.key

ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd /home/%DREAMHOST_USER%/afrosuperstore.ca && docker-compose restart nginx"
goto ssl_complete

:self_signed_ssl
echo Setting up self-signed certificates (for testing only)...
scp scripts/setup-ssl.sh %DREAMHOST_USER%@%DREAMHOST_SERVER%:/tmp/
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "chmod +x /tmp/setup-ssl.sh && /tmp/setup-ssl.sh self-signed"
goto ssl_complete

:ssl_complete
echo SSL setup completed!
echo Next step: Run Database Migrations (option 4)
pause
goto menu

:migrate
echo.
echo Running database migrations...
echo.
set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" goto menu

scp database/migrate.sh %DREAMHOST_USER%@%DREAMHOST_SERVER%:/tmp/
scp -r database/migrations/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:/tmp/

ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "chmod +x /tmp/migrate.sh && /tmp/migrate.sh migrate"

echo.
echo Database migrations completed!
pause
goto menu

:monitor
echo.
echo Checking monitoring status...
echo.

echo Checking service health...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd /home/%DREAMHOST_USER%/afrosuperstore.ca && docker-compose ps"

echo.
echo Checking website accessibility...
curl -f -s "https://%DOMAIN%/health" >nul 2>&1
if %errorlevel% equ 0 (
    echo Website is accessible ✓
) else (
    echo Website is not responding ✗
)

echo.
echo Checking SSL certificate...
echo | openssl s_client -connect %DOMAIN%:443 -servername %DOMAIN% 2>nul | openssl x509 -noout -dates 2>nul | findstr "notAfter" >nul 2>&1
if %errorlevel% equ 0 (
    echo SSL certificate is valid ✓
) else (
    echo SSL certificate check failed ✗
)

pause
goto menu

:full
echo.
echo Starting FULL DEPLOYMENT...
echo This will perform: Setup + Deploy + SSL + Migrate
echo.
set /p confirm="This will take 10-15 minutes. Continue? (y/n): "
if /i not "%confirm%"=="y" goto menu

echo Step 1: Initial Server Setup
scp scripts/setup-dreamhost.sh %DREAMHOST_USER%@%DREAMHOST_SERVER%:/tmp/
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "chmod +x /tmp/setup-dreamhost.sh && /tmp/setup-dreamhost.sh"

echo.
echo Step 2: Deploy Application
scp -r docker-compose.dreamhost.yml %DREAMHOST_USER%@%DREAMHOST_SERVER%:/home/%DREAMHOST_USER%/afrosuperstore.ca/docker-compose.yml
scp -r nginx/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:/home/%DREAMHOST_USER%/afrosuperstore.ca/
scp -r ecommerce-platform/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:/home/%DREAMHOST_USER%/afrosuperstore.ca/
scp .env.dreamhost %DREAMHOST_USER%@%DREAMHOST_SERVER%:/home/%DREAMHOST_USER%/afrosuperstore.ca/.env
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd /home/%DREAMHOST_USER%/afrosuperstore.ca && docker-compose down && docker-compose up -d --build"

echo Waiting for services to start...
timeout /t 30 /nobreak >nul

echo.
echo Step 3: Setup SSL Certificates (Let's Encrypt)
scp scripts/setup-ssl.sh %DREAMHOST_USER%@%DREAMHOST_SERVER%:/tmp/
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "chmod +x /tmp/setup-ssl.sh && /tmp/setup-ssl.sh letsencrypt"

echo.
echo Step 4: Run Database Migrations
scp database/migrate.sh %DREAMHOST_USER%@%DREAMHOST_SERVER%:/tmp/
scp -r database/migrations/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:/tmp/
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "chmod +x /tmp/migrate.sh && /tmp/migrate.sh migrate"

echo.
echo ========================================
echo FULL DEPLOYMENT COMPLETED!
echo ========================================
echo Your AfroSuperStore should be live at:
echo https://www.afrosuperstore.ca
echo.
echo Next steps:
echo 1. Check website accessibility
echo 2. Configure payment processing (Stripe)
echo 3. Set up email notifications
echo 4. Configure monitoring alerts
echo ========================================
pause
goto menu

:exit
echo.
echo Thank you for using AfroSuperStore Deployment Script!
echo.
pause
