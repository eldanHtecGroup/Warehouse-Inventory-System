import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import db from '../../../src/db/index.js';
import categoryRepository from '../../../src/repositories/category.repository.js';
import productRepository from '../../../src/repositories/product.repository.js';
import stockMovementRepository from '../../../src/repositories/stockMovement.repository.js';
import productService from '../../../src/services/product.service.js';

// Repositories are thin SQL wrappers, so they are tested against a real
// in-memory SQLite database (DB_PATH=:memory: is set in tests/setup.js).

const list = (filters) =>
  productRepository.findMany({ sortBy: 'name', order: 'asc', page: 1, limit: 20, ...filters }).items.map((p) => p.code);

let drinks;
let snacks;

beforeEach(() => {
  db.exec('DELETE FROM stock_movements; DELETE FROM products; DELETE FROM categories;');
  drinks = categoryRepository.create({ name: 'Drinks' });
  snacks = categoryRepository.create({ name: 'Snacks', description: 'Crunchy' });
  productRepository.create({ name: 'Cola', code: 'D-1', price: 1.2, quantity: 10, categoryId: drinks.id });
  productRepository.create({ name: 'water', code: 'D-2', price: 0.5, quantity: 0, categoryId: drinks.id });
  productRepository.create({ name: '100% Juice', code: 'D-3', price: 2.75, quantity: 4, categoryId: drinks.id });
  productRepository.create({ name: 'Chips', code: 'S_1', price: 1.99, quantity: 7, categoryId: snacks.id });
});

describe('categoryRepository', () => {
  it('creates and reads categories with product counts', () => {
    assert.equal(categoryRepository.findById(drinks.id).productCount, 3);
    assert.equal(categoryRepository.findByName('DRINKS').id, drinks.id);
    assert.equal(categoryRepository.findById(999), undefined);
    assert.deepEqual(
      categoryRepository.findAll().map((c) => c.name),
      ['Drinks', 'Snacks'],
    );
  });

  it('updates and removes categories', () => {
    const empty = categoryRepository.create({ name: 'Empty' });
    assert.equal(categoryRepository.update(empty.id, { description: 'Nothing here' }).description, 'Nothing here');
    assert.equal(categoryRepository.remove(empty.id), true);
    assert.equal(categoryRepository.remove(empty.id), false);
  });

  it('refuses to delete a category that is referenced by products', () => {
    // ON DELETE RESTRICT is reported by SQLite as SQLITE_CONSTRAINT_TRIGGER
    assert.throws(() => categoryRepository.remove(drinks.id), /FOREIGN KEY constraint failed/);
  });

  it('summarises stock and value per category', () => {
    const summary = categoryRepository.getStockSummary();
    assert.deepEqual(summary[0], {
      categoryId: drinks.id,
      categoryName: 'Drinks',
      productCount: 3,
      totalQuantity: 14,
      totalValue: 23,
    });
    assert.equal(summary[1].totalValue, 13.93);
  });
});

