import { z } from 'zod';

export const createGLCodeSchema = z.object({
  code: z.string().min(3, 'GL code must be at least 3 characters'),
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(2, 'Category is required'),
  active: z.boolean().default(true)
});

export const updateGLCodeSchema = z.object({
  code: z.string().min(3).optional(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  active: z.boolean().optional()
});
