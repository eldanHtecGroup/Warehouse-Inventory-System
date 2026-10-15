import path from 'node:path';

const backendRoot = path.resolve(import.meta.dirname, '..', '..');

const env = process.env.NODE_ENV || 'development';

const resolveDbPath = (value) => {
  if (!value) return path.join(backendRoot, 'data', 'inventory.db');
  if (value === ':memory:') return value;
  return path.resolve(backendRoot, value);
};

const defaultLogLevel = { production: 'info', test: 'silent' }[env] ?? 'debug';

const config = {
  env,
  port: Number(process.env.PORT) || 5000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  dbPath: resolveDbPath(process.env.DB_PATH),
  logLevel: process.env.LOG_LEVEL || defaultLogLevel,
};

export default config;
