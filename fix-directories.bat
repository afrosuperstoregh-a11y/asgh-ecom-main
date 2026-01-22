@echo off
REM Quick fix script to create missing directories on DreamHost server

setlocal enabledelayedexpansion

echo ========================================
echo Fixing DreamHost Directory Structure
echo ========================================

REM Configuration
set DREAMHOST_USER=dh_t5hb7x
set DREAMHOST_SERVER=vps68200.dreamhostps.com
set REMOTE_PATH=/home/dh_t5hb7x/afrosuperstore.ca

echo Creating missing directories on server...
echo Remote path: %REMOTE_PATH%

ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "echo 'Creating base directory...' && mkdir -p %REMOTE_PATH% && echo 'Creating nginx directory...' && mkdir -p %REMOTE_PATH%/nginx && echo 'Creating nginx SSL directory...' && mkdir -p %REMOTE_PATH%/nginx/ssl && echo 'Creating logs directory...' && mkdir -p %REMOTE_PATH%/logs && echo 'Creating database directory...' && mkdir -p %REMOTE_PATH%/database && echo 'Creating ecommerce-platform directory...' && mkdir -p %REMOTE_PATH%/ecommerce-platform && echo 'Setting permissions...' && chmod 755 %REMOTE_PATH% && chmod 755 %REMOTE_PATH%/nginx && chmod 755 %REMOTE_PATH%/nginx/ssl && chmod 755 %REMOTE_PATH%/logs && chmod 755 %REMOTE_PATH%/database && chmod 755 %REMOTE_PATH%/ecommerce-platform && echo 'Directory structure created successfully!'"

echo.
echo Verifying directory structure...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "ls -la %REMOTE_PATH%/"

echo.
echo Testing nginx directory write access...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "touch %REMOTE_PATH%/nginx/test.txt && rm %REMOTE_PATH%/nginx/test.txt && echo 'Write test passed!'"

echo.
echo Directory fix completed!
echo You can now retry the deployment script.
pause
