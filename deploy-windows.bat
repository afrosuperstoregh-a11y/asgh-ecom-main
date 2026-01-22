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
set REMOTE_PATH=/home/afrosuperstore/afrosuperstore.ca

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

echo Creating remote directory structure...
echo Remote path: %REMOTE_PATH%
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "echo 'Creating base directory...' && mkdir -p %REMOTE_PATH% && echo 'Creating subdirectories...' && mkdir -p %REMOTE_PATH%/nginx && mkdir -p %REMOTE_PATH%/nginx/ssl && mkdir -p %REMOTE_PATH%/logs && mkdir -p %REMOTE_PATH%/database && mkdir -p %REMOTE_PATH%/ecommerce-platform && echo 'All directories created successfully'"

echo Verifying directories exist...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "ls -la %REMOTE_PATH%/ && echo 'Directory verification completed'"

echo Copying deployment files...
scp docker-compose.dreamhost.yml %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/docker-compose.yml
scp -r nginx/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/
scp -r ecommerce-platform/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/ecommerce-platform/
scp .env.dreamhost %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/.env

echo Starting services...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd %REMOTE_PATH% && docker-compose down && docker-compose up -d --build"

echo Waiting for services to start...
timeout /t 30 /nobreak >nul

echo Checking service status...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd %REMOTE_PATH% && docker-compose ps"

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

scp "%cert_file%" %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/nginx/ssl/www.afrosuperstore.ca.crt
scp "%key_file%" %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/nginx/ssl/www.afrosuperstore.ca.key

ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd %REMOTE_PATH% && docker-compose restart nginx"
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
echo Uploading setup script to user home directory...
scp scripts/setup-dreamhost.sh %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "chmod +x ~/setup-dreamhost.sh && ~/setup-dreamhost.sh"

echo.
echo Step 2: Deploy Application
echo.
echo === SSH COMMAND EXECUTION RESTRICTED ===
echo DreamHost server allows SSH connection but blocks automated commands
echo.
echo MANUAL DEPLOYMENT INSTRUCTIONS:
echo 1. Connect to server manually: ssh %DREAMHOST_USER%@%DREAMHOST_SERVER%
echo 2. Run these commands manually on server:
echo    mkdir -p ~/afrosuperstore.ca
echo    mkdir -p ~/afrosuperstore.ca/nginx
echo    mkdir -p ~/afrosuperstore.ca/nginx/ssl  
echo    mkdir -p ~/afrosuperstore.ca/logs
echo    mkdir -p ~/afrosuperstore.ca/database
echo    mkdir -p ~/afrosuperstore.ca/ecommerce-platform
echo    exit
echo 3. Return here and press any key to continue file copying
echo.
set /p manual_setup="Have you completed the manual directory setup? (y/n): "
if /i not "%manual_setup%"=="y" (
    echo Please complete manual setup first
    pause
    goto menu
)

echo Verifying directories exist on server...
echo Testing directory access...
echo Uploading verification script...
scp scripts/verify-dirs.sh %DREAMHOST_USER%@%DREAMHOST_SERVER%:/tmp/
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "chmod +x /tmp/verify-dirs.sh && /tmp/verify-dirs.sh"
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "ls ~/afrosuperstore.ca" >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo WARNING: Directories still not found on server!
    echo Please run these commands manually:
    echo ssh %DREAMHOST_USER%@%DREAMHOST_SERVER%
    echo mkdir -p ~/afrosuperstore.ca
    echo mkdir -p ~/afrosuperstore.ca/nginx
    echo mkdir -p ~/afrosuperstore.ca/nginx/ssl
    echo mkdir -p ~/afrosuperstore.ca/logs  
    echo mkdir -p ~/afrosuperstore.ca/database
    echo mkdir -p ~/afrosuperstore.ca/ecommerce-platform
    echo ls ~/afrosuperstore.ca
    echo exit
    echo.
    echo After running these, press any key to continue...
    pause
) else (
    echo ✓ All directories verified successfully!
)

echo Copying deployment files...
echo Copying docker-compose file...
scp docker-compose.dreamhost.yml %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/docker-compose.yml
if %errorlevel% neq 0 echo "Failed to copy docker-compose file"

echo Copying nginx directory...
echo Ensuring nginx directory exists...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "mkdir -p %REMOTE_PATH%/nginx && chmod 755 %REMOTE_PATH%/nginx && echo Nginx directory ready"
if %errorlevel% neq 0 (
    echo "Failed to create nginx directory - checking permissions..."
    ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "ls -la %REMOTE_PATH%/ || echo Base directory issue"
    pause
    goto menu
)

echo Testing directory access...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "touch %REMOTE_PATH%/nginx/test.txt && rm %REMOTE_PATH%/nginx/test.txt && echo Directory write test passed"
if %errorlevel% neq 0 (
    echo "Directory write test failed - checking connection and permissions..."
    ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "echo SSH connection test"
    if %errorlevel% neq 0 (
        echo "SSH connection failed - please check network and server status"
        pause
        goto menu
    )
    ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "ls -la %REMOTE_PATH%/nginx/"
    pause
    goto menu
)

