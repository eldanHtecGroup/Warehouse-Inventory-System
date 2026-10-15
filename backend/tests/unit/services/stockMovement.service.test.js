import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import stockMovementService from '../../../src/services/stockMovement.service.js';
import stockMovementRepository from '../../../src/repositories/stockMovement.repository.js';
import productRepository from '../../../src/repositories/product.repository.js';
import ApiError from '../../../src/utils/ApiError.js';

describe('stockMovementService', () => {
  it('lists movements with pagination metadata', (t) => {
    const findMany = t.mock.method(stockMovementRepository, 'findMany', () => ({ items: [], total: 0 }));

    const result = stockMovementService.listMovements({ page: 1, limit: 50, type: 'INCREASE' });

    assert.deepEqual(result.meta, { page: 1, limit: 50, total: 0, totalPages: 0 });
    assert.equal(findMany.mock.calls[0].arguments[0].type, 'INCREASE');
  });

  it('lists movements of an existing product', (t) => {
    t.mock.method(productRepository, 'findById', () => ({ id: 4 }));
    const findMany = t.mock.method(stockMovementRepository, 'findMany', () => ({ items: [{ id: 1 }], total: 1 }));

    const result = stockMovementService.listProductMovements(4, { page: 1, limit: 20, productId: 999 });

    assert.equal(result.items.length, 1);
    // The path parameter wins over anything passed in the filters
    assert.equal(findMany.mock.calls[0].arguments[0].productId, 4);
  });

  it('throws 404 for the history of an unknown product', (t) => {
    t.mock.method(productRepository, 'findById', () => undefined);
    assert.throws(
      () => stockMovementService.listProductMovements(4, { page: 1, limit: 20 }),
      (err) => err instanceof ApiError && err.statusCode === 404,
    );
  });
});
