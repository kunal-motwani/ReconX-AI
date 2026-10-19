import { prisma } from '../repositories/prisma';
import { createAuditLog } from '../utils/audit';

export class CompanyService {
  async getCompany(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            users: true,
            documents: true,
            transactions: true,
            glCodes: true
          }
        }
      }
    });
    if (!company) throw new Error('Company not found.');
    return company;
  }

  async updateCompany(companyId: string, userId: string, data: any) {
    const current = await prisma.company.findUnique({ where: { id: companyId } });
    if (!current) throw new Error('Company not found.');

    const updated = await prisma.company.update({
      where: { id: companyId },
      data
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'COMPANY_UPDATED',
      entity: 'Company',
      entityId: companyId,
      previousValue: current,
      newValue: updated
    });

    return updated;
  }
}
