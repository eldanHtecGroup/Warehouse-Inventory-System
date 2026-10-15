import httpClient from './httpClient.js';

// List endpoints return the whole { data, meta } payload because pages need the pagination meta.

const list = (params, options) => httpClient.get('/products', { ...options, params });

const getById = async (id, options) => (await httpClient.get(`/products/${id}`, options)).data;

const create = async (product) => (await httpClient.post('/products', product)).data;

// Quantity cannot be changed here; use increaseStock / decreaseStock so the change is recorded in history
const update = async (id, changes) => (await httpClient.patch(`/products/${id}`, changes)).data;

const remove = (id) => httpClient.delete(`/products/${id}`);

// Both return { product, movement }
const increaseStock = async (id, { quantity, reason }) =>
  (await httpClient.post(`/products/${id}/stock/increase`, { quantity, reason })).data;

const decreaseStock = async (id, { quantity, reason }) =>
  (await httpClient.post(`/products/${id}/stock/decrease`, { quantity, reason })).data;

const getStockMovements = (id, params, options) =>
  httpClient.get(`/products/${id}/stock-movements`, { ...options, params });

export default { list, getById, create, update, remove, increaseStock, decreaseStock, getStockMovements };
