import stockMovementService from '../services/stockMovement.service.js';

const getAll = (req, res) => {
  const { items, meta } = stockMovementService.listMovements(req.validated.query);
  res.status(200).json({ data: items, meta });
};

export default { getAll };
