import pino from 'pino';
import config from '../config/index.js';

// Structured JSON logs in production (ready for log aggregators),
// human-readable colored output in development, silent in tests.
const logger = pino({
  level: config.logLevel,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["x-api-key"]'],
    censor: '[REDACTED]',
  },
  ...(config.env === 'development' && {
    transport: {
      target: 'pino-pretty',
      // req/res are already summarised in the access log message
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l', ignore: 'pid,hostname,req,res' },
    },
  }),
});

export default logger;
