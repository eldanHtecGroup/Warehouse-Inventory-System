import ApiError from '../utils/ApiError.js';

// Validates any of req.params / req.query / req.body against zod schemas.
// Parsed (coerced, defaulted, stripped) values are exposed on req.validated,
// because req.query is read-only in Express 5.
const validate = (schemas) => (req, res, next) => {
  const validated = {};
  const errors = [];

  for (const [source, schema] of Object.entries(schemas)) {
    const result = schema.safeParse(req[source] ?? {});
    if (result.success) {
      validated[source] = result.data;
    } else {
      errors.push(
        ...result.error.issues.map((issue) => ({
          field: [source, ...issue.path].join('.'),
          message: issue.message,
        })),
      );
    }
  }

  if (errors.length) return next(ApiError.badRequest('Validation failed', errors));

  req.validated = validated;
  next();
};

export default validate;
