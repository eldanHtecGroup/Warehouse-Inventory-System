import app from './app.js';
import config from './config/index.js';
import db from './db/index.js';

const server = app.listen(config.port, () => {
  console.log(`Server running in ${config.env} mode on port ${config.port}`);
  console.log(`Using database at ${config.dbPath}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down...`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
