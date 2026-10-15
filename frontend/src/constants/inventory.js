// Mirrors backend/src/utils/constants.js

export const MOVEMENT_TYPES = Object.freeze({
  INITIAL: 'INITIAL',
  INCREASE: 'INCREASE',
  DECREASE: 'DECREASE',
  REMOVED: 'REMOVED',
});

export const MOVEMENT_TYPE_LABELS = {
  [MOVEMENT_TYPES.INITIAL]: 'Initial stock',
  [MOVEMENT_TYPES.INCREASE]: 'Increase',
  [MOVEMENT_TYPES.DECREASE]: 'Decrease',
  [MOVEMENT_TYPES.REMOVED]: 'Product removed',
};

export const STOCK_ADJUSTMENT = Object.freeze({
  INCREASE: 'increase',
  DECREASE: 'decrease',
});

export const PRODUCT_SORT_FIELDS = {
  name: 'Name',
  code: 'Code',
  category: 'Category',
  price: 'Price',
  quantity: 'Quantity',
  updatedAt: 'Last updated',
};

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Products at or below this quantity are flagged as low stock
export const LOW_STOCK_THRESHOLD = 10;

// Field limits, kept in sync with the backend validators
export const LIMITS = {
  PRODUCT_NAME: 200,
  PRODUCT_CODE: 50,
  PRODUCT_DESCRIPTION: 1000,
  MAX_PRICE: 1_000_000,
  CATEGORY_NAME: 100,
  CATEGORY_DESCRIPTION: 500,
  REASON: 255,
};
