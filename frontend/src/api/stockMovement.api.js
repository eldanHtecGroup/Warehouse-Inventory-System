import httpClient from './httpClient.js';

// History of all stock changes, including those of deleted products.
// Params: productId, type, from, to (ISO), order, page, limit. Returns { data, meta }.
const list = (params, options) => httpClient.get('/stock-movements', { ...options, params });

export default { list };
