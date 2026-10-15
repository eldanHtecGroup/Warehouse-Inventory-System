import httpClient from './httpClient.js';

// The backend wraps resources in { data }; unwrap it here so pages stay unaware of it.

const getAll = async (options) => (await httpClient.get('/categories', options)).data;

const getById = async (id, options) => (await httpClient.get(`/categories/${id}`, options)).data;

// Returns { categories: [{ categoryId, categoryName, productCount, totalQuantity, totalValue }], totals }
const getStockSummary = async (options) => (await httpClient.get('/categories/stock-summary', options)).data;

const create = async (category) => (await httpClient.post('/categories', category)).data;

const update = async (id, changes) => (await httpClient.patch(`/categories/${id}`, changes)).data;

const remove = (id) => httpClient.delete(`/categories/${id}`);

export default { getAll, getById, getStockSummary, create, update, remove };
