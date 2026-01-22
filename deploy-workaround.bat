@echo off
echo Alternative deployment approach - copy to home first...

set DREAMHOST_USER=dh_t5hb7x
set DREAMHOST_SERVER=vps68200.dreamhostps.com

echo Step 1: Copy ecommerce-platform to home directory...
scp -r ecommerce-platform/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/ecommerce-platform-temp/

echo Step 2: Copy other files to home directory...
scp docker-compose.dreamhost.yml %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/docker-compose.yml
scp -r nginx/ %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/nginx-temp/
scp .env.dreamhost %DREAMHOST_USER%@%DREAMHOST_SERVER%:~/.env

echo Step 3: Move files to final location...
ssh %DREAMHOST_USER%@%DREAMHOST_SERVER% "mkdir -p ~/afrosuperstore.ca && mv ~/ecommerce-platform-temp ~/afrosuperstore.ca/ecommerce-platform && mv ~/nginx-temp ~/afrosuperstore.ca/nginx && mv ~/docker-compose.yml ~/afrosuperstore.ca/ && mv ~/.env ~/afrosuperstore.ca/.env && echo 'All files moved successfully'"

echo.
echo Deployment completed!
echo Now SSH to server and run: cd ~/afrosuperstore.ca && docker-compose up -d --build
pause
