import ApiError from '../utils/ApiError.js';

const validate = (schema) => (req, res, next) => {
  const body = req.body ?? {};
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];

    if (value === undefined || value === null || value === '') {
      if (rules.required) errors.push(`${field} is required`);
      continue;
    }
    if (typeof value !== rules.type) {
      errors.push(`${field} must be a ${rules.type}`);
      continue;
    }
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${field} must be at least ${rules.min}`);
    }
  }

  if (errors.length) return next(ApiError.badRequest('Validation failed', errors));

  // Keep only the fields declared in the schema
  req.body = Object.fromEntries(Object.entries(body).filter(([key]) => key in schema));
  next();
};

export default validate;
