@echo off
REM AfroSuperStore Traditional Windows Deployment Script
REM This script deploys to DreamHost VPS using traditional methods (NO DOCKER)

setlocal enabledelayedexpansion

echo ========================================
echo AfroSuperStore Traditional Deployment
echo ========================================
echo.

REM Configuration
set DREAMHOST_USER=afrosuperstore
set DREAMHOST_SERVER=vps68200.dreamhostps.com
set DOMAIN=www.afrosuperstore.ca
set REMOTE_PATH=/home/afrosuperstore/afrosuperstore.ca

echo Configuration:
echo User: %DREAMHOST_USER%
echo Server: %DREAMHOST_SERVER%
echo Domain: %DOMAIN%
echo Path: %REMOTE_PATH%
echo.

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
echo 3. Update Application Only
echo 4. Restart Services
echo 5. Check Status
echo 6. Full Deployment (Setup + Deploy)
echo 7. Exit
echo ========================================
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto setup
if "%choice%"=="2" goto deploy
if "%choice%"=="3" goto update
if "%choice%"=="4" goto restart
if "%choice%"=="5" goto status
if "%choice%"=="6" goto full
if "%choice%"=="7" exit

echo Invalid choice. Please try again.
goto menu

:setup
echo.
echo Running initial server setup...
echo This will install Node.js, PM2, and configure Apache.
echo.
set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" goto menu

echo Uploading setup script...
scp scripts/setup-traditional.sh %DREAMHOST_USER%@%DREAMHOST_SERVER%:/tmp/

echo Running setup script...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "chmod +x /tmp/setup-traditional.sh && /tmp/setup-traditional.sh"

echo.
echo Initial server setup completed!
echo Next step: Deploy Application (option 2)
pause
goto menu

:deploy
echo.
echo Deploying application...
echo This will upload all files and start services.
echo.
set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" goto menu

echo Creating build directory...
if exist build rmdir /s /q build
mkdir build
mkdir build\frontend
mkdir build\backend
mkdir build\api
mkdir build\database
mkdir build\scripts
mkdir build\apache

echo Copying application files...
xcopy /E /I /Y ecommerce-platform\frontend build\frontend\
xcopy /E /I /Y ecommerce-platform\backend build\backend\
xcopy /E /I /Y ecommerce-platform\api build\api\
xcopy /E /I /Y database build\database\
xcopy /E /I /Y scripts build\scripts\
copy .env.production build\.env
copy ecosystem.config.js build\
copy apache\afrosuperstore.conf build\apache\

echo Uploading files to server...
scp -r build\* %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/

echo Installing dependencies...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd %REMOTE_PATH%/frontend && npm ci --production"
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd %REMOTE_PATH%/backend && npm ci --production"
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd %REMOTE_PATH%/api && npm ci --production"

echo Building frontend...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd %REMOTE_PATH%/frontend && npm run build"

echo Setting up database...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd %REMOTE_PATH%/database && chmod +x migrate.sh && ./migrate.sh"

echo Configuring Apache...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "sudo cp %REMOTE_PATH%/apache/afrosuperstore.conf /etc/apache2/sites-available/afrosuperstore.conf"
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "sudo a2ensite afrosuperstore.conf"
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "sudo a2dissite 000-default.conf || true"
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "sudo apache2ctl configtest"
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "sudo systemctl restart apache2"

echo Starting Node.js services...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd %REMOTE_PATH% && pm2 start ecosystem.config.js --env production"
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "pm2 save"

echo.
echo Application deployed successfully!
echo Your site should be available at: https://%DOMAIN%
pause
goto menu

:update
echo.
echo Updating application only...
echo This will upload files and restart services.
echo.
set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" goto menu

echo Creating build directory...
if exist build rmdir /s /q build
mkdir build
mkdir build\frontend
mkdir build\backend
mkdir build\api

echo Copying application files...
xcopy /E /I /Y ecommerce-platform\frontend build\frontend\
xcopy /E /I /Y ecommerce-platform\backend build\backend\
xcopy /E /I /Y ecommerce-platform\api build\api\

echo Uploading files...
scp -r build\frontend %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/
scp -r build\backend %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/
scp -r build\api %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/

echo Installing dependencies...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd %REMOTE_PATH%/frontend && npm ci --production"
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd %REMOTE_PATH%/backend && npm ci --production"
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd %REMOTE_PATH%/api && npm ci --production"

echo Building frontend...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "cd %REMOTE_PATH%/frontend && npm run build"

echo Restarting services...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "pm2 restart all"

echo.
echo Application updated successfully!
pause
goto menu

:restart
echo.
echo Restarting all services...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "pm2 restart all"
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "sudo systemctl restart apache2"
echo Services restarted!
pause
goto menu

:status
echo.
echo Checking service status...
echo.
echo PM2 Status:
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "pm2 status"
echo.
echo Apache Status:
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "systemctl is-active apache2"
echo.
echo Website Test:
curl -f -s -I "https://%DOMAIN%" >nul 2>&1
if %errorlevel% equ 0 (
    echo Website is accessible ✓
) else (
    echo Website is not responding ✗
)
pause
goto menu

:full
echo.
echo Starting FULL DEPLOYMENT...
echo This will perform: Setup + Deploy
echo This will take 15-20 minutes.
echo.
set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" goto menu

echo Step 1: Initial Server Setup
scp scripts/setup-traditional.sh %DREAMHOST_USER%@%DREAMHOST_SERVER%:/tmp/
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "chmod +x /tmp/setup-traditional.sh && /tmp/setup-traditional.sh"

echo.
echo Step 2: Deploy Application
call :deploy

echo.
echo ========================================
echo FULL DEPLOYMENT COMPLETED!
echo ========================================
echo Your AfroSuperStore should be live at:
echo https://%DOMAIN%
echo.
echo Next steps:
echo 1. Configure production Stripe keys
echo 2. Set up email notifications
echo 3. Verify all functionality
echo 4. Set up monitoring alerts
echo ========================================
pause
goto menu

:exit
echo.
echo Thank you for using AfroSuperStore Traditional Deployment!
echo.
pause
