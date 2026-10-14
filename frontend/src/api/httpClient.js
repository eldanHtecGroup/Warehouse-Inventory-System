import config from '../config/index.js';

// Thin wrapper around fetch: prefixes the API base URL, sends/parses JSON,
// and throws an ApiError carrying the backend's { error: { message } } payload.

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const request = async (path, { method = 'GET', body, headers, ...options } = {}) => {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...headers,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
    ...options,
  });

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
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export default httpClient;
