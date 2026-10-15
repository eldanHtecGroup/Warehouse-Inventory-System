import ApiError from '../utils/ApiError.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// Translates anything that was thrown into a status code and a message that is
// safe to show to clients. Internal details never leave the server for 5xx errors.
export const normalizeError = (err) => {
  if (err instanceof ApiError) {
    return { statusCode: err.statusCode, message: err.message, details: err.details };
  }
  if (err?.type === 'entity.parse.failed') {
    return { statusCode: 400, message: 'Malformed JSON in request body' };
  }
  // Safety net: services check constraints first, but the database is the final guard
  if (typeof err?.code === 'string' && err.code.startsWith('SQLITE_CONSTRAINT')) {
    return { statusCode: 409, message: 'Request conflicts with existing data' };
  }
  // Errors raised by Express / body-parser (http-errors) carry a status and an `expose` flag
  const status = err?.status ?? err?.statusCode;
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return { statusCode: status, message: err.expose ? err.message : 'Bad Request' };
  }
  return { statusCode: 500, message: 'Internal Server Error' };
};

// Express identifies error handlers by their 4 arguments, so `next` must stay.
const errorHandler = (err, req, res, next) => {
  const { statusCode, message, details } = normalizeError(err);
  const log = req.log ?? logger;

  if (statusCode >= 500) {
    log.error({ err }, 'Unhandled error while processing request');
  } else {
    log.warn({ statusCode, details }, message);
  }

  // Response already started streaming: let Express close the connection
  if (res.headersSent) return next(err);

  res.status(statusCode).json({
    error: {
      message,
      ...(details && { details }),
      ...(req.id && { requestId: req.id }),
      ...(config.env === 'development' && err instanceof Error && { stack: err.stack }),
    },
  });
};

export default errorHandler;
