import config from './config/index.js';
import logger from './utils/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

let server;
let db;
let shuttingDown = false;

const shutdown = (reason, exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ reason }, 'Shutting down');

  setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();

  const finish = () => {
    db?.close();
    process.exit(exitCode);
  };
  if (server?.listening) server.close(finish);
  else finish();
};

// Registered before the app is loaded so that startup failures
// (e.g. an unreadable database) are logged as well.
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (err, origin) => {
  logger.fatal({ err, origin }, 'Uncaught exception');
  shutdown('uncaughtException', 1);
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

({ default: db } = await import('./db/index.js'));
const { default: app } = await import('./app.js');

server = app.listen(config.port, () => {
  logger.info({ env: config.env, port: config.port, dbPath: config.dbPath }, 'Server started');
});

server.on('error', (err) => {
  logger.fatal({ err }, 'HTTP server error');
  shutdown('serverError', 1);
});
