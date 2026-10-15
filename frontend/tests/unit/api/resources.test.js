import { beforeEach, describe, expect, it, vi } from 'vitest';
import categoryApi from '../../../src/api/category.api.js';
import productApi from '../../../src/api/product.api.js';
import stockMovementApi from '../../../src/api/stockMovement.api.js';
import { jsonResponse } from '../../helpers/fixtures.js';

// Each resource module should hit the right endpoint and unwrap { data } where documented
let fetchMock;

beforeEach(() => {
  fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ data: 'payload', meta: {} }));
});

const lastCall = () => {
  const [url, init] = fetchMock.mock.calls.at(-1);
  return { url, method: init.method, body: init.body && JSON.parse(init.body) };
};

describe('category.api', () => {
  it.each([
    ['getAll', [], '/api/categories', 'GET'],
    ['getById', [3], '/api/categories/3', 'GET'],
    ['getStockSummary', [], '/api/categories/stock-summary', 'GET'],
    ['create', [{ name: 'Snacks' }], '/api/categories', 'POST'],
    ['update', [3, { name: 'Snacks' }], '/api/categories/3', 'PATCH'],
  ])('%s calls %s and unwraps data', async (fn, args, url, method) => {
    await expect(categoryApi[fn](...args)).resolves.toBe('payload');
    expect(lastCall()).toMatchObject({ url, method });
  });

  it('remove sends DELETE', async () => {
    await categoryApi.remove(3);
    expect(lastCall()).toMatchObject({ url: '/api/categories/3', method: 'DELETE' });
  });
});

describe('product.api', () => {
  it('list returns the whole payload including meta', async () => {
    await expect(productApi.list({ page: 2 })).resolves.toEqual({ data: 'payload', meta: {} });
    expect(lastCall().url).toBe('/api/products?page=2');
  });

  it.each([
    ['getById', [5], '/api/products/5', 'GET'],
    ['create', [{ name: 'Tea' }], '/api/products', 'POST'],
    ['update', [5, { name: 'Tea' }], '/api/products/5', 'PATCH'],
  ])('%s calls %s and unwraps data', async (fn, args, url, method) => {
    await expect(productApi[fn](...args)).resolves.toBe('payload');
    expect(lastCall()).toMatchObject({ url, method });
  });

  it('remove sends DELETE', async () => {
    await productApi.remove(5);
    expect(lastCall()).toMatchObject({ url: '/api/products/5', method: 'DELETE' });
  });

  it.each([
    ['increaseStock', 'increase'],
    ['decreaseStock', 'decrease'],
  ])('%s posts quantity and reason', async (fn, action) => {
    await expect(productApi[fn](5, { quantity: 3, reason: 'Sale' })).resolves.toBe('payload');
    expect(lastCall()).toEqual({
      url: `/api/products/5/stock/${action}`,
      method: 'POST',
      body: { quantity: 3, reason: 'Sale' },
    });
  });

  it('getStockMovements passes params and returns the payload', async () => {
    await expect(productApi.getStockMovements(5, { page: 1, limit: 10 })).resolves.toEqual({ data: 'payload', meta: {} });
    expect(lastCall().url).toBe('/api/products/5/stock-movements?page=1&limit=10');
  });
});

describe('stockMovement.api', () => {
  it('list passes filters and returns the payload', async () => {
    await expect(stockMovementApi.list({ type: 'INCREASE', productId: 2 })).resolves.toEqual({ data: 'payload', meta: {} });
    expect(lastCall().url).toBe('/api/stock-movements?type=INCREASE&productId=2');
  });
});
