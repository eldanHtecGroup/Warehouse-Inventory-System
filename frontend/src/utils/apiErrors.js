// The backend reports validation errors as details: [{ field: 'body.price', message }].
// Maps them to { price: message } so forms can show them next to the right input.
export const getFieldErrors = (error) => {
  if (!Array.isArray(error?.details)) return {};

  return Object.fromEntries(
    error.details
      .filter((detail) => detail.field?.startsWith('body.'))
      .map((detail) => [detail.field.slice('body.'.length), detail.message]),
  );
};

export const getErrorMessage = (error, fallback = 'Something went wrong.') => error?.message || fallback;
