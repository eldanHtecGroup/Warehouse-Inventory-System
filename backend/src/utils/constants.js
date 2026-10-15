export const MOVEMENT_TYPES = Object.freeze({
  INITIAL: 'INITIAL',
  INCREASE: 'INCREASE',
  DECREASE: 'DECREASE',
  REMOVED: 'REMOVED',
});

// Upper bound for a product's stock; keeps quantities and stock values exact
export const MAX_STOCK_QUANTITY = 1_000_000_000;

export const PRODUCT_SORT_FIELDS = ['name', 'code', 'price', 'quantity', 'category', 'createdAt', 'updatedAt'];
