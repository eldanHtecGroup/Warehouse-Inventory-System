import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import productService from '../../../src/services/product.service.js';
import productRepository from '../../../src/repositories/product.repository.js';
import categoryRepository from '../../../src/repositories/category.repository.js';
import stockMovementRepository from '../../../src/repositories/stockMovement.repository.js';
import ApiError from '../../../src/utils/ApiError.js';

// Repositories are replaced with mocks so only business rules are under test.
// t.mock restores the originals automatically after each test.

const product = { id: 1, name: 'Cola', code: 'BEV-1', price: 1.5, quantity: 10, categoryId: 2 };

const isApiError = (status) => (err) => err instanceof ApiError && err.statusCode === status;

const mockMovements = (t) => t.mock.method(stockMovementRepository, 'create', (movement) => ({ id: 99, ...movement }));

describe('productService.listProducts', () => {
  it('returns items with pagination metadata', (t) => {
    t.mock.method(productRepository, 'findMany', () => ({ items: [product], total: 45 }));

    const result = productService.listProducts({ page: 2, limit: 20 });

    assert.deepEqual(result, { items: [product], meta: { page: 2, limit: 20, total: 45, totalPages: 3 } });
  });
});

describe('productService.getProductById', () => {
  it('returns the product', (t) => {
    t.mock.method(productRepository, 'findById', () => product);
    assert.equal(productService.getProductById(1), product);
  });

  it('throws 404 when missing', (t) => {
    t.mock.method(productRepository, 'findById', () => undefined);
    assert.throws(() => productService.getProductById(1), isApiError(404));
  });
});

describe('productService.createProduct', () => {
  const input = { name: 'Cola', code: 'BEV-1', price: 1.5, quantity: 10, categoryId: 2 };

  it('creates the product and records the initial stock', (t) => {
    t.mock.method(categoryRepository, 'findById', () => ({ id: 2 }));
    t.mock.method(productRepository, 'findByCode', () => undefined);
    const create = t.mock.method(productRepository, 'create', () => product);
    const recordMovement = mockMovements(t);

    assert.equal(productService.createProduct(input), product);
    assert.deepEqual(create.mock.calls[0].arguments[0], input);
    assert.deepEqual(recordMovement.mock.calls[0].arguments[0], {
      productId: 1,
      productName: 'Cola',
      productCode: 'BEV-1',
      type: 'INITIAL',
      quantityChange: 10,
      quantityBefore: 0,
      quantityAfter: 10,
      reason: 'Initial stock',
    });
  });

  it('rejects an unknown category', (t) => {
    t.mock.method(categoryRepository, 'findById', () => undefined);
    const create = t.mock.method(productRepository, 'create', () => ({}));

    assert.throws(() => productService.createProduct(input), isApiError(400));
    assert.equal(create.mock.callCount(), 0);
  });

  it('rejects a duplicate code', (t) => {
    t.mock.method(categoryRepository, 'findById', () => ({ id: 2 }));
    t.mock.method(productRepository, 'findByCode', () => ({ ...product, id: 5 }));

    assert.throws(() => productService.createProduct(input), isApiError(409));
  });
});

describe('productService.updateProduct', () => {
  it('updates when all references are valid', (t) => {
    t.mock.method(productRepository, 'findById', () => product);
    t.mock.method(categoryRepository, 'findById', () => ({ id: 3 }));
    t.mock.method(productRepository, 'findByCode', () => product); // same product keeps its code
    const update = t.mock.method(productRepository, 'update', (id, data) => ({ ...product, ...data }));

    const result = productService.updateProduct(1, { code: 'BEV-1', categoryId: 3 });

    assert.equal(result.categoryId, 3);
    assert.deepEqual(update.mock.calls[0].arguments, [1, { code: 'BEV-1', categoryId: 3 }]);
  });

  it('throws 404 for a missing product', (t) => {
    t.mock.method(productRepository, 'findById', () => undefined);
    assert.throws(() => productService.updateProduct(1, { name: 'X' }), isApiError(404));
  });

  it('rejects an unknown category', (t) => {
    t.mock.method(productRepository, 'findById', () => product);
    t.mock.method(categoryRepository, 'findById', () => undefined);
    assert.throws(() => productService.updateProduct(1, { categoryId: 9 }), isApiError(400));
  });

  it('rejects a code used by another product', (t) => {
    t.mock.method(productRepository, 'findById', () => product);
    t.mock.method(productRepository, 'findByCode', () => ({ ...product, id: 2 }));
    assert.throws(() => productService.updateProduct(1, { code: 'TAKEN' }), isApiError(409));
  });
});

