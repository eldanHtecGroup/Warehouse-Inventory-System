import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import ApiError from '../../../src/utils/ApiError.js';

describe('ApiError', () => {
  it('is an Error with status code and details', () => {
    const err = new ApiError(418, 'Teapot', ['detail']);
    assert.ok(err instanceof Error);
    assert.equal(err.name, 'ApiError');
    assert.equal(err.statusCode, 418);
    assert.equal(err.message, 'Teapot');
    assert.deepEqual(err.details, ['detail']);
  });

  const factories = [
    ['badRequest', 400, 'Bad Request'],
    ['notFound', 404, 'Not Found'],
    ['conflict', 409, 'Conflict'],
    ['unprocessable', 422, 'Unprocessable Entity'],
  ];

  for (const [factory, status, defaultMessage] of factories) {
    it(`${factory}() creates a ${status} error`, () => {
      assert.equal(ApiError[factory]().statusCode, status);
      assert.equal(ApiError[factory]().message, defaultMessage);
      assert.equal(ApiError[factory]('custom').message, 'custom');
    });
  }

  it('badRequest() keeps validation details', () => {
    assert.deepEqual(ApiError.badRequest('Invalid', [{ field: 'x' }]).details, [{ field: 'x' }]);
  });
});
