import itemService from '../services/item.service.js';

// Controllers handle HTTP only: read the request, call a service, send the response.
// Express 5 forwards rejected promises to the error handler automatically.

const getAll = async (req, res) => {
  const items = await itemService.getAllItems();
  res.status(200).json({ data: items });
};

const getById = async (req, res) => {
  const item = await itemService.getItemById(req.params.id);
  res.status(200).json({ data: item });
};

const create = async (req, res) => {
  const item = await itemService.createItem(req.body);
  res.status(201).json({ data: item });
};

const update = async (req, res) => {
  const item = await itemService.updateItem(req.params.id, req.body);
  res.status(200).json({ data: item });
};

const remove = async (req, res) => {
  await itemService.deleteItem(req.params.id);
  res.status(204).send();
};

export default { getAll, getById, create, update, remove };
