import ApiError from '../utils/ApiError.js';
import config from '../config/index.js';

const statusFromError = (err) => {
  if (err instanceof ApiError) return err.statusCode;
  // Safety net: services check constraints first, but the database is the final guard
  if (err.code?.startsWith('SQLITE_CONSTRAINT')) return 409;
  return err.status || 500;
};

// Express identifies error handlers by their 4 arguments, so `next` must stay.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = statusFromError(err);

  if (statusCode >= 500) console.error(err);

  res.status(statusCode).json({
    error: {
      message: statusCode < 500 ? err.message : 'Internal Server Error',
      ...(err.details && { details: err.details }),
      ...(config.env === 'development' && { stack: err.stack }),
    },
  });
};

export default errorHandler;
