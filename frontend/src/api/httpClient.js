import config from '../config/index.js';
import { buildQueryString } from '../utils/queryString.js';

// Thin wrapper around fetch: prefixes the API base URL, serializes query params,
// sends/parses JSON, and throws an ApiError carrying the backend's
// { error: { message, details } } payload.

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const request = async (path, { method = 'GET', body, params, headers, ...options } = {}) => {
  let response;
  try {
    response = await fetch(`${config.apiBaseUrl}${path}${buildQueryString(params)}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...headers,
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
      ...options,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Unable to reach the server. Check your connection and try again.', 0);
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = payload?.error;
    throw new ApiError(error?.message || response.statusText, response.status, error?.details);
  }

  return payload;
};

const httpClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export default httpClient;
