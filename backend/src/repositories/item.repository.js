import { randomUUID } from 'node:crypto';
import Item from '../models/item.model.js';

// Repositories are the only layer that touches the data source.
// This one uses an in-memory store; replace the internals with a real
// database later without changing the service layer.

const items = new Map();

const findAll = async () => [...items.values()];

const findById = async (id) => items.get(id) ?? null;

const findBySku = async (sku) => [...items.values()].find((item) => item.sku === sku) ?? null;

const create = async (data) => {
  const item = new Item({ ...data, id: randomUUID() });
  items.set(item.id, item);
  return item;
};

const update = async (id, data) => {
  const updated = new Item({ ...items.get(id), ...data, id, updatedAt: new Date() });
  items.set(id, updated);
  return updated;
};

const remove = async (id) => items.delete(id);

export default { findAll, findById, findBySku, create, update, remove };