describe('productService.deleteProduct', () => {
  it('records the removal of remaining stock and deletes the product', (t) => {
    t.mock.method(productRepository, 'findById', () => product);
    const remove = t.mock.method(productRepository, 'remove', () => true);
    const recordMovement = mockMovements(t);

    productService.deleteProduct(1);

    const movement = recordMovement.mock.calls[0].arguments[0];
    assert.equal(movement.type, 'REMOVED');
    assert.equal(movement.quantityChange, -10);
    assert.equal(movement.quantityBefore, 10);
    assert.equal(movement.quantityAfter, 0);
    assert.deepEqual(remove.mock.calls[0].arguments, [1]);
  });
});

describe('productService stock adjustments', () => {
  const mockStock = (t) => {
    t.mock.method(productRepository, 'findById', () => product);
    return t.mock.method(productRepository, 'updateQuantity', (id, quantity) => ({ ...product, quantity }));
  };

  it('increases stock and records an INCREASE movement', (t) => {
    const updateQuantity = mockStock(t);
    mockMovements(t);

    const { product: updated, movement } = productService.increaseStock(1, { quantity: 5, reason: 'Delivery' });

    assert.deepEqual(updateQuantity.mock.calls[0].arguments, [1, 15]);
    assert.equal(updated.quantity, 15);
    assert.equal(movement.type, 'INCREASE');
    assert.equal(movement.quantityChange, 5);
    assert.equal(movement.quantityBefore, 10);
    assert.equal(movement.reason, 'Delivery');
  });

  it('decreases stock down to exactly zero', (t) => {
    mockStock(t);
    mockMovements(t);

    const { product: updated, movement } = productService.decreaseStock(1, { quantity: 10 });

    assert.equal(updated.quantity, 0);
    assert.equal(movement.type, 'DECREASE');
    assert.equal(movement.quantityChange, -10);
  });

  it('refuses to let stock fall below zero and changes nothing', (t) => {
    const updateQuantity = mockStock(t);
    const recordMovement = mockMovements(t);

    assert.throws(
      () => productService.decreaseStock(1, { quantity: 11 }),
      (err) => isApiError(422)(err) && /requested 11, available 10/.test(err.message),
    );
    assert.equal(updateQuantity.mock.callCount(), 0);
    assert.equal(recordMovement.mock.callCount(), 0);
  });

  it('refuses to let stock exceed the maximum and changes nothing', (t) => {
    t.mock.method(productRepository, 'findById', () => ({ ...product, quantity: 999_999_990 }));
    const updateQuantity = t.mock.method(productRepository, 'updateQuantity', () => ({}));
    const recordMovement = mockMovements(t);

    assert.throws(
      () => productService.increaseStock(1, { quantity: 11 }),
      (err) => isApiError(422)(err) && /cannot exceed 1000000000/.test(err.message),
    );
    assert.equal(updateQuantity.mock.callCount(), 0);
    assert.equal(recordMovement.mock.callCount(), 0);
  });

  it('allows stock to reach exactly the maximum', (t) => {
    t.mock.method(productRepository, 'findById', () => ({ ...product, quantity: 999_999_990 }));
    t.mock.method(productRepository, 'updateQuantity', (id, quantity) => ({ ...product, quantity }));
    mockMovements(t);

    assert.equal(productService.increaseStock(1, { quantity: 10 }).product.quantity, 1_000_000_000);
  });

  it('throws 404 when adjusting a missing product', (t) => {
    t.mock.method(productRepository, 'findById', () => undefined);
    assert.throws(() => productService.increaseStock(1, { quantity: 1 }), isApiError(404));
  });
});
