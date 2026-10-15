import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import categoryController from '../../../src/controllers/category.controller.js';
import productController from '../../../src/controllers/product.controller.js';
import stockMovementController from '../../../src/controllers/stockMovement.controller.js';
import healthController from '../../../src/controllers/health.controller.js';
import categoryService from '../../../src/services/category.service.js';
import productService from '../../../src/services/product.service.js';
import stockMovementService from '../../../src/services/stockMovement.service.js';
import { createReq, createRes } from '../../helpers/http.js';

// Controllers only translate between HTTP and services: check that validated
// input reaches the right service call and the result is sent with the right status.

const call = (handler, validated = {}) => {
  const res = createRes();
  handler(createReq({ validated }), res);
  return res;
};

describe('categoryController', () => {
  it('handles every category route', (t) => {
    t.mock.method(categoryService, 'getAllCategories', () => ['all']);
    t.mock.method(categoryService, 'getCategoryById', (id) => ({ id }));
    t.mock.method(categoryService, 'getStockSummary', () => 'summary');
    t.mock.method(categoryService, 'createCategory', (body) => body);
    t.mock.method(categoryService, 'updateCategory', (id, body) => ({ id, ...body }));
    const remove = t.mock.method(categoryService, 'deleteCategory', () => {});

    assert.deepEqual(call(categoryController.getAll).body, { data: ['all'] });
    assert.deepEqual(call(categoryController.getById, { params: { id: 3 } }).body, { data: { id: 3 } });
    assert.deepEqual(call(categoryController.getStockSummary).body, { data: 'summary' });

    const created = call(categoryController.create, { body: { name: 'New' } });
    assert.equal(created.statusCode, 201);
    assert.deepEqual(created.body, { data: { name: 'New' } });

    const updated = call(categoryController.update, { params: { id: 3 }, body: { name: 'X' } });
    assert.deepEqual(updated.body, { data: { id: 3, name: 'X' } });

    const removed = call(categoryController.remove, { params: { id: 3 } });
    assert.equal(removed.statusCode, 204);
    assert.deepEqual(remove.mock.calls[0].arguments, [3]);
  });
});

describe('productController', () => {
  it('handles product CRUD routes', (t) => {
    t.mock.method(productService, 'listProducts', () => ({ items: ['p'], meta: { total: 1 } }));
    t.mock.method(productService, 'getProductById', (id) => ({ id }));
    t.mock.method(productService, 'createProduct', (body) => body);
    t.mock.method(productService, 'updateProduct', (id, body) => ({ id, ...body }));
    const remove = t.mock.method(productService, 'deleteProduct', () => {});

    assert.deepEqual(call(productController.getAll, { query: { page: 1 } }).body, { data: ['p'], meta: { total: 1 } });
    assert.deepEqual(call(productController.getById, { params: { id: 1 } }).body, { data: { id: 1 } });
    assert.equal(call(productController.create, { body: { name: 'Cola' } }).statusCode, 201);
    assert.deepEqual(call(productController.update, { params: { id: 1 }, body: { price: 2 } }).body, {
      data: { id: 1, price: 2 },
    });
    assert.equal(call(productController.remove, { params: { id: 1 } }).statusCode, 204);
    assert.deepEqual(remove.mock.calls[0].arguments, [1]);
  });

  it('handles stock routes', (t) => {
    const increase = t.mock.method(productService, 'increaseStock', () => 'increased');
    const decrease = t.mock.method(productService, 'decreaseStock', () => 'decreased');
    const history = t.mock.method(stockMovementService, 'listProductMovements', () => ({ items: [], meta: {} }));
    const validated = { params: { id: 1 }, body: { quantity: 2 } };

    assert.deepEqual(call(productController.increaseStock, validated).body, { data: 'increased' });
    assert.deepEqual(increase.mock.calls[0].arguments, [1, { quantity: 2 }]);
    assert.deepEqual(call(productController.decreaseStock, validated).body, { data: 'decreased' });
    assert.deepEqual(decrease.mock.calls[0].arguments, [1, { quantity: 2 }]);

    call(productController.getStockMovements, { params: { id: 1 }, query: { page: 1 } });
    assert.deepEqual(history.mock.calls[0].arguments, [1, { page: 1 }]);
  });
});

describe('stockMovementController', () => {
  it('lists movements', (t) => {
    t.mock.method(stockMovementService, 'listMovements', () => ({ items: ['m'], meta: { total: 1 } }));
    assert.deepEqual(call(stockMovementController.getAll, { query: {} }).body, { data: ['m'], meta: { total: 1 } });
  });
});

describe('healthController', () => {
  it('reports status ok', () => {
    const res = call(healthController.getHealth);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'ok');
  });
});
