module.exports = {
  apps: [
    {
      name: 'pickleball-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G'
    },
    {
      name: 'pickleball-app-prod',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G'
    }
  ]
};
