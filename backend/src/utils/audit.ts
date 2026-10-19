import { prisma } from '../repositories/prisma';

export interface AuditParams {
  companyId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
}

export const createAuditLog = async (params: AuditParams) => {
  try {
    return await prisma.auditLog.create({
      data: {
        companyId: params.companyId,
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        previousValue: params.previousValue ? JSON.stringify(params.previousValue) : undefined,
        newValue: params.newValue ? JSON.stringify(params.newValue) : undefined,
        ipAddress: params.ipAddress
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};
