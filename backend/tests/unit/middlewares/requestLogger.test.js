import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import requestLogger, { genReqId, customLogLevel } from '../../../src/middlewares/requestLogger.js';
import notFound from '../../../src/middlewares/notFound.js';
import ApiError from '../../../src/utils/ApiError.js';
import { createReq, createRes } from '../../helpers/http.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('genReqId', () => {
  it('reuses a well-formed incoming X-Request-Id and echoes it back', () => {
    const res = createRes();
    assert.equal(genReqId(createReq({ headers: { 'x-request-id': 'abc-123' } }), res), 'abc-123');
    assert.equal(res.headers['x-request-id'], 'abc-123');
  });

  it('generates a UUID when the header is missing or unsafe', () => {
    assert.match(genReqId(createReq(), createRes()), UUID);
    assert.match(genReqId(createReq({ headers: { 'x-request-id': 'bad id\n<script>' } }), createRes()), UUID);
  });
});

describe('customLogLevel', () => {
  it('chooses the level from the outcome of the request', () => {
    assert.equal(customLogLevel({}, { statusCode: 200 }), 'info');
    assert.equal(customLogLevel({}, { statusCode: 404 }), 'warn');
    assert.equal(customLogLevel({}, { statusCode: 500 }), 'error');
    assert.equal(customLogLevel({}, { statusCode: 200 }, new Error('aborted')), 'error');
  });
});

describe('requestLogger', () => {
  it('is an Express middleware', () => {
    assert.equal(typeof requestLogger, 'function');
    assert.equal(requestLogger.length, 3);
  });
});

describe('notFound', () => {
  it('forwards a 404 ApiError naming the route', () => {
    const next = mock.fn();
    notFound(createReq({ method: 'GET', originalUrl: '/api/nope' }), createRes(), next);

    const [err] = next.mock.calls[0].arguments;
    assert.ok(err instanceof ApiError);
    assert.equal(err.statusCode, 404);
    assert.equal(err.message, 'Route GET /api/nope not found');
  });
});
