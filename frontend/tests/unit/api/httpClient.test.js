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

  it('falls back to the status text when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse(undefined, 502));
    await expect(httpClient.get('/health')).rejects.toMatchObject({ message: 'Status 502', status: 502 });
  });

  it('turns network failures into a friendly ApiError', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(httpClient.get('/products')).rejects.toMatchObject({ status: 0, message: /Unable to reach/ });
  });

  it('rethrows aborts untouched', async () => {
    const abort = new DOMException('Aborted', 'AbortError');
    fetchMock.mockRejectedValue(abort);
    await expect(httpClient.get('/products')).rejects.toBe(abort);
  });
});
