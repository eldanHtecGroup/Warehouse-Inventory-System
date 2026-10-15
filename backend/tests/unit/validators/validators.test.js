import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { idParams, booleanQuery } from '../../../src/validators/common.validator.js';
import { createCategoryBody, updateCategoryBody } from '../../../src/validators/category.validator.js';
import {
  createProductBody,
  updateProductBody,
  stockAdjustmentBody,
  listProductsQuery,
} from '../../../src/validators/product.validator.js';
import { listMovementsQuery, listProductMovementsQuery } from '../../../src/validators/stockMovement.validator.js';

const errorPaths = (result) => result.error.issues.map((issue) => issue.path.join('.'));

describe('common validators', () => {
  it('coerces positive integer ids', () => {
    assert.deepEqual(idParams.parse({ id: '12' }), { id: 12 });
    assert.equal(idParams.safeParse({ id: '0' }).success, false);
    assert.equal(idParams.safeParse({ id: '1.5' }).success, false);
  });

  it('parses boolean query strings', () => {
    assert.equal(booleanQuery.parse('true'), true);
    assert.equal(booleanQuery.parse('false'), false);
    assert.equal(booleanQuery.safeParse('yes').success, false);
  });
});

describe('category validators', () => {
  it('trims and accepts a valid category', () => {
    assert.deepEqual(createCategoryBody.parse({ name: '  Snacks ' }), { name: 'Snacks' });
  });

  it('rejects unknown fields and empty names', () => {
    assert.equal(createCategoryBody.safeParse({ name: 'X', color: 'red' }).success, false);
    assert.equal(createCategoryBody.safeParse({ name: '   ' }).success, false);
  });

  it('requires at least one field on update', () => {
    assert.equal(updateCategoryBody.safeParse({}).success, false);
    assert.equal(updateCategoryBody.safeParse({ description: null }).success, true);
  });
});

describe('product validators', () => {
  const valid = { name: 'Cola', code: 'BEV-1', price: 1.99, categoryId: 1 };

  it('defaults quantity to 0 on create', () => {
    assert.equal(createProductBody.parse(valid).quantity, 0);
  });

  it('rejects prices with more than 2 decimals and negative values', () => {
    assert.deepEqual(errorPaths(createProductBody.safeParse({ ...valid, price: 1.999 })), ['price']);
    assert.deepEqual(errorPaths(createProductBody.safeParse({ ...valid, price: -1 })), ['price']);
    assert.equal(createProductBody.safeParse({ ...valid, price: 0.1 + 0.2 }).success, true);
  });

  it('rejects negative or fractional quantities', () => {
    assert.equal(createProductBody.safeParse({ ...valid, quantity: -1 }).success, false);
    assert.equal(createProductBody.safeParse({ ...valid, quantity: 1.5 }).success, false);
  });

  it('does not allow quantity changes through update', () => {
    assert.equal(updateProductBody.safeParse({ quantity: 5 }).success, false);
    assert.equal(updateProductBody.safeParse({}).success, false);
    assert.deepEqual(updateProductBody.parse({ price: 2 }), { price: 2 });
  });

  it('requires a positive integer stock adjustment', () => {
    assert.deepEqual(stockAdjustmentBody.parse({ quantity: 3, reason: ' Sold ' }), { quantity: 3, reason: 'Sold' });
    assert.equal(stockAdjustmentBody.safeParse({ quantity: 0 }).success, false);
    assert.equal(stockAdjustmentBody.safeParse({ quantity: -2 }).success, false);
  });

  it('applies list defaults and coerces query strings', () => {
    assert.deepEqual(listProductsQuery.parse({}), { sortBy: 'name', order: 'asc', page: 1, limit: 20 });
    const parsed = listProductsQuery.parse({ categoryId: '3', minPrice: '1.5', inStock: 'true', sortBy: 'price' });
    assert.equal(parsed.categoryId, 3);
    assert.equal(parsed.minPrice, 1.5);
    assert.equal(parsed.inStock, true);
  });

  it('rejects unknown sort fields, oversized pages and inverted ranges', () => {
    assert.deepEqual(errorPaths(listProductsQuery.safeParse({ sortBy: 'password' })), ['sortBy']);
    assert.deepEqual(errorPaths(listProductsQuery.safeParse({ limit: '1000' })), ['limit']);
    assert.deepEqual(errorPaths(listProductsQuery.safeParse({ minPrice: '5', maxPrice: '1' })), ['minPrice']);
    assert.deepEqual(errorPaths(listProductsQuery.safeParse({ minQuantity: '5', maxQuantity: '1' })), ['minQuantity']);
  });
});

describe('stock movement validators', () => {
  it('defaults to newest first and converts dates to ISO strings', () => {
    const parsed = listMovementsQuery.parse({ from: '2026-01-01', productId: '4', type: 'INCREASE' });
    assert.equal(parsed.order, 'desc');
    assert.equal(parsed.productId, 4);
    assert.equal(parsed.from, '2026-01-01T00:00:00.000Z');
  });

  it('rejects unknown types, invalid dates and inverted ranges', () => {
    assert.equal(listMovementsQuery.safeParse({ type: 'STOLEN' }).success, false);
    assert.equal(listMovementsQuery.safeParse({ from: 'not-a-date' }).success, false);
    assert.deepEqual(errorPaths(listProductMovementsQuery.safeParse({ from: '2026-02-01', to: '2026-01-01' })), [
      'from',
    ]);
  });
});
