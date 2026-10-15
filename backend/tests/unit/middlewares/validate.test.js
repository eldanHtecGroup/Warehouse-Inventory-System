import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import validate from '../../../src/middlewares/validate.js';
import ApiError from '../../../src/utils/ApiError.js';
import { createReq, createRes } from '../../helpers/http.js';

const schemas = {
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({ name: z.string().min(1) }),
};

describe('validate middleware', () => {
  it('exposes parsed values on req.validated and calls next()', () => {
    const req = createReq({ params: { id: '7' }, body: { name: 'Cola', extra: true } });
    const next = mock.fn();

    validate(schemas)(req, createRes(), next);

    assert.equal(next.mock.callCount(), 1);
    assert.equal(next.mock.calls[0].arguments.length, 0);
    assert.deepEqual(req.validated, { params: { id: 7 }, body: { name: 'Cola' } });
  });

  it('collects errors from every source with prefixed field paths', () => {
    const req = createReq({ params: { id: 'abc' }, body: { name: '' } });
    const next = mock.fn();

    validate(schemas)(req, createRes(), next);

    const [err] = next.mock.calls[0].arguments;
    assert.ok(err instanceof ApiError);
    assert.equal(err.statusCode, 400);
    assert.deepEqual(
      err.details.map((d) => d.field),
      ['params.id', 'body.name'],
    );
  });

  it('treats a missing source as an empty object', () => {
    const req = createReq({ body: undefined });
    const next = mock.fn();

    validate({ body: z.object({ name: z.string().optional() }) })(req, createRes(), next);

    assert.deepEqual(req.validated.body, {});
  });
});
