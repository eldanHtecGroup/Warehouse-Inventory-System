import { z } from 'zod';

const name = z.string().trim().min(1).max(100);
const description = z.string().trim().max(500).nullable();

export const createCategoryBody = z.strictObject({
  name,
  description: description.optional(),
});

export const updateCategoryBody = createCategoryBody
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });
