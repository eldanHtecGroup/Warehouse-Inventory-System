import path from 'node:path';

const backendRoot = path.resolve(import.meta.dirname, '..', '..');

const resolveDbPath = (value) => {
  if (!value) return path.join(backendRoot, 'data', 'inventory.db');
  if (value === ':memory:') return value;
  return path.resolve(backendRoot, value);
};

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  dbPath: resolveDbPath(process.env.DB_PATH),
};

export default config;
