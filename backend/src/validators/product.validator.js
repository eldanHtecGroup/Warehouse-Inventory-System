import { z } from 'zod';
import { id, pagination, sortOrder, booleanQuery } from './common.validator.js';
import { MAX_STOCK_QUANTITY, PRODUCT_SORT_FIELDS } from '../utils/constants.js';

const hasAtMostTwoDecimals = (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-9;

const price = z
  .number()
  .nonnegative()
  .max(1_000_000)
  .refine(hasAtMostTwoDecimals, { message: 'Price can have at most 2 decimal places' });

const productFields = {
  name: z.string().trim().min(1).max(200),
  code: z.string().trim().min(1).max(50),
  description: z.string().trim().max(1000).nullable().optional(),
  price,
  categoryId: id,
};

export const createProductBody = z.strictObject({
  ...productFields,
  quantity: z.number().int().nonnegative().max(MAX_STOCK_QUANTITY).default(0),
});

// Quantity is intentionally not updatable here: stock changes must go through
// the increase/decrease endpoints so that every change is recorded in history.
export const updateProductBody = z
  .strictObject(productFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

export const stockAdjustmentBody = z.strictObject({
  quantity: z.number().int().positive().max(MAX_STOCK_QUANTITY),
  reason: z.string().trim().min(1).max(255).optional(),
});

export const listProductsQuery = z
  .object({
    search: z.string().trim().min(1).max(100).optional(),
    categoryId: id.optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    minQuantity: z.coerce.number().int().nonnegative().optional(),
    maxQuantity: z.coerce.number().int().nonnegative().optional(),
    inStock: booleanQuery.optional(),
    sortBy: z.enum(PRODUCT_SORT_FIELDS).default('name'),
    order: sortOrder.default('asc'),
    ...pagination,
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    message: 'minPrice must be less than or equal to maxPrice',
    path: ['minPrice'],
  })
  .refine((q) => q.minQuantity === undefined || q.maxQuantity === undefined || q.minQuantity <= q.maxQuantity, {
    message: 'minQuantity must be less than or equal to maxQuantity',
    path: ['minQuantity'],
  });