scp -r nginx/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/
if %errorlevel% neq 0 (
    echo "Failed to copy nginx directory - trying alternative method..."
    ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "mkdir -p %REMOTE_PATH%/nginx"
    scp -r nginx/* %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/nginx/
    if %errorlevel% neq 0 (
        echo "Alternative nginx copy also failed - trying file by file..."
        scp nginx/nginx.conf %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/nginx/
        if %errorlevel% neq 0 echo "Individual file copy also failed"
    )
)

echo Copying ecommerce platform...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "mkdir -p %REMOTE_PATH%/ecommerce-platform"
scp -r ecommerce-platform/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/ecommerce-platform/
if %errorlevel% neq 0 echo "Failed to copy ecommerce platform"

echo Copying environment file...
scp .env.dreamhost %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/.env
if %errorlevel% neq 0 echo "Failed to copy environment file"

echo.
echo File copying completed! Now start services manually:
echo 1. SSH to server: ssh %DREAMHOST_USER%@%DREAMHOST_SERVER%
echo 2. Run: cd ~/afrosuperstore.ca
echo 3. Run: docker-compose up -d --build
echo 4. Run: docker-compose ps
echo.
pause
goto menu

ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "mkdir -p ~/afrosuperstore.ca/nginx && echo 'Nginx directory created successfully'"
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "mkdir -p ~/afrosuperstore.ca/nginx/ssl && echo 'Nginx SSL directory created successfully'"
if %errorlevel% neq 0 echo "Failed to create nginx ssl directory"
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "mkdir -p ~/afrosuperstore.ca/logs && echo 'Logs directory created successfully'"
if %errorlevel% neq 0 echo "Failed to create logs directory"
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "mkdir -p ~/afrosuperstore.ca/database && echo 'Database directory created successfully'"
if %errorlevel% neq 0 echo "Failed to create database directory"
echo Verifying directories...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "echo 'Final directory structure:' && ls -la ~/afrosuperstore.ca/ && echo 'Directory listing completed'"
if %errorlevel% neq 0 (
    echo "Failed to list directories - base directory may not exist"
    pause
    goto menu
)

echo Copying deployment files...
echo Copying docker-compose file...
scp docker-compose.dreamhost.yml %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/docker-compose.yml
if %errorlevel% neq 0 echo "Failed to copy docker-compose file"

echo Copying nginx directory...
echo Ensuring nginx directory exists...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "mkdir -p %REMOTE_PATH%/nginx && chmod 755 %REMOTE_PATH%/nginx && echo Nginx directory ready"
if %errorlevel% neq 0 (
    echo "Failed to create nginx directory - checking permissions..."
    ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "ls -la %REMOTE_PATH%/ || echo Base directory issue"
    pause
    goto menu
)

echo Testing directory access...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "touch %REMOTE_PATH%/nginx/test.txt && rm %REMOTE_PATH%/nginx/test.txt && echo Directory write test passed"
if %errorlevel% neq 0 (
    echo "Directory write test failed - checking connection and permissions..."
    ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "echo SSH connection test"
    if %errorlevel% neq 0 (
        echo "SSH connection failed - please check network and server status"
        pause
        goto menu
    )
    ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "ls -la %REMOTE_PATH%/nginx/"
    pause
    goto menu
)

scp -r nginx/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/
if %errorlevel% neq 0 (
    echo "Failed to copy nginx directory - trying alternative method..."
    ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "mkdir -p %REMOTE_PATH%/nginx"
    scp -r nginx/* %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/nginx/
    if %errorlevel% neq 0 (
        echo "Alternative nginx copy also failed - trying file by file..."
        scp nginx/nginx.conf %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/nginx/
        if %errorlevel% neq 0 echo "Individual file copy also failed"
    )
)

echo Copying ecommerce platform...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "mkdir -p %REMOTE_PATH%/ecommerce-platform"
scp -r ecommerce-platform/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/ecommerce-platform/
if %errorlevel% neq 0 echo "Failed to copy ecommerce platform"

echo Copying environment file...
scp .env.dreamhost %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/.env
if %errorlevel% neq 0 echo "Failed to copy environment file"

echo Starting services...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd %REMOTE_PATH% && docker-compose down"
if %errorlevel% neq 0 echo "Failed to stop services"
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd %REMOTE_PATH% && docker-compose up -d --build"
if %errorlevel% neq 0 echo "Failed to start services"

echo Waiting for services to start...
timeout /t 30 /nobreak >nul

echo.
echo Step 3: Setup SSL Certificates (Let's Encrypt)
scp scripts/setup-ssl.sh %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "chmod +x ~/setup-ssl.sh && ~/setup-ssl.sh letsencrypt"

echo.
echo Step 4: Run Database Migrations
scp database/migrate.sh %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/
scp -r database/migrations/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "chmod +x ~/migrate.sh && ~/migrate.sh migrate"

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
