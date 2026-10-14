import httpClient from './httpClient.js';

// The backend wraps resources in { data }; unwrap it here so pages stay unaware of it.

const getAll = async (options) => (await httpClient.get('/items', options)).data;

const getById = async (id, options) => (await httpClient.get(`/items/${id}`, options)).data;

const create = async (item) => (await httpClient.post('/items', item)).data;

const update = async (id, item) => (await httpClient.put(`/items/${id}`, item)).data;

const remove = (id) => httpClient.delete(`/items/${id}`);

export default { getAll, getById, create, update, remove };
