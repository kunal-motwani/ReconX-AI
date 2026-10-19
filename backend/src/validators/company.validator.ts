import { z } from 'zod';

export const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().min(3).max(3).optional(),
  fiscalYear: z.string().optional()
});
