import db from '../db/index.js';

const toMovement = (row) =>
  row && {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productCode: row.product_code,
    type: row.type,
    quantityChange: row.quantity_change,
    quantityBefore: row.quantity_before,
    quantityAfter: row.quantity_after,
    reason: row.reason,
    createdAt: row.created_at,
  };

const findById = (id) => toMovement(db.prepare('SELECT * FROM stock_movements WHERE id = ?').get(id));

const findMany = ({ productId, type, from, to, order = 'desc', page = 1, limit = 50 }) => {
  const conditions = [];
  const params = {};

  if (productId !== undefined) {
    conditions.push('product_id = @productId');
    params.productId = productId;
  }
  if (type !== undefined) {
    conditions.push('type = @type');
    params.type = type;
  }
  if (from !== undefined) {
    conditions.push('created_at >= @from');
    params.from = from;
  }
  if (to !== undefined) {
    conditions.push('created_at <= @to');
    params.to = to;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const direction = order === 'asc' ? 'ASC' : 'DESC';

  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM stock_movements ${where}`).get(params);
  const rows = db
    .prepare(
      `SELECT * FROM stock_movements ${where}
       ORDER BY created_at ${direction}, id ${direction}
       LIMIT @limit OFFSET @offset`,
    )
    .all({ ...params, limit, offset: (page - 1) * limit });

  return { items: rows.map(toMovement), total };
};

const create = ({ productId, productName, productCode, type, quantityChange, quantityBefore, quantityAfter, reason = null }) => {
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO stock_movements
         (product_id, product_name, product_code, type, quantity_change, quantity_before, quantity_after, reason)
       VALUES
         (@productId, @productName, @productCode, @type, @quantityChange, @quantityBefore, @quantityAfter, @reason)`,
    )
    .run({ productId, productName, productCode, type, quantityChange, quantityBefore, quantityAfter, reason });
  return findById(lastInsertRowid);
};

export default { findById, findMany, create };
