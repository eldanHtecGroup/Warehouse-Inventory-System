import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import categoryService from '../../../src/services/category.service.js';
import categoryRepository from '../../../src/repositories/category.repository.js';
import ApiError from '../../../src/utils/ApiError.js';

const category = { id: 1, name: 'Snacks', description: null, productCount: 0 };

const isApiError = (status) => (err) => err instanceof ApiError && err.statusCode === status;

describe('categoryService', () => {
  it('lists all categories', (t) => {
    t.mock.method(categoryRepository, 'findAll', () => [category]);
    assert.deepEqual(categoryService.getAllCategories(), [category]);
  });

  it('gets a category or throws 404', (t) => {
    const findById = t.mock.method(categoryRepository, 'findById', () => category);
    assert.equal(categoryService.getCategoryById(1), category);

    findById.mock.mockImplementation(() => undefined);
    assert.throws(() => categoryService.getCategoryById(1), isApiError(404));
  });

  it('creates a category with a unique name', (t) => {
    t.mock.method(categoryRepository, 'findByName', () => undefined);
    const create = t.mock.method(categoryRepository, 'create', () => category);

    assert.equal(categoryService.createCategory({ name: 'Snacks' }), category);
    assert.deepEqual(create.mock.calls[0].arguments[0], { name: 'Snacks' });
  });

  it('rejects a duplicate name on create', (t) => {
    t.mock.method(categoryRepository, 'findByName', () => category);
    assert.throws(() => categoryService.createCategory({ name: 'snacks' }), isApiError(409));
  });

  it('allows renaming a category to its own name', (t) => {
    t.mock.method(categoryRepository, 'findById', () => category);
    t.mock.method(categoryRepository, 'findByName', () => category);
    t.mock.method(categoryRepository, 'update', (id, data) => ({ ...category, ...data }));

    assert.equal(categoryService.updateCategory(1, { name: 'SNACKS' }).name, 'SNACKS');
  });

  it('rejects renaming to another category name', (t) => {
    t.mock.method(categoryRepository, 'findById', () => category);
    t.mock.method(categoryRepository, 'findByName', () => ({ ...category, id: 2 }));
    assert.throws(() => categoryService.updateCategory(1, { name: 'Beverages' }), isApiError(409));
  });

  it('updates the description without a name check', (t) => {
    t.mock.method(categoryRepository, 'findById', () => category);
    const findByName = t.mock.method(categoryRepository, 'findByName', () => undefined);
    t.mock.method(categoryRepository, 'update', (id, data) => ({ ...category, ...data }));

    assert.equal(categoryService.updateCategory(1, { description: 'Crisps' }).description, 'Crisps');
    assert.equal(findByName.mock.callCount(), 0);
  });

  it('deletes an empty category', (t) => {
    t.mock.method(categoryRepository, 'findById', () => category);
    const remove = t.mock.method(categoryRepository, 'remove', () => true);

    categoryService.deleteCategory(1);
    assert.deepEqual(remove.mock.calls[0].arguments, [1]);
  });

  it('refuses to delete a category that still has products', (t) => {
    t.mock.method(categoryRepository, 'findById', () => ({ ...category, productCount: 3 }));
    const remove = t.mock.method(categoryRepository, 'remove', () => true);

    assert.throws(() => categoryService.deleteCategory(1), isApiError(409));
    assert.equal(remove.mock.callCount(), 0);
  });

  it('adds up the stock summary totals', (t) => {
    t.mock.method(categoryRepository, 'getStockSummary', () => [
      { categoryId: 1, categoryName: 'A', productCount: 2, totalQuantity: 10, totalValue: 0.1 },
      { categoryId: 2, categoryName: 'B', productCount: 1, totalQuantity: 5, totalValue: 0.2 },
    ]);

    const { categories, totals } = categoryService.getStockSummary();

    assert.equal(categories.length, 2);
    // 0.1 + 0.2 is rounded to cents rather than 0.30000000000000004
    assert.deepEqual(totals, { productCount: 3, totalQuantity: 15, totalValue: 0.3 });
  });
});
