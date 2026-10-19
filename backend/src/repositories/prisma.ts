import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// SQLite has no native JSON column. Keep provider/service APIs object-shaped
// while serializing JSON payloads at the persistence boundary.
prisma.$use(async (params, next) => {
  if (['create', 'update', 'upsert'].includes(params.action) && params.args?.data) {
    const data = params.args.data as Record<string, any>;
    for (const field of ['extractedData', 'evidence', 'timeline', 'previousValue', 'newValue']) {
      if (data[field] !== undefined && typeof data[field] !== 'string') data[field] = JSON.stringify(data[field]);
    }
  }
  return next(params);
});
