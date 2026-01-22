@echo off
echo Creating directories and copying files in one operation...

set DREAMHOST_USER=dh_t5hb7x
set DREAMHOST_SERVER=vps68200.dreamhostps.com

echo Step 1: Create directories and copy files...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "mkdir -p ~/afrosuperstore.ca/ecommerce-platform && echo 'Directories created'"

echo Step 2: Copy ecommerce platform...
scp -r ecommerce-platform/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/afrosuperstore.ca/ecommerce-platform/

echo Step 3: Copy other files...
scp docker-compose.dreamhost.yml %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/afrosuperstore.ca/docker-compose.yml
scp -r nginx/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/afrosuperstore.ca/
scp .env.dreamhost %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/afrosuperstore.ca/.env

echo.
echo All files copied successfully!
echo Now SSH to server and run: cd ~/afrosuperstore.ca && docker-compose up -d --build
pause
