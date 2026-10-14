import ApiError from '../utils/ApiError.js';
import config from '../config/index.js';

// Express identifies error handlers by their 4 arguments, so `next` must stay.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : err.status || 500;

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
