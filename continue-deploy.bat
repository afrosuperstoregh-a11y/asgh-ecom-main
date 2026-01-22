@echo off
echo Continuing deployment - skipping directory verification...
echo.

set DREAMHOST_USER=dh_t5hb7x
set DREAMHOST_SERVER=vps68200.dreamhostps.com
set REMOTE_PATH=/home/dh_t5hb7x/afrosuperstore.ca

echo Creating remote directory structure...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "mkdir -p %REMOTE_PATH% && mkdir -p %REMOTE_PATH%/nginx && mkdir -p %REMOTE_PATH%/nginx/ssl && mkdir -p %REMOTE_PATH%/logs && mkdir -p %REMOTE_PATH%/database && mkdir -p %REMOTE_PATH%/ecommerce-platform && echo 'All directories created successfully'"

echo Verifying directories exist...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "ls -la %REMOTE_PATH%/ && echo 'Directory verification completed'"

echo Copying deployment files...
echo Copying docker-compose file...
scp docker-compose.dreamhost.yml %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/docker-compose.yml
if %errorlevel% neq 0 echo "Failed to copy docker-compose file"

echo Copying nginx directory...
scp -r nginx/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/
if %errorlevel% neq 0 echo "Failed to copy nginx directory"

echo Copying ecommerce platform...
scp -r ecommerce-platform/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/ecommerce-platform/
if %errorlevel% neq 0 echo "Failed to copy ecommerce platform"

echo Copying environment file...
scp .env.dreamhost %DREAMHOST_USER%@%DREAMHOST_SERVER%:%REMOTE_PATH%/.env
if %errorlevel% neq 0 echo "Failed to copy environment file"

echo.
echo File copying completed!
echo Now start services manually:
echo 1. SSH to server: ssh %DREAMHOST_USER%@%DREAMHOST_SERVER%
echo 2. Run: cd ~/afrosuperstore.ca
echo 3. Run: docker-compose up -d --build
echo 4. Run: docker-compose ps
echo.
pause
