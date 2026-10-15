import { beforeEach, describe, expect, it, vi } from 'vitest';
import httpClient, { ApiError } from '../../../src/api/httpClient.js';
import { jsonResponse } from '../../helpers/fixtures.js';

describe('httpClient', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.spyOn(globalThis, 'fetch');
  });

  it('GETs JSON with the base URL and query params', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [1] }));

    await expect(httpClient.get('/products', { params: { page: 2, search: '' } })).resolves.toEqual({ data: [1] });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/products?page=2');
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
    expect(init.headers).not.toHaveProperty('Content-Type');
  });

  it.each([
    ['post', 'POST'],
    ['patch', 'PATCH'],
  ])('%s sends a JSON body', async (method, httpMethod) => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { id: 1 } }, 201));

    await httpClient[method]('/products', { name: 'Tea' });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe(httpMethod);
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ name: 'Tea' }));
  });

  it('returns null for 204 No Content', async () => {
    fetchMock.mockResolvedValue(jsonResponse(undefined, 204));
    await expect(httpClient.delete('/products/1')).resolves.toBeNull();
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
  });

  it('throws an ApiError with the backend message, status and details', async () => {
    const details = [{ field: 'body.price', message: 'Invalid' }];
    fetchMock.mockResolvedValue(jsonResponse({ error: { message: 'Validation failed', details } }, 400));

    const error = await httpClient.post('/products', {}).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: 'Validation failed', status: 400, details });
  });

  it('does not log expected 4xx errors', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValue(jsonResponse({ error: { message: 'Insufficient stock' } }, 422));

    await expect(httpClient.post('/products/1/stock/decrease', { quantity: 5 })).rejects.toMatchObject({ status: 422 });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('logs server errors with the backend request id', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValue(jsonResponse({ error: { message: 'Internal Server Error', requestId: 'req-7' } }, 500));

    await expect(httpClient.get('/products')).rejects.toMatchObject({ status: 500 });
    expect(consoleError).toHaveBeenCalledWith(
      '[app error]',
      expect.objectContaining({ source: 'http', method: 'GET', path: '/products', status: 500, requestId: 'req-7' }),
      expect.any(ApiError),
    );
  });

  it('falls back to the status text when the error body is not JSON', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValue(jsonResponse(undefined, 502));
    await expect(httpClient.get('/health')).rejects.toMatchObject({ message: 'Status 502', status: 502 });
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it('turns network failures into a friendly ApiError and logs the cause', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const cause = new TypeError('Failed to fetch');
    fetchMock.mockRejectedValue(cause);

    await expect(httpClient.get('/products')).rejects.toMatchObject({ status: 0, message: /Unable to reach/ });
    expect(consoleError).toHaveBeenCalledWith(
      '[app error]',
      expect.objectContaining({ message: 'Failed to fetch', source: 'http', method: 'GET', path: '/products' }),
      cause,
    );
  });

  it('rethrows aborts untouched', async () => {
    const abort = new DOMException('Aborted', 'AbortError');
    fetchMock.mockRejectedValue(abort);
    await expect(httpClient.get('/products')).rejects.toBe(abort);
  });
});
