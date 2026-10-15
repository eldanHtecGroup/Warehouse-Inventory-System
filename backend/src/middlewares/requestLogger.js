import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import logger from '../utils/logger.js';

const REQUEST_ID_HEADER = 'x-request-id';

// Reuse an incoming request id (e.g. from a proxy) or create one, and echo it back
// so clients can quote it when reporting a problem.
export const genReqId = (req, res) => {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const id = typeof incoming === 'string' && /^[\w-]{1,100}$/.test(incoming) ? incoming : randomUUID();
  res.setHeader('X-Request-Id', id);
  return id;
};

export const customLogLevel = (req, res, err) => {
  if (err || res.statusCode >= 500) return 'error';
  if (res.statusCode >= 400) return 'warn';
  return 'info';
};

const requestMessage = (req, res) => `${req.method} ${req.originalUrl} ${res.statusCode}`;

// One access log line per request. Error details (stack traces etc.) are logged
// separately by the error handler; req.log carries the request id for correlation.
const requestLogger = pinoHttp({
  logger,
  genReqId,
  customLogLevel,
  quietReqLogger: true,
  customSuccessMessage: requestMessage,
  customErrorMessage: requestMessage,
  serializers: {
    req: (req) => ({ method: req.method, url: req.url, remoteAddress: req.remoteAddress }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
  autoLogging: {
    // Swagger UI loads many static assets; don't flood the logs with them
    ignore: (req) => req.url.startsWith('/api/docs'),
  },
});

export default requestLogger;
