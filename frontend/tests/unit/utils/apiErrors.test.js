import { describe, expect, it } from 'vitest';
import { getErrorMessage, getFieldErrors } from '../../../src/utils/apiErrors.js';

describe('getFieldErrors', () => {
  it('maps body.* validation details to field names', () => {
    const error = {
      details: [
        { field: 'body.price', message: 'Too many decimals' },
        { field: 'body.name', message: 'Required' },
        { field: 'query.page', message: 'Ignored' },
      ],
    };
    expect(getFieldErrors(error)).toEqual({ price: 'Too many decimals', name: 'Required' });
  });

  it('returns an empty object when there are no details', () => {
    expect(getFieldErrors(new Error('x'))).toEqual({});
    expect(getFieldErrors(null)).toEqual({});
  });
});

describe('getErrorMessage', () => {
  it('returns the error message or a fallback', () => {
    expect(getErrorMessage(new Error('Boom'))).toBe('Boom');
    expect(getErrorMessage(null)).toBe('Something went wrong.');
    expect(getErrorMessage({}, 'Custom')).toBe('Custom');
  });
});
