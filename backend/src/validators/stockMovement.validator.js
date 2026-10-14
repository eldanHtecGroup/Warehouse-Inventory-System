import { z } from 'zod';
import { id, pagination, sortOrder } from './common.validator.js';
import { MOVEMENT_TYPES } from '../utils/constants.js';

const isoDate = z.coerce.date().transform((date) => date.toISOString());

const movementFilters = {
  type: z.enum(Object.values(MOVEMENT_TYPES)).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  order: sortOrder.default('desc'),
  ...pagination,
};

const fromBeforeTo = [
  (q) => q.from === undefined || q.to === undefined || q.from <= q.to,
  { message: 'from must be earlier than or equal to to', path: ['from'] },
];

export const listMovementsQuery = z.object({ productId: id.optional(), ...movementFilters }).refine(...fromBeforeTo);

export const listProductMovementsQuery = z.object(movementFilters).refine(...fromBeforeTo);
