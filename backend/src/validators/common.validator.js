import { z } from 'zod';

export const id = z.coerce.number().int().positive();

export const idParams = z.object({ id });

export const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const sortOrder = z.enum(['asc', 'desc']);

// Query strings are always text, so "true"/"false" must be parsed explicitly
export const booleanQuery = z.enum(['true', 'false']).transform((value) => value === 'true');
