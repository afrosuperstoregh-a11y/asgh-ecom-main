// PM2 Ecosystem Configuration for AfroSuperStore
// Traditional DreamHost VPS Deployment
// User: afrosuperstore
// Path: /home/afrosuperstore/afrosuperstore.ca

module.exports = {
  apps: [
    {
      name: 'afrosuperstore-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/home/afrosuperstore/afrosuperstore.ca/frontend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: '/home/afrosuperstore/afrosuperstore.ca/logs/frontend.log',
      out_file: '/home/afrosuperstore/afrosuperstore.ca/logs/frontend-out.log',
      error_file: '/home/afrosuperstore/afrosuperstore.ca/logs/frontend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    },
    {
      name: 'afrosuperstore-backend',
      script: '/home/afrosuperstore/afrosuperstore.ca/ecommerce-platform/backend/dist/main.js',
      cwd: '/home/afrosuperstore/afrosuperstore.ca/ecommerce-platform/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '768M',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      log_file: '/home/afrosuperstore/afrosuperstore.ca/logs/backend.log',
      out_file: '/home/afrosuperstore/afrosuperstore.ca/logs/backend-out.log',
      error_file: '/home/afrosuperstore/afrosuperstore.ca/logs/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    },
    {
      name: 'afrosuperstore-api',
      script: '/home/afrosuperstore/afrosuperstore.ca/ecommerce-platform/api/dist/main.js',
      cwd: '/home/afrosuperstore/afrosuperstore.ca/ecommerce-platform/api',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '768M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: '/home/afrosuperstore/afrosuperstore.ca/logs/api.log',
      out_file: '/home/afrosuperstore/afrosuperstore.ca/logs/api-out.log',
      error_file: '/home/afrosuperstore/afrosuperstore.ca/logs/api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    }
  ],
  
  deploy: {
    production: {
      user: 'afrosuperstore',
      host: 'vps68200.dreamhostps.com',
      ref: 'origin/main',
      repo: 'https://github.com/your-repo/afrosuperstore.git',
      path: '/home/afrosuperstore/afrosuperstore.ca',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};
