import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import errorHandler, { normalizeError } from '../../../src/middlewares/errorHandler.js';
import ApiError from '../../../src/utils/ApiError.js';
import { createReq, createRes, createLog } from '../../helpers/http.js';

describe('normalizeError', () => {
  it('passes ApiError status, message and details through', () => {
    assert.deepEqual(normalizeError(ApiError.badRequest('Invalid', ['x'])), {
      statusCode: 400,
      message: 'Invalid',
      details: ['x'],
    });
  });

  it('maps malformed JSON bodies to 400', () => {
    const err = Object.assign(new SyntaxError('Unexpected end'), { type: 'entity.parse.failed', status: 400 });
    assert.deepEqual(normalizeError(err), { statusCode: 400, message: 'Malformed JSON in request body' });
  });

  it('maps SQLite constraint violations to 409 without leaking SQL details', () => {
    const err = Object.assign(new Error('UNIQUE constraint failed: products.code'), {
      code: 'SQLITE_CONSTRAINT_UNIQUE',
    });
    assert.deepEqual(normalizeError(err), { statusCode: 409, message: 'Request conflicts with existing data' });
  });

  it('uses the message of exposable 4xx http errors', () => {
    const err = Object.assign(new Error('request entity too large'), { status: 413, expose: true });
    assert.deepEqual(normalizeError(err), { statusCode: 413, message: 'request entity too large' });
  });

  it('hides the message of non-exposable 4xx errors', () => {
    const err = Object.assign(new Error('internal detail'), { statusCode: 400, expose: false });
    assert.deepEqual(normalizeError(err), { statusCode: 400, message: 'Bad Request' });
  });

  it('keeps specific 5xx statuses but hides their message', () => {
    assert.deepEqual(normalizeError(Object.assign(new Error('db locked'), { status: 503 })), {
      statusCode: 503,
      message: 'Service Unavailable',
    });
    assert.deepEqual(normalizeError(Object.assign(new Error('x'), { statusCode: 599 })), {
      statusCode: 599,
      message: 'Internal Server Error',
    });
    assert.equal(normalizeError(Object.assign(new Error('x'), { status: 600 })).statusCode, 500);
  });

  it('turns everything else into a generic 500', () => {
    assert.deepEqual(normalizeError(new Error('db exploded')), { statusCode: 500, message: 'Internal Server Error' });
    assert.equal(normalizeError('a string was thrown').statusCode, 500);
    assert.equal(normalizeError(undefined).statusCode, 500);
  });
});

describe('errorHandler', () => {
  it('logs server errors with the stack trace and returns a generic message', () => {
    const log = createLog();
    const req = createReq({ id: 'req-1', log });
    const res = createRes();
    const err = new Error('boom');

    errorHandler(err, req, res, mock.fn());

    assert.equal(log.error.mock.callCount(), 1);
    assert.equal(log.error.mock.calls[0].arguments[0].err, err);
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: { message: 'Internal Server Error', requestId: 'req-1' } });
  });

  it('logs client errors as warnings and returns their details', () => {
    const log = createLog();
    const res = createRes();

    errorHandler(ApiError.badRequest('Validation failed', ['bad']), createReq({ log }), res, mock.fn());

    assert.equal(log.error.mock.callCount(), 0);
    assert.equal(log.warn.mock.callCount(), 1);
    assert.equal(log.warn.mock.calls[0].arguments[1], 'Validation failed');
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { error: { message: 'Validation failed', details: ['bad'] } });
  });

  it('delegates to Express when the response has already started', () => {
    const res = createRes();
    res.headersSent = true;
    const next = mock.fn();
    const err = new Error('late failure');

    errorHandler(err, createReq({ log: createLog() }), res, next);

    assert.equal(next.mock.calls[0].arguments[0], err);
    assert.equal(res.json.mock.callCount(), 0);
  });

  it('falls back to the application logger when no request logger exists', () => {
    const res = createRes();
    errorHandler(ApiError.notFound(), createReq(), res, mock.fn());
    assert.equal(res.statusCode, 404);
  });
});
