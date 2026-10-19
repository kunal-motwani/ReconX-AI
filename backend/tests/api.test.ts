import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/repositories/prisma';

describe('ReconX-AI Backend Test Suite', () => {
  let adminToken: string;
  let analystToken: string;
  let companyId: string;
  let sampleDocId: string;
  let sampleTxId: string;
  let sampleReconId: string;
  let sampleAnomalyId: string;

  beforeAll(async () => {
    // Authenticate Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@abctech.com', password: 'Demo1234!' });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.data.token;
    companyId = adminLogin.body.data.user.companyId;

    // Authenticate Analyst
    const analystLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analyst@abctech.com', password: 'Demo1234!' });
    expect(analystLogin.status).toBe(200);
    analystToken = analystLogin.body.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Authentication & Session
  describe('1. Authentication Tests', () => {
    it('should retrieve current authenticated user details (/api/auth/me)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('admin@abctech.com');
      expect(res.body.data.role).toBe('ADMIN');
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@abctech.com', password: 'WrongPassword123' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // 2. Role-Based Authorization
  describe('2. Authorization & RBAC', () => {
    it('should block Finance Analyst from modifying company settings (Admin only)', async () => {
      const res = await request(app)
        .put('/api/company')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ name: 'Hacked Company Name' });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow Admin to retrieve company profile', async () => {
      const res = await request(app)
        .get('/api/company')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('ABC Technologies Pvt Ltd');
    });
  });

  // 3. Document Ingestion & Mock Extraction Pipeline
  describe('3. Document Ingestion & Extraction', () => {
    it('should list seeded financial documents', async () => {
      const res = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(5);
      sampleDocId = res.body.data[0].id;
    });

    it('should retrieve a single document with linked extracted transactions', async () => {
      const res = await request(app)
        .get(`/api/documents/${sampleDocId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(sampleDocId);
    });
  });

  // 4. Normalized Transaction Management
  describe('4. Transaction Management', () => {
    it('should list transactions with pagination & filters', async () => {
      const res = await request(app)
        .get('/api/transactions?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(10);
      expect(res.body.meta.total).toBeGreaterThan(10);
      sampleTxId = res.body.data[0].id;
    });

    it('should create a new transaction manually', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vendorName: 'Atlassian Jira Cloud',
          amount: 28000,
          currency: 'INR',
          transactionDate: new Date().toISOString(),
          referenceNumber: `ATL-${Date.now()}`,
          description: 'Jira Software subscription renewal',
          source: 'INVOICE'
        });
      expect(res.status).toBe(201);
      expect(res.body.data.vendorName).toBe('Atlassian Jira Cloud');
    });
  });

  // 5. GL Codes & Mock Mapping
  describe('5. General Ledger Management', () => {
    it('should list chart of accounts (GL codes)', async () => {
      const res = await request(app)
        .get('/api/gl-codes')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.some((g: any) => g.code === '6201')).toBe(true);
    });

    it('should create a new GL code', async () => {
      const code = `99${Math.floor(10 + Math.random() * 80)}`;
      const res = await request(app)
        .post('/api/gl-codes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code,
          name: 'Research & AI Lab Hardware',
          category: 'Capital Expenditure',
          description: 'High performance compute rigs'
        });
      expect(res.status).toBe(201);
      expect(res.body.data.code).toBe(code);
    });
  });

  // 6. Reconciliation Engine & Multi-factor Matching
  describe('6. Reconciliation Engine', () => {
    it('should execute batch reconciliation run (/api/reconciliation/run)', async () => {
      const res = await request(app)
        .post('/api/reconciliation/run')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should list reconciliation pairs with confidence scores', async () => {
      const res = await request(app)
        .get('/api/reconciliation')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      sampleReconId = res.body.data[0].id;
    });

    it('should allow Finance Manager to approve a reconciliation', async () => {
      const res = await request(app)
        .post(`/api/reconciliation/${sampleReconId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Verified against supporting invoice statement' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
    });
  });

  // 7. Anomaly Detection & Human Investigation
  describe('7. Anomalies & Investigations', () => {
    it('should list detected anomalies including amount mismatches and duplicates', async () => {
      const res = await request(app)
        .get('/api/anomalies')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      sampleAnomalyId = res.body.data[0].id;
    });

    it('should initiate root-cause investigation for an anomaly', async () => {
      const res = await request(app)
        .post('/api/investigations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ anomalyId: sampleAnomalyId });
      expect(res.status).toBe(201);
      expect(res.body.data.timeline.length).toBeGreaterThanOrEqual(3);
    });

    it('should retrieve Human Review queue (/api/review-queue/queue)', async () => {
      const res = await request(app)
        .get('/api/review-queue/queue')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.summary).toBeDefined();
    });
  });

  // 8. Executive Dashboard & Reporting
  describe('8. Executive Dashboard & Reports', () => {
    it('should fetch aggregated dashboard metrics and charts (/api/dashboard/stats)', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.kpis.totalTransactions).toBeGreaterThan(0);
      expect(res.body.data.charts.volumeOverTime.length).toBe(6);
      expect(res.body.data.attentionRequired.length).toBeGreaterThan(0);
    });

    it('should generate reconciliation report', async () => {
      const res = await request(app)
        .get('/api/reports/reconciliation')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.metrics.total).toBeGreaterThan(0);
    });

    it('should export reports to CSV format', async () => {
      const res = await request(app)
        .get('/api/reports/export-csv?type=reconciliation')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Reconciliation ID');
    });
  });

  // 9. Immutable Audit Logging & Company Isolation
  describe('9. Audit Trail & Multi-Tenant Isolation', () => {
    it('should record audit logs for business actions', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should strictly isolate company data across organizations', async () => {
      // Register a second organization
      const otherOrg = await request(app)
        .post('/api/auth/register')
        .send({
          email: `other-admin-${Date.now()}@competitor.com`,
          password: 'Password123!',
          firstName: 'Competitor',
          lastName: 'Admin',
          companyName: 'Competitor Corp'
        });
      expect(otherOrg.status).toBe(201);
      const otherToken = otherOrg.body.data.token;

      // Ensure other organization has 0 transactions from ABC Tech
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${otherToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });
});
