// Response shapes match the backend repositories (see backend/src/repositories)

export const buildCategory = (overrides = {}) => ({
  id: 1,
  name: 'Beverages',
  description: 'Soft drinks and juices',
  productCount: 2,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
  ...overrides,
});

export const buildProduct = (overrides = {}) => ({
  id: 1,
  name: 'Sparkling Water 1.5L',
  code: 'BEV-001',
  description: null,
  price: 0.99,
  quantity: 120,
  categoryId: 1,
  categoryName: 'Beverages',
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-02T10:00:00.000Z',
  ...overrides,
});

export const buildMovement = (overrides = {}) => ({
  id: 1,
  productId: 1,
  productName: 'Sparkling Water 1.5L',
  productCode: 'BEV-001',
  type: 'INCREASE',
  quantityChange: 10,
  quantityBefore: 110,
  quantityAfter: 120,
  reason: 'Supplier delivery',
  createdAt: '2026-10-02T10:00:00.000Z',
  ...overrides,
});

export const buildMeta = (overrides = {}) => ({ page: 1, limit: 20, total: 1, totalPages: 1, ...overrides });

export const buildList = (items, meta = {}) => ({ data: items, meta: buildMeta({ total: items.length, ...meta }) });

export const buildStockSummary = () => ({
  categories: [
    { categoryId: 1, categoryName: 'Beverages', productCount: 2, totalQuantity: 150, totalValue: 300.5 },
    { categoryId: 2, categoryName: 'Snacks', productCount: 1, totalQuantity: 50, totalValue: 100 },
  ],
  totals: { productCount: 3, totalQuantity: 200, totalValue: 400.5 },
});

// Minimal fetch Response stand-in
export const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: `Status ${status}`,
  json: async () => {
    if (body === undefined) throw new SyntaxError('Unexpected end of JSON input');
    return body;
  },
});
