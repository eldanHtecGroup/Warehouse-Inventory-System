import itemRepository from '../repositories/item.repository.js';
import ApiError from '../utils/ApiError.js';

// Services hold business logic. They know nothing about req/res
// and reach the data source only through repositories.

const getAllItems = () => itemRepository.findAll();

const getItemById = async (id) => {
  const item = await itemRepository.findById(id);
  if (!item) throw ApiError.notFound(`Item with id ${id} not found`);
  return item;
};

const createItem = async (data) => {
  const existing = await itemRepository.findBySku(data.sku);
  if (existing) throw ApiError.conflict(`Item with SKU ${data.sku} already exists`);
  return itemRepository.create(data);
};

const updateItem = async (id, data) => {
  await getItemById(id);
  if (data.sku) {
    const existing = await itemRepository.findBySku(data.sku);
    if (existing && existing.id !== id) {
      throw ApiError.conflict(`Item with SKU ${data.sku} already exists`);
    }
  }
  return itemRepository.update(id, data);
};

const deleteItem = async (id) => {
  await getItemById(id);
  await itemRepository.remove(id);
};

export default { getAllItems, getItemById, createItem, updateItem, deleteItem };
