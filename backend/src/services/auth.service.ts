import { prisma } from '../repositories/prisma';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { createAuditLog } from '../utils/audit';

export class AuthService {
  async register(data: { email: string; password: string; firstName: string; lastName: string; companyName: string; role?: any }) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('An account with this email already exists.');
    }

    // Create company & initial user
    const company = await prisma.company.create({
      data: {
        name: data.companyName,
        industry: 'Technology & SaaS',
        country: 'India',
        currency: 'INR',
        fiscalYear: '2026-2027'
      }
    });

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'ADMIN'
      }
    });

    // Create default GL codes for the new company
    const defaultGLCodes = [
      { code: '6201', name: 'Cloud/Software Expenses', category: 'Operating Expenses', description: 'Cloud infrastructure, SaaS tools' },
      { code: '6100', name: 'Office Expenses', category: 'Operating Expenses', description: 'Office supplies, stationary and furniture' },
      { code: '6300', name: 'Travel & Conveyance', category: 'Operating Expenses', description: 'Flights, cabs, lodging and per-diem' },
      { code: '6400', name: 'Professional Services', category: 'Operating Expenses', description: 'Legal, audit, tax, consulting retainers' },
      { code: '6500', name: 'Meals & Entertainment', category: 'Operating Expenses', description: 'Team dining and event catering' },
      { code: '7000', name: 'Miscellaneous Expenses', category: 'Operating Expenses', description: 'General operational overhead' }
    ];

    for (const gl of defaultGLCodes) {
      await prisma.gLCode.create({
        data: {
          companyId: company.id,
          ...gl
        }
      });
    }

    const token = generateToken({
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role
    });

    await createAuditLog({
      companyId: company.id,
      userId: user.id,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user.id,
      newValue: { email: user.email, role: user.role }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId
      },
      company: {
        id: company.id,
        name: company.name,
        currency: company.currency
      },
      token
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { company: true }
    });

    if (!user || !user.active) {
      throw new Error('Invalid email or password.');
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const token = generateToken({
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role
    });

    await createAuditLog({
      companyId: user.companyId,
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId
      },
      company: user.company,
      token
    };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        companyId: true,
        company: true
      }
    });

    if (!user) {
      throw new Error('User not found.');
    }

    return user;
  }
}