describe('productRepository', () => {
  it('maps rows to API objects with prices in decimal units', () => {
    const product = productRepository.findByCode('d-1');
    assert.equal(product.price, 1.2);
    assert.equal(product.categoryName, 'Drinks');
    assert.equal(product.description, null);
    assert.equal(productRepository.findById(999), undefined);
  });

  it('searches name and code case-insensitively and escapes LIKE wildcards', () => {
    assert.deepEqual(list({ search: 'WATER' }), ['D-2']);
    assert.deepEqual(list({ search: '%' }), ['D-3']);
    assert.deepEqual(list({ search: '_' }), ['S_1']);
  });

  it('filters by category, price, quantity and availability', () => {
    assert.deepEqual(list({ categoryId: snacks.id }), ['S_1']);
    assert.deepEqual(list({ minPrice: 1.2, maxPrice: 1.99 }), ['S_1', 'D-1']);
    assert.deepEqual(list({ minQuantity: 4, maxQuantity: 7 }), ['D-3', 'S_1']);
    assert.deepEqual(list({ inStock: false }), ['D-2']);
    assert.equal(list({ inStock: true }).length, 3);
  });

  it('sorts by any whitelisted field and direction', () => {
    assert.deepEqual(list({ sortBy: 'price', order: 'desc' }), ['D-3', 'S_1', 'D-1', 'D-2']);
    assert.deepEqual(list({ sortBy: 'quantity' }), ['D-2', 'D-3', 'S_1', 'D-1']);
    assert.deepEqual(list({ sortBy: 'category', order: 'desc' })[0], 'S_1');
    // name sort is case-insensitive: "water" comes after "Chips"
    assert.deepEqual(list({}), ['D-3', 'S_1', 'D-1', 'D-2']);
  });

  it('paginates and reports the total', () => {
    const page = productRepository.findMany({ sortBy: 'code', order: 'asc', page: 2, limit: 3 });
    assert.equal(page.total, 4);
    assert.deepEqual(page.items.map((p) => p.code), ['S_1']);
  });

  it('updates info and quantity, and removes products', () => {
    const cola = productRepository.findByCode('D-1');
    const updated = productRepository.update(cola.id, { price: 1.35, description: 'Can', categoryId: snacks.id });
    assert.equal(updated.price, 1.35);
    assert.equal(updated.categoryName, 'Snacks');
    assert.equal(productRepository.updateQuantity(cola.id, 3).quantity, 3);
    assert.equal(productRepository.remove(cola.id), true);
    assert.equal(productRepository.remove(cola.id), false);
  });

  it('is protected against negative stock by a database constraint', () => {
    const cola = productRepository.findByCode('D-1');
    assert.throws(() => productRepository.updateQuantity(cola.id, -1), { code: 'SQLITE_CONSTRAINT_CHECK' });
  });
});

describe('stockMovementRepository', () => {
  const record = (overrides) =>
    stockMovementRepository.create({
      productId: 1,
      productName: 'Cola',
      productCode: 'D-1',
      type: 'INCREASE',
      quantityChange: 5,
      quantityBefore: 0,
      quantityAfter: 5,
      ...overrides,
    });

  it('creates and filters movements', () => {
    const first = record({ reason: 'Delivery' });
    record({ type: 'DECREASE', quantityChange: -2, quantityBefore: 5, quantityAfter: 3 });
    record({ productId: 2, productCode: 'D-2' });

    assert.equal(first.reason, 'Delivery');
    assert.equal(stockMovementRepository.findById(999), undefined);

    const base = { page: 1, limit: 10 };
    assert.equal(stockMovementRepository.findMany(base).total, 3);
    assert.equal(stockMovementRepository.findMany({ ...base, productId: 1 }).total, 2);
    assert.equal(stockMovementRepository.findMany({ ...base, type: 'DECREASE' }).items[0].quantityChange, -2);
    assert.equal(stockMovementRepository.findMany({ ...base, from: '2100-01-01T00:00:00.000Z' }).total, 0);
    assert.equal(stockMovementRepository.findMany({ ...base, to: '2000-01-01T00:00:00.000Z' }).total, 0);
  });

  it('orders newest first by default and oldest first on request', () => {
    const a = record();
    const b = record();
    assert.equal(stockMovementRepository.findMany({ page: 1, limit: 10 }).items[0].id, b.id);
    assert.equal(stockMovementRepository.findMany({ order: 'asc', page: 1, limit: 10 }).items[0].id, a.id);
  });
});

describe('transactions', () => {
  it('rolls back a stock change when recording its history fails', (t) => {
    const cola = productRepository.findByCode('D-1');
    t.mock.method(stockMovementRepository, 'create', () => {
      throw new Error('disk full');
    });

    assert.throws(() => productService.increaseStock(cola.id, { quantity: 5 }), /disk full/);
    assert.equal(productRepository.findById(cola.id).quantity, 10);
  });
});
