// Schemas consumed by middlewares/validate.js.
// Each field: { type, required?, min? }

export const createItemSchema = {
  name: { type: 'string', required: true },
  sku: { type: 'string', required: true },
  quantity: { type: 'number', min: 0 },
  location: { type: 'string' },
};

export const updateItemSchema = {
  name: { type: 'string' },
  sku: { type: 'string' },
  quantity: { type: 'number', min: 0 },
  location: { type: 'string' },
};
