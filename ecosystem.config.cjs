module.exports = {
  apps: [
    {
      name: "inv-server",
      script: "./backend/server.js",
      cwd: "./",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      watch: false,
      autorestart: true,
      max_memory_restart: "300M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
    },
  ],
};
