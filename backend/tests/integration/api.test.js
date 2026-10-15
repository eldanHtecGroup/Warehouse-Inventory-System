import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../../src/app.js';

let server;
let baseUrl;

const api = async (method, path, body) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => {
  server.closeAllConnections();
  server.close();
});

const ids = {};

describe('categories', () => {
  test('creates categories', async () => {
    for (const name of ['Beverages', 'Snacks', 'Household']) {
      const res = await api('POST', '/categories', { name });
      assert.equal(res.status, 201);
      ids[name] = res.body.data.id;
    }
  });

  test('rejects duplicate category names case-insensitively', async () => {
    const res = await api('POST', '/categories', { name: 'beverages' });
    assert.equal(res.status, 409);
  });

  test('lists categories alphabetically', async () => {
    const res = await api('GET', '/categories');
    assert.deepEqual(
      res.body.data.map((c) => c.name),
      ['Beverages', 'Household', 'Snacks'],
    );
  });
});

describe('products', () => {
  test('creates a product with initial stock', async () => {
    const res = await api('POST', '/products', {
      name: 'Cola 330ml',
      code: 'BEV-001',
      price: 1.25,
      quantity: 10,
      categoryId: ids.Beverages,
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.price, 1.25);
    assert.equal(res.body.data.quantity, 10);
    assert.equal(res.body.data.categoryName, 'Beverages');
    ids.cola = res.body.data.id;

    await api('POST', '/products', { name: 'Water', code: 'BEV-002', price: 0.5, quantity: 0, categoryId: ids.Beverages });
    await api('POST', '/products', { name: 'Chips', code: 'SNK-001', price: 2.1, quantity: 5, categoryId: ids.Snacks });
  });

  test('validates product input', async () => {
    const res = await api('POST', '/products', { name: '', code: 'X', price: 1.234, quantity: -1, categoryId: ids.Snacks });
    assert.equal(res.status, 400);
    const fields = res.body.error.details.map((d) => d.field);
    assert.ok(fields.includes('body.name'));
    assert.ok(fields.includes('body.price'));
    assert.ok(fields.includes('body.quantity'));
  });

  test('rejects duplicate codes and unknown categories', async () => {
    const dup = await api('POST', '/products', { name: 'Dup', code: 'bev-001', price: 1, categoryId: ids.Beverages });
    assert.equal(dup.status, 409);
    const badCategory = await api('POST', '/products', { name: 'X', code: 'X-1', price: 1, categoryId: 999 });
    assert.equal(badCategory.status, 400);
  });

  test('returns product details', async () => {
    const res = await api('GET', `/products/${ids.cola}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.code, 'BEV-001');
    assert.equal((await api('GET', '/products/9999')).status, 404);
  });

  test('updates product info but not quantity', async () => {
    const res = await api('PATCH', `/products/${ids.cola}`, { price: 1.5, name: 'Cola 330ml Can' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.price, 1.5);

    const qty = await api('PATCH', `/products/${ids.cola}`, { quantity: 100 });
    assert.equal(qty.status, 400);
  });

  test('filters and sorts products', async () => {
    const byCategory = await api('GET', `/products?categoryId=${ids.Beverages}&sortBy=price&order=desc`);
    assert.deepEqual(
      byCategory.body.data.map((p) => p.code),
      ['BEV-001', 'BEV-002'],
    );

    const search = await api('GET', '/products?search=chip');
    assert.deepEqual(search.body.data.map((p) => p.code), ['SNK-001']);

    const outOfStock = await api('GET', '/products?inStock=false');
    assert.deepEqual(outOfStock.body.data.map((p) => p.code), ['BEV-002']);

    const paged = await api('GET', '/products?limit=2&page=2&sortBy=code');
    assert.deepEqual(paged.body.meta, { page: 2, limit: 2, total: 3, totalPages: 2 });
    assert.deepEqual(paged.body.data.map((p) => p.code), ['SNK-001']);

    const invalid = await api('GET', '/products?sortBy=hacker;DROP&minPrice=5&maxPrice=1');
    assert.equal(invalid.status, 400);
  });
});

describe('stock', () => {
  test('increases and decreases stock', async () => {
    const inc = await api('POST', `/products/${ids.cola}/stock/increase`, { quantity: 5, reason: 'Delivery' });
    assert.equal(inc.status, 200);
    assert.equal(inc.body.data.product.quantity, 15);
    assert.equal(inc.body.data.movement.type, 'INCREASE');

    const dec = await api('POST', `/products/${ids.cola}/stock/decrease`, { quantity: 15 });
    assert.equal(dec.status, 200);
    assert.equal(dec.body.data.product.quantity, 0);
  });

  test('prevents stock from going below zero', async () => {
    const res = await api('POST', `/products/${ids.cola}/stock/decrease`, { quantity: 1 });
    assert.equal(res.status, 422);
    const product = await api('GET', `/products/${ids.cola}`);
    assert.equal(product.body.data.quantity, 0);
  });

  test('prevents stock from exceeding the maximum', async () => {
    const fill = await api('POST', `/products/${ids.cola}/stock/increase`, { quantity: 1_000_000_000 });
    assert.equal(fill.status, 200);

    const res = await api('POST', `/products/${ids.cola}/stock/increase`, { quantity: 1 });
    assert.equal(res.status, 422);
    const product = await api('GET', `/products/${ids.cola}`);
    assert.equal(product.body.data.quantity, 1_000_000_000);

    await api('POST', `/products/${ids.cola}/stock/decrease`, { quantity: 1_000_000_000 });
  });

  test('rejects non-positive adjustments', async () => {
    const res = await api('POST', `/products/${ids.cola}/stock/increase`, { quantity: 0 });
    assert.equal(res.status, 400);
  });

  test('records the full stock history of a product', async () => {
    const res = await api('GET', `/products/${ids.cola}/stock-movements?order=asc`);
    assert.deepEqual(
      res.body.data.map((m) => [m.type, m.quantityChange, m.quantityBefore, m.quantityAfter]),
      [
        ['INITIAL', 10, 0, 10],
        ['INCREASE', 5, 10, 15],
        ['DECREASE', -15, 15, 0],
        ['INCREASE', 1_000_000_000, 0, 1_000_000_000],
        ['DECREASE', -1_000_000_000, 1_000_000_000, 0],
      ],
    );
  });
});

describe('error handling', () => {
  test('returns 400 for malformed JSON', async () => {
    const res = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name": ',
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.message, 'Malformed JSON in request body');
  });

  test('returns 404 with request id for unknown routes', async () => {
    const res = await fetch(`${baseUrl}/does-not-exist`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.requestId, res.headers.get('x-request-id'));
  });

  test('propagates a valid incoming request id', async () => {
    const res = await fetch(`${baseUrl}/health`, { headers: { 'X-Request-Id': 'trace-123' } });
    assert.equal(res.headers.get('x-request-id'), 'trace-123');
  });
});

describe('docs', () => {
  test('serves Swagger UI and the OpenAPI spec', async () => {
    const ui = await fetch(`${baseUrl}/docs/`);
    assert.equal(ui.status, 200);
    assert.match(await ui.text(), /swagger-ui/);

    const yaml = await fetch(`${baseUrl}/docs/openapi.yaml`);
    assert.equal(yaml.status, 200);
  });

  test('every documented operation exists', async () => {
    const { body: spec } = await api('GET', '/docs/openapi.json');
    for (const [path, operations] of Object.entries(spec.paths)) {
      for (const method of Object.keys(operations).filter((key) => key !== 'parameters')) {
        const res = await fetch(`${baseUrl}${path.replace('{id}', '999999')}`, { method: method.toUpperCase() });
        const body = res.status === 204 ? null : await res.json();
        assert.doesNotMatch(body?.error?.message ?? '', /^Route /, `${method.toUpperCase()} ${path} is not implemented`);
      }
    }
  });
});

describe('summary and deletion', () => {
  test('shows total stock per category', async () => {
    await api('POST', `/products/${ids.cola}/stock/increase`, { quantity: 4 });
    const res = await api('GET', '/categories/stock-summary');
    assert.equal(res.status, 200);
    const beverages = res.body.data.categories.find((c) => c.categoryName === 'Beverages');
    assert.deepEqual(
      { productCount: beverages.productCount, totalQuantity: beverages.totalQuantity, totalValue: beverages.totalValue },
      { productCount: 2, totalQuantity: 4, totalValue: 6 },
    );
    const household = res.body.data.categories.find((c) => c.categoryName === 'Household');
    assert.equal(household.totalQuantity, 0);
    assert.deepEqual(res.body.data.totals, { productCount: 3, totalQuantity: 9, totalValue: 16.5 });
  });

  test('blocks deleting a category that has products', async () => {
    const res = await api('DELETE', `/categories/${ids.Beverages}`);
    assert.equal(res.status, 409);
    assert.equal((await api('DELETE', `/categories/${ids.Household}`)).status, 204);
  });

  test('deleting a product keeps its history', async () => {
    assert.equal((await api('DELETE', `/products/${ids.cola}`)).status, 204);
    assert.equal((await api('GET', `/products/${ids.cola}`)).status, 404);

    const history = await api('GET', `/stock-movements?productId=${ids.cola}`);
    assert.equal(history.body.data[0].type, 'REMOVED');
    assert.equal(history.body.data[0].quantityChange, -4);
    assert.equal(history.body.meta.total, 7);
  });

  test('filters global history by type', async () => {
    const res = await api('GET', '/stock-movements?type=INITIAL');
    assert.equal(res.body.meta.total, 3);
    assert.ok(res.body.data.every((m) => m.type === 'INITIAL'));
  });
});
