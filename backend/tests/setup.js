// Preloaded into every test process (see the "test" scripts in package.json)
// so that config is resolved for tests before any application module loads.
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.LOG_LEVEL = 'silent';
