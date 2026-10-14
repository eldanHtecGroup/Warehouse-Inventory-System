import db, { NOW } from '../db/index.js';

const toCategory = (row) =>
  row && {
    id: row.id,
    name: row.name,
    description: row.description,
    productCount: row.product_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

const SELECT_CATEGORY = `
  SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
  FROM categories c
`;

const findAll = () => db.prepare(`${SELECT_CATEGORY} ORDER BY c.name`).all().map(toCategory);

const findById = (id) => toCategory(db.prepare(`${SELECT_CATEGORY} WHERE c.id = ?`).get(id));

const findByName = (name) => toCategory(db.prepare(`${SELECT_CATEGORY} WHERE c.name = ?`).get(name));

const create = ({ name, description = null }) => {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO categories (name, description) VALUES (@name, @description)')
    .run({ name, description });
  return findById(lastInsertRowid);
};

const update = (id, fields) => {
  const columns = Object.keys(fields);
  const assignments = columns.map((column) => `${column} = @${column}`).join(', ');
  db.prepare(`UPDATE categories SET ${assignments}, updated_at = ${NOW} WHERE id = @id`).run({ ...fields, id });
  return findById(id);
};

const remove = (id) => db.prepare('DELETE FROM categories WHERE id = ?').run(id).changes > 0;

const getStockSummary = () =>
  db
    .prepare(
      `SELECT c.id, c.name,
              COUNT(p.id)                              AS product_count,
              COALESCE(SUM(p.quantity), 0)             AS total_quantity,
              COALESCE(SUM(p.quantity * p.price_cents), 0) AS total_value_cents
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name`,
    )
    .all()
    .map((row) => ({
      categoryId: row.id,
      categoryName: row.name,
      productCount: row.product_count,
      totalQuantity: row.total_quantity,
      totalValue: row.total_value_cents / 100,
    }));

export default { findAll, findById, findByName, create, update, remove, getStockSummary };
