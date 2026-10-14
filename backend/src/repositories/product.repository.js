import db, { NOW } from '../db/index.js';

const toProduct = (row) =>
  row && {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    price: row.price_cents / 100,
    quantity: row.quantity,
    categoryId: row.category_id,
    categoryName: row.category_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

// Maps API field names to columns; price is converted to integer cents
const toColumns = (fields) => {
  const columns = {};
  if (fields.name !== undefined) columns.name = fields.name;
  if (fields.code !== undefined) columns.code = fields.code;
  if (fields.description !== undefined) columns.description = fields.description;
  if (fields.price !== undefined) columns.price_cents = Math.round(fields.price * 100);
  if (fields.categoryId !== undefined) columns.category_id = fields.categoryId;
  return columns;
};

const FROM_PRODUCTS = 'FROM products p JOIN categories c ON c.id = p.category_id';
const SELECT_PRODUCT = `SELECT p.*, c.name AS category_name ${FROM_PRODUCTS}`;

// Whitelist of sortable fields; values are interpolated into SQL so must never come from user input directly
const SORT_COLUMNS = {
  name: 'p.name',
  code: 'p.code',
  price: 'p.price_cents',
  quantity: 'p.quantity',
  category: 'c.name',
  createdAt: 'p.created_at',
  updatedAt: 'p.updated_at',
};

const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

const findMany = ({
  search,
  categoryId,
  minPrice,
  maxPrice,
  minQuantity,
  maxQuantity,
  inStock,
  sortBy = 'name',
  order = 'asc',
  page = 1,
  limit = 20,
}) => {
  const conditions = [];
  const params = {};

  if (search) {
    conditions.push("(p.name LIKE @search ESCAPE '\\' OR p.code LIKE @search ESCAPE '\\')");
    params.search = `%${escapeLike(search)}%`;
  }
  if (categoryId !== undefined) {
    conditions.push('p.category_id = @categoryId');
    params.categoryId = categoryId;
  }
  if (minPrice !== undefined) {
    conditions.push('p.price_cents >= @minPriceCents');
    params.minPriceCents = Math.round(minPrice * 100);
  }
  if (maxPrice !== undefined) {
    conditions.push('p.price_cents <= @maxPriceCents');
    params.maxPriceCents = Math.round(maxPrice * 100);
  }
  if (minQuantity !== undefined) {
    conditions.push('p.quantity >= @minQuantity');
    params.minQuantity = minQuantity;
  }
  if (maxQuantity !== undefined) {
    conditions.push('p.quantity <= @maxQuantity');
    params.maxQuantity = maxQuantity;
  }
  if (inStock !== undefined) {
    conditions.push(inStock ? 'p.quantity > 0' : 'p.quantity = 0');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const direction = order === 'desc' ? 'DESC' : 'ASC';

  const { total } = db.prepare(`SELECT COUNT(*) AS total ${FROM_PRODUCTS} ${where}`).get(params);
  const rows = db
    .prepare(
      `${SELECT_PRODUCT} ${where}
       ORDER BY ${SORT_COLUMNS[sortBy]} ${direction}, p.id ${direction}
       LIMIT @limit OFFSET @offset`,
    )
    .all({ ...params, limit, offset: (page - 1) * limit });

  return { items: rows.map(toProduct), total };
};

const findById = (id) => toProduct(db.prepare(`${SELECT_PRODUCT} WHERE p.id = ?`).get(id));

const findByCode = (code) => toProduct(db.prepare(`${SELECT_PRODUCT} WHERE p.code = ?`).get(code));

const create = ({ quantity = 0, ...fields }) => {
  const columns = { description: null, ...toColumns(fields), quantity };
  const names = Object.keys(columns);
  const { lastInsertRowid } = db
    .prepare(`INSERT INTO products (${names.join(', ')}) VALUES (${names.map((n) => `@${n}`).join(', ')})`)
    .run(columns);
  return findById(lastInsertRowid);
};

const update = (id, fields) => {
  const columns = toColumns(fields);
  const assignments = Object.keys(columns).map((column) => `${column} = @${column}`).join(', ');
  db.prepare(`UPDATE products SET ${assignments}, updated_at = ${NOW} WHERE id = @id`).run({ ...columns, id });
  return findById(id);
};

const updateQuantity = (id, quantity) => {
  db.prepare(`UPDATE products SET quantity = ?, updated_at = ${NOW} WHERE id = ?`).run(quantity, id);
  return findById(id);
};

const remove = (id) => db.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0;

export default { findMany, findById, findByCode, create, update, updateQuantity, remove };
