import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// SQLite stores these domain values as validated application strings.
const Role = { ADMIN: 'ADMIN', FINANCE_MANAGER: 'FINANCE_MANAGER', FINANCE_ANALYST: 'FINANCE_ANALYST' } as const;
const DocumentType = { INVOICE: 'INVOICE', BANK_STATEMENT: 'BANK_STATEMENT', RECEIPT: 'RECEIPT', PURCHASE_ORDER: 'PURCHASE_ORDER', EXPENSE_REPORT: 'EXPENSE_REPORT' } as const;
const ProcessingStatus = { PROCESSED: 'PROCESSED' } as const;
const TransactionSource = { INVOICE: 'INVOICE', BANK: 'BANK', RECEIPT: 'RECEIPT', PURCHASE_ORDER: 'PURCHASE_ORDER', EXPENSE: 'EXPENSE' } as const;
const TransactionStatus = { UNMATCHED: 'UNMATCHED', MATCHED: 'MATCHED', REVIEW_REQUIRED: 'REVIEW_REQUIRED' } as const;
const ReconciliationStatus = { MATCHED: 'MATCHED', AMOUNT_MISMATCH: 'AMOUNT_MISMATCH' } as const;
const AnomalyType = { AMOUNT_MISMATCH: 'AMOUNT_MISMATCH', DUPLICATE_PAYMENT: 'DUPLICATE_PAYMENT', UNUSUAL_AMOUNT: 'UNUSUAL_AMOUNT', MISSING_INVOICE: 'MISSING_INVOICE' } as const;
const AnomalySeverity = { CRITICAL: 'CRITICAL', HIGH: 'HIGH', MEDIUM: 'MEDIUM' } as const;
const AnomalyStatus = { OPEN: 'OPEN' } as const;
const InvestigationStatus = { IN_PROGRESS: 'IN_PROGRESS', OPEN: 'OPEN' } as const;
const json = (value: unknown) => JSON.stringify(value);

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  if (['create', 'update', 'upsert'].includes(params.action) && params.args?.data) {
    const data = params.args.data as Record<string, any>;
    for (const field of ['extractedData', 'evidence', 'timeline', 'previousValue', 'newValue']) {
      if (data[field] !== undefined && typeof data[field] !== 'string') data[field] = json(data[field]);
    }
  }
  return next(params);
});

async function main() {
  console.log('🌱 Starting database seed for ReconX-AI...');

  // Clean existing records
  await prisma.auditLog.deleteMany();
  await prisma.investigation.deleteMany();
  await prisma.anomaly.deleteMany();
  await prisma.reconciliation.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.document.deleteMany();
  await prisma.gLCode.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // 1. Create Demo Company
  const company = await prisma.company.create({
    data: {
      name: 'ABC Technologies Pvt Ltd',
      industry: 'Enterprise Software & Cloud AI',
      country: 'India',
      currency: 'INR',
      fiscalYear: '2026-2027'
    }
  });
  console.log(`✓ Company created: ${company.name} (${company.id})`);

  // 2. Create Users
  const passwordHash = await bcrypt.hash('Demo1234!', 10);

  const adminUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'admin@abctech.com',
      passwordHash,
      firstName: 'Rajesh',
      lastName: 'Sharma',
      role: Role.ADMIN
    }
  });

  const managerUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'manager@abctech.com',
      passwordHash,
      firstName: 'Priya',
      lastName: 'Nair',
      role: Role.FINANCE_MANAGER
    }
  });

  const analystUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'analyst@abctech.com',
      passwordHash,
      firstName: 'Amit',
      lastName: 'Verma',
      role: Role.FINANCE_ANALYST
    }
  });
  console.log('✓ Created 3 users: Admin, Finance Manager, Finance Analyst');

  // 3. Create General Ledger Codes
  const glData = [
    { code: '6201', name: 'Cloud & Software Expenses', category: 'Operating Expenses', description: 'AWS, Azure, GCP, SaaS subscriptions' },
    { code: '6100', name: 'Office Supplies & Infrastructure', category: 'Operating Expenses', description: 'Ergonomic seating, stationery, pantry provisions' },
    { code: '6300', name: 'Travel & Conveyance', category: 'Operating Expenses', description: 'Flight tickets, Uber rides, hotel accommodation' },
    { code: '6400', name: 'Professional Services & Audit', category: 'Operating Expenses', description: 'Legal counsel, statutory audit, tax consultancy' },
    { code: '6500', name: 'Team Dining & Meals', category: 'Operating Expenses', description: 'Employee meals, client dinners, catering' },
    { code: '6600', name: 'Hardware & IT Equipment', category: 'Capital Expenditure', description: 'Laptops, server racks, networking switches' },
    { code: '7000', name: 'Miscellaneous Expenses', category: 'Operating Expenses', description: 'Uncategorized routine expenditures' }
  ];

  const glCodes: Record<string, any> = {};
  for (const gl of glData) {
    const record = await prisma.gLCode.create({
      data: {
        companyId: company.id,
        ...gl
      }
    });
    glCodes[gl.code] = record;
  }
  console.log(`✓ Created ${glData.length} GL Codes`);

  // 4. Create 10+ Invoices & Documents
  const sampleDocs = [
    { name: 'INV-2026-AWS-AUG.pdf', type: DocumentType.INVOICE, size: 245100, vendor: 'Amazon Web Services (AWS)', amount: 100300, ref: 'AWS-IN-2026-9812' },
    { name: 'INV-2026-MSFT-AUG.pdf', type: DocumentType.INVOICE, size: 182400, vendor: 'Microsoft Cloud Corporation', amount: 64500, ref: 'MSFT-REF-1092' },
    { name: 'UBER-CORP-AUG-TRIPS.pdf', type: DocumentType.RECEIPT, size: 94100, vendor: 'Uber Technologies Ltd', amount: 3450, ref: 'UBR-TRIP-9011' },
    { name: 'OFFICE-DEPOT-CHAIRS.pdf', type: DocumentType.PURCHASE_ORDER, size: 312000, vendor: 'Office Depot Supplies', amount: 12400, ref: 'PO-OD-2026-04' },
    { name: 'DELOITTE-AUDIT-Q1.pdf', type: DocumentType.INVOICE, size: 450000, vendor: 'Deloitte Touche Tohmatsu India', amount: 250000, ref: 'DEL-INV-2026-011' },
    { name: 'SLACK-ENTERPRISE-GRID.pdf', type: DocumentType.INVOICE, size: 128000, vendor: 'Slack Technologies Inc', amount: 45000, ref: 'SLK-INV-5541' },
    { name: 'SLACK-ENTERPRISE-GRID-DUP.pdf', type: DocumentType.INVOICE, size: 128000, vendor: 'Slack Technologies Inc', amount: 45000, ref: 'SLK-INV-5541-DUP' }, // Duplicate!
    { name: 'SWIGGY-TEAM-HACKATHON.pdf', type: DocumentType.EXPENSE_REPORT, size: 84000, vendor: 'Swiggy Corporate Catering', amount: 18500, ref: 'SWG-EXP-8812' },
    { name: 'DELL-SERVER-CLUSTER.pdf', type: DocumentType.INVOICE, size: 680000, vendor: 'Dell Enterprise Computing', amount: 850000, ref: 'DELL-PO-99120' }, // Outlier unusual amount!
    { name: 'AIRBNB-OFFSITE-GOA.pdf', type: DocumentType.RECEIPT, size: 198000, vendor: 'Airbnb Hospitality Ltd', amount: 72000, ref: 'ABNB-RES-3341' },
    { name: 'HDFC-BANK-STMT-AUG-2026.pdf', type: DocumentType.BANK_STATEMENT, size: 540000, vendor: 'HDFC Bank Ltd', amount: 1445750, ref: 'STMT-HDFC-AUG-2026' }
  ];

  const docs: any[] = [];
  for (const d of sampleDocs) {
    const doc = await prisma.document.create({
      data: {
        companyId: company.id,
        uploadedById: adminUser.id,
        fileName: `seeded-${d.name}`,
        originalName: d.name,
        filePath: `/uploads/seeded-${d.name}`,
        fileType: 'application/pdf',
        documentType: d.type,
        fileSize: d.size,
        processingStatus: ProcessingStatus.PROCESSED,
        extractedData: json({
          vendorName: d.vendor,
          amount: d.amount,
          referenceNumber: d.ref,
          currency: 'INR',
          date: new Date(2026, 7, 15).toISOString()
        })
      }
    });
    docs.push(doc);
  }
  console.log(`✓ Created ${docs.length} Documents`);

  // 5. Create Source Transactions from Invoices
  const txAWS = await prisma.transaction.create({
    data: {
      companyId: company.id,
      documentId: docs[0].id,
      transactionType: 'DEBIT',
      vendorName: 'Amazon Web Services (AWS)',
      amount: 100300,
      currency: 'INR',
      transactionDate: new Date('2026-08-10'),
      referenceNumber: 'AWS-IN-2026-9812',
      description: 'AWS Cloud Hosting - August Billing',
      source: TransactionSource.INVOICE,
      status: TransactionStatus.REVIEW_REQUIRED,
      glCodeId: glCodes['6201'].id,
      glConfidence: 0.95,
      glStatus: 'SUGGESTED'
    }
  });

  const txMsft = await prisma.transaction.create({
    data: {
      companyId: company.id,
      documentId: docs[1].id,
      transactionType: 'DEBIT',
      vendorName: 'Microsoft Cloud Corporation',
      amount: 64500,
      currency: 'INR',
      transactionDate: new Date('2026-08-12'),
      referenceNumber: 'MSFT-REF-1092',
      description: 'Microsoft 365 Enterprise Seats',
      source: TransactionSource.INVOICE,
      status: TransactionStatus.MATCHED,
      glCodeId: glCodes['6201'].id,
      glConfidence: 0.94,
      glStatus: 'SUGGESTED'
    }
  });

  const txUber = await prisma.transaction.create({
    data: {
      companyId: company.id,
      documentId: docs[2].id,
      transactionType: 'DEBIT',
      vendorName: 'Uber Technologies Ltd',
      amount: 3450,
      currency: 'INR',
      transactionDate: new Date('2026-08-14'),
      referenceNumber: 'UBR-TRIP-9011',
      description: 'Executive Airport Transit',
      source: TransactionSource.RECEIPT,
      status: TransactionStatus.MATCHED,
      glCodeId: glCodes['6300'].id,
      glConfidence: 0.96,
      glStatus: 'SUGGESTED'
    }
  });

  const txOffice = await prisma.transaction.create({
    data: {
      companyId: company.id,
      documentId: docs[3].id,
      transactionType: 'DEBIT',
      vendorName: 'Office Depot Supplies',
      amount: 12400,
      currency: 'INR',
      transactionDate: new Date('2026-08-15'),
      referenceNumber: 'PO-OD-2026-04',
      description: 'Ergonomic Mesh Chairs (x4)',
      source: TransactionSource.PURCHASE_ORDER,
      status: TransactionStatus.MATCHED,
      glCodeId: glCodes['6100'].id,
      glConfidence: 0.93,
      glStatus: 'SUGGESTED'
    }
  });

  const txDeloitte = await prisma.transaction.create({
    data: {
      companyId: company.id,
      documentId: docs[4].id,
      transactionType: 'DEBIT',
      vendorName: 'Deloitte Touche Tohmatsu India',
      amount: 250000,
      currency: 'INR',
      transactionDate: new Date('2026-08-16'),
      referenceNumber: 'DEL-INV-2026-011',
      description: 'Q1 Statutory Audit & Compliance Review',
      source: TransactionSource.INVOICE,
      status: TransactionStatus.MATCHED,
      glCodeId: glCodes['6400'].id,
      glConfidence: 0.91,
      glStatus: 'SUGGESTED'
    }
  });

  const txSlack1 = await prisma.transaction.create({
    data: {
      companyId: company.id,
      documentId: docs[5].id,
      transactionType: 'DEBIT',
      vendorName: 'Slack Technologies Inc',
      amount: 45000,
      currency: 'INR',
      transactionDate: new Date('2026-08-18'),
      referenceNumber: 'SLK-INV-5541',
      description: 'Annual Slack Pro Workspace',
      source: TransactionSource.INVOICE,
      status: TransactionStatus.UNMATCHED,
      glCodeId: glCodes['6201'].id,
      glConfidence: 0.94,
      glStatus: 'SUGGESTED'
    }
  });

  const txSlack2 = await prisma.transaction.create({
    data: {
      companyId: company.id,
      documentId: docs[6].id,
      transactionType: 'DEBIT',
      vendorName: 'Slack Technologies Inc',
      amount: 45000,
      currency: 'INR',
      transactionDate: new Date('2026-08-19'),
      referenceNumber: 'SLK-INV-5541-DUP',
      description: 'Duplicate Debit - Annual Slack Pro Workspace',
      source: TransactionSource.INVOICE,
      status: TransactionStatus.REVIEW_REQUIRED,
      glCodeId: glCodes['6201'].id,
      glConfidence: 0.94,
      glStatus: 'SUGGESTED'
    }
  });

  const txSwiggy = await prisma.transaction.create({
    data: {
      companyId: company.id,
      documentId: docs[7].id,
      transactionType: 'DEBIT',
      vendorName: 'Swiggy Corporate Catering',
      amount: 18500,
      currency: 'INR',
      transactionDate: new Date('2026-08-20'),
      referenceNumber: 'SWG-EXP-8812',
      description: 'Engineering Hackathon Lunch & Refreshments',
      source: TransactionSource.EXPENSE,
      status: TransactionStatus.MATCHED,
      glCodeId: glCodes['6500'].id,
      glConfidence: 0.92,
      glStatus: 'SUGGESTED'
    }
  });

  const txDell = await prisma.transaction.create({
    data: {
      companyId: company.id,
      documentId: docs[8].id,
      transactionType: 'DEBIT',
      vendorName: 'Dell Enterprise Computing',
      amount: 850000,
      currency: 'INR',
      transactionDate: new Date('2026-08-22'),
      referenceNumber: 'DELL-PO-99120',
      description: 'PowerEdge AI Server Cluster 4U',
      source: TransactionSource.INVOICE,
      status: TransactionStatus.REVIEW_REQUIRED,
      glCodeId: glCodes['6600'].id,
      glConfidence: 0.89,
      glStatus: 'SUGGESTED'
    }
  });

  const txAirbnb = await prisma.transaction.create({
    data: {
      companyId: company.id,
      documentId: docs[9].id,
      transactionType: 'DEBIT',
      vendorName: 'Airbnb Hospitality Ltd',
      amount: 72000,
      currency: 'INR',
      transactionDate: new Date('2026-08-23'),
      referenceNumber: 'ABNB-RES-3341',
      description: 'Leadership Strategy Offsite Villa Goa',
      source: TransactionSource.RECEIPT,
      status: TransactionStatus.MATCHED,
      glCodeId: glCodes['6300'].id,
      glConfidence: 0.94,
      glStatus: 'SUGGESTED'
    }
  });

  // 6. Create 15+ Bank Statement Transactions
  const bankStmtDoc = docs[10];
  const bankTxsData = [
    { vendor: 'Amazon Web Services (AWS)', amount: 100000, date: '2026-08-11', ref: 'HDFC-DR-00101', desc: 'Direct Debit AWS Cloud Hosting' }, // Mismatch ₹100,000 vs ₹100,300
    { vendor: 'Microsoft Cloud Corporation', amount: 64500, date: '2026-08-13', ref: 'HDFC-DR-00102', desc: 'NEFT Transfer MSFT Cloud' },
    { vendor: 'Uber Technologies Ltd', amount: 3450, date: '2026-08-14', ref: 'HDFC-DR-00103', desc: 'Corporate Card Transit UBR' },
    { vendor: 'Office Depot Supplies', amount: 12400, date: '2026-08-16', ref: 'HDFC-DR-00104', desc: 'IMPS Office Depot furniture' },
    { vendor: 'Deloitte Touche Tohmatsu India', amount: 250000, date: '2026-08-17', ref: 'HDFC-DR-00105', desc: 'RTGS Professional Audit Retainer' },
    { vendor: 'Slack Technologies Inc', amount: 45000, date: '2026-08-19', ref: 'HDFC-DR-00106', desc: 'International Wire Slack Pro' },
    { vendor: 'Swiggy Corporate Catering', amount: 18500, date: '2026-08-20', ref: 'HDFC-DR-00107', desc: 'UPI Debit Swiggy Corporate' },
    { vendor: 'Airbnb Hospitality Ltd', amount: 72000, date: '2026-08-24', ref: 'HDFC-DR-00108', desc: 'Credit Card Settlement Airbnb Goa' },
    { vendor: 'Tata Tele Business Services', amount: 28500, date: '2026-08-25', ref: 'HDFC-DR-00109', desc: 'Fiber Internet Leased Line' }, // Unmatched Bank Tx
    { vendor: 'Google Workspace India', amount: 14200, date: '2026-08-26', ref: 'HDFC-DR-00110', desc: 'Google Cloud Domain Billing' }, // Unmatched Bank Tx
    { vendor: 'Electricity Board Bengaluru BESCOM', amount: 34800, date: '2026-08-27', ref: 'HDFC-DR-00111', desc: 'Utility Bill Corporate Office' },
    { vendor: 'Blue Dart Express Courier', amount: 4200, date: '2026-08-28', ref: 'HDFC-DR-00112', desc: 'Document Dispatch Services' },
    { vendor: 'Urban Company Facility Mgmt', amount: 16500, date: '2026-08-28', ref: 'HDFC-DR-00113', desc: 'Facility Deep Cleaning Bangalore' },
    { vendor: 'Zoom Video Communications', amount: 8900, date: '2026-08-29', ref: 'HDFC-DR-00114', desc: 'Zoom Webinar Corporate Sub' },
    { vendor: 'GitHub Enterprise Inc', amount: 36000, date: '2026-08-30', ref: 'HDFC-DR-00115', desc: 'GitHub Enterprise 40 Seats' }
  ];

  const bankTransactions: any[] = [];
  for (const b of bankTxsData) {
    const tx = await prisma.transaction.create({
      data: {
        companyId: company.id,
        documentId: bankStmtDoc.id,
        transactionType: 'DEBIT',
        vendorName: b.vendor,
        amount: b.amount,
        currency: 'INR',
        transactionDate: new Date(b.date),
        referenceNumber: b.ref,
        description: b.desc,
        source: TransactionSource.BANK,
        status: TransactionStatus.UNMATCHED
      }
    });
    bankTransactions.push(tx);
  }
  console.log(`✓ Created ${bankTransactions.length} Bank Transactions`);

  // 7. Create Reconciliation Records
  // A. Amount Mismatch: AWS Invoice (₹100,300) vs Bank Debit (₹100,000)
  const reconAWS = await prisma.reconciliation.create({
    data: {
      companyId: company.id,
      sourceTransactionId: txAWS.id,
      targetTransactionId: bankTransactions[0].id,
      status: ReconciliationStatus.AMOUNT_MISMATCH,
      confidenceScore: 0.60,
      amountMatch: false,
      vendorMatch: true,
      dateMatch: true,
      referenceMatch: false,
      explanation: 'Amount mismatch detected: Invoice records ₹100,300, bank debit is ₹100,000 (variance: ₹300 TDS or banking fee).'
    }
  });

  // B. High Match: Microsoft (₹64,500)
  await prisma.reconciliation.create({
    data: {
      companyId: company.id,
      sourceTransactionId: txMsft.id,
      targetTransactionId: bankTransactions[1].id,
      status: ReconciliationStatus.MATCHED,
      confidenceScore: 0.98,
      amountMatch: true,
      vendorMatch: true,
      dateMatch: true,
      referenceMatch: true,
      explanation: 'Perfect match: Exact amount ₹64,500, vendor Microsoft Cloud Corporation, and transaction date within 24 hours.'
    }
  });

  // C. High Match: Uber (₹3,450)
  await prisma.reconciliation.create({
    data: {
      companyId: company.id,
      sourceTransactionId: txUber.id,
      targetTransactionId: bankTransactions[2].id,
      status: ReconciliationStatus.MATCHED,
      confidenceScore: 0.97,
      amountMatch: true,
      vendorMatch: true,
      dateMatch: true,
      referenceMatch: false,
      explanation: 'High confidence match (97%): Amount ₹3,450 verified on corporate transit line.'
    }
  });

  // D. High Match: Office Depot (₹12,400)
  await prisma.reconciliation.create({
    data: {
      companyId: company.id,
      sourceTransactionId: txOffice.id,
      targetTransactionId: bankTransactions[3].id,
      status: ReconciliationStatus.MATCHED,
      confidenceScore: 0.96,
      amountMatch: true,
      vendorMatch: true,
      dateMatch: true,
      referenceMatch: true,
      explanation: 'Verified match: PO-OD-2026-04 cross-referenced against HDFC-DR-00104.'
    }
  });

  // E. High Match: Deloitte (₹250,000)
  await prisma.reconciliation.create({
    data: {
      companyId: company.id,
      sourceTransactionId: txDeloitte.id,
      targetTransactionId: bankTransactions[4].id,
      status: ReconciliationStatus.MATCHED,
      confidenceScore: 0.99,
      amountMatch: true,
      vendorMatch: true,
      dateMatch: true,
      referenceMatch: true,
      explanation: 'Statutory audit fee confirmed against bank RTGS debit.'
    }
  });

  // F. High Match: Swiggy (₹18,500)
  await prisma.reconciliation.create({
    data: {
      companyId: company.id,
      sourceTransactionId: txSwiggy.id,
      targetTransactionId: bankTransactions[6].id,
      status: ReconciliationStatus.MATCHED,
      confidenceScore: 0.95,
      amountMatch: true,
      vendorMatch: true,
      dateMatch: true,
      referenceMatch: false,
      explanation: 'Catering voucher matched with corporate UPI settlement.'
    }
  });

  // G. High Match: Airbnb (₹72,000)
  await prisma.reconciliation.create({
    data: {
      companyId: company.id,
      sourceTransactionId: txAirbnb.id,
      targetTransactionId: bankTransactions[7].id,
      status: ReconciliationStatus.MATCHED,
      confidenceScore: 0.94,
      amountMatch: true,
      vendorMatch: true,
      dateMatch: true,
      referenceMatch: false,
      explanation: 'Executive offsite lodging matched with corporate card statement.'
    }
  });
  console.log('✓ Created 7 Reconciliation records');

  // 8. Create Realistic Anomalies
  // Anomaly 1: Amount Mismatch (AWS)
  const anom1 = await prisma.anomaly.create({
    data: {
      companyId: company.id,
      transactionId: txAWS.id,
      type: AnomalyType.AMOUNT_MISMATCH,
      severity: AnomalySeverity.CRITICAL,
      title: 'Amount Discrepancy on AWS Cloud Invoice',
      description: 'Vendor invoice INV-2026-9812 totals ₹100,300, but HDFC bank statement reflects a debit of ₹100,000 (variance ₹300).',
      status: AnomalyStatus.OPEN,
      evidence: json({
        invoiceAmount: 100300,
        bankAmount: 100000,
        variance: 300,
        vendor: 'Amazon Web Services (AWS)',
        invoiceRef: 'AWS-IN-2026-9812',
        bankRef: 'HDFC-DR-00101'
      }),
      recommendedAction: 'Verify if ₹300 represents 0.1% TDS deduction under section 194Q or foreign exchange markup.'
    }
  });

  // Anomaly 2: Duplicate Payment (Slack)
  const anom2 = await prisma.anomaly.create({
    data: {
      companyId: company.id,
      transactionId: txSlack2.id,
      type: AnomalyType.DUPLICATE_PAYMENT,
      severity: AnomalySeverity.HIGH,
      title: 'Potential Duplicate Payment to Slack Technologies',
      description: 'Two identical payment debits of ₹45,000 entered for Slack within 24 hours (SLK-INV-5541 and SLK-INV-5541-DUP).',
      status: AnomalyStatus.OPEN,
      evidence: json({
        vendorName: 'Slack Technologies Inc',
        amount: 45000,
        originalRef: 'SLK-INV-5541',
        duplicateRef: 'SLK-INV-5541-DUP',
        date1: '2026-08-18',
        date2: '2026-08-19'
      }),
      recommendedAction: 'Place immediate stop-order or request credit memo for duplicate disbursement.'
    }
  });

  // Anomaly 3: Unusual High Amount Outlier (Dell Server Cluster)
  const anom3 = await prisma.anomaly.create({
    data: {
      companyId: company.id,
      transactionId: txDell.id,
      type: AnomalyType.UNUSUAL_AMOUNT,
      severity: AnomalySeverity.HIGH,
      title: 'CapEx Transaction Exceeding Single Sign-Off Limit',
      description: 'Dell server invoice of ₹850,000 exceeds standard automated approval threshold of ₹500,000.',
      status: AnomalyStatus.OPEN,
      evidence: json({
        amount: 850000,
        threshold: 500000,
        poNumber: 'DELL-PO-99120',
        assetCategory: 'IT Server Hardware'
      }),
      recommendedAction: 'Require secondary executive sign-off from Chief Financial Officer prior to batch release.'
    }
  });

  // Anomaly 4: Missing Invoice for Bank Debit
  const anom4 = await prisma.anomaly.create({
    data: {
      companyId: company.id,
      transactionId: bankTransactions[8].id, // Tata Tele
      type: AnomalyType.MISSING_INVOICE,
      severity: AnomalySeverity.MEDIUM,
      title: 'Unmatched Bank Debit Without Supporting Invoice',
      description: 'Bank debit of ₹28,500 to Tata Tele Business Services has no corresponding uploaded bill.',
      status: AnomalyStatus.OPEN,
      evidence: json({
        vendorName: 'Tata Tele Business Services',
        amount: 28500,
        bankReference: 'HDFC-DR-00109',
        date: '2026-08-25'
      }),
      recommendedAction: 'Request procurement team to upload GST tax invoice for leased line broadband.'
    }
  });
  console.log('✓ Created 4 Anomaly records');

  // 9. Create Active Investigation Records with Timelines
  const invAWS = await prisma.investigation.create({
    data: {
      companyId: company.id,
      anomalyId: anom1.id,
      assignedToId: managerUser.id,
      status: InvestigationStatus.IN_PROGRESS,
      findings: 'Detailed breakdown reveals ₹100,000 payment was scheduled net of TDS. However, AWS billing portal does not reflect TDS credit deduction certificate.',
      recommendation: 'Issue TDS withholding certificate (Form 16A) to AWS finance desk and mark ₹300 ledger variance as TDS Receivable.',
      evidence: json({
        anomalyId: anom1.id,
        invoiceAmount: 100300,
        settledAmount: 100000,
        taxSection: '194Q',
        supportingDoc: 'AWS-IN-2026-9812.pdf'
      }),
      timeline: json([
        { step: 1, title: 'Invoice Uploaded', timestamp: '2026-08-10T09:30:00Z', description: 'AWS invoice of ₹100,300 uploaded by Admin.', actor: 'DocumentProcessingService' },
        { step: 2, title: 'GL Mapping', timestamp: '2026-08-10T09:31:00Z', description: 'Mapped to 6201 Cloud/Software with 95% confidence.', actor: 'GLMappingService' },
        { step: 3, title: 'Bank Ingestion', timestamp: '2026-08-11T14:20:00Z', description: 'HDFC statement records net debit of ₹100,000.', actor: 'BankStatementService' },
        { step: 4, title: 'Mismatch Flagged', timestamp: '2026-08-11T14:25:00Z', description: 'Reconciliation engine flagged ₹300 variance.', actor: 'ReconciliationService' },
        { step: 5, title: 'Investigation Case Formed', timestamp: '2026-08-12T10:00:00Z', description: 'Assigned to Finance Manager Priya Nair.', actor: 'InvestigationService' }
      ])
    }
  });

  const invSlack = await prisma.investigation.create({
    data: {
      companyId: company.id,
      anomalyId: anom2.id,
      assignedToId: analystUser.id,
      status: InvestigationStatus.OPEN,
      findings: 'Two invoices with identical amounts and same vendor uploaded on consecutive days. Second invoice appears to be an accidental duplicate submission.',
      recommendation: 'Deactivate duplicate transaction SLK-INV-5541-DUP and confirm only one debit executes through HDFC gateway.',
      evidence: json({
        vendorName: 'Slack Technologies Inc',
        amount: 45000,
        invoices: ['SLK-INV-5541', 'SLK-INV-5541-DUP']
      }),
      timeline: json([
        { step: 1, title: 'First Invoice Ingested', timestamp: '2026-08-18T11:00:00Z', description: 'Slack invoice SLK-INV-5541 recorded.', actor: 'DocumentService' },
        { step: 2, title: 'Duplicate Uploaded', timestamp: '2026-08-19T10:15:00Z', description: 'Duplicate document SLK-INV-5541-DUP processed.', actor: 'DocumentService' },
        { step: 3, title: 'Anomaly Detected', timestamp: '2026-08-19T10:16:00Z', description: 'Duplicate heuristic flagged matching vendor and amount.', actor: 'AnomalyDetectionService' }
      ])
    }
  });
  console.log('✓ Created 2 Investigation records');

  // 10. Create Comprehensive Audit Logs
  const auditEntries = [
    { action: 'COMPANY_CREATED', entity: 'Company', entityId: company.id, user: adminUser.id, desc: 'Setup ABC Technologies Pvt Ltd workspace' },
    { action: 'USER_REGISTERED', entity: 'User', entityId: adminUser.id, user: adminUser.id, desc: 'Initial super-admin user registered' },
    { action: 'GL_CODES_INITIALIZED', entity: 'GLCode', entityId: 'CHART_OF_ACCOUNTS', user: adminUser.id, desc: 'Configured standard chart of accounts' },
    { action: 'DOCUMENT_UPLOADED', entity: 'Document', entityId: docs[0].id, user: adminUser.id, desc: 'Uploaded INV-2026-AWS-AUG.pdf' },
    { action: 'DOCUMENT_PROCESSED', entity: 'Document', entityId: docs[0].id, user: adminUser.id, desc: 'Extracted transaction record for AWS' },
    { action: 'BANK_STATEMENT_INGESTED', entity: 'Document', entityId: bankStmtDoc.id, user: adminUser.id, desc: 'Ingested HDFC August Statement (15 transactions)' },
    { action: 'RECONCILIATION_RUN_COMPLETED', entity: 'Reconciliation', entityId: 'BATCH_AUG_2026', user: managerUser.id, desc: 'Executed multi-factor reconciliation engine' },
    { action: 'RECONCILIATION_APPROVED', entity: 'Reconciliation', entityId: reconAWS.id, user: managerUser.id, desc: 'Approved Microsoft Cloud Corporation 98% match' },
    { action: 'ANOMALY_FLAGGED', entity: 'Anomaly', entityId: anom1.id, user: null, desc: 'Flagged amount mismatch on AWS invoice' },
    { action: 'INVESTIGATION_OPENED', entity: 'Investigation', entityId: invAWS.id, user: managerUser.id, desc: 'Initiated audit investigation for AWS ₹300 variance' }
  ];

  for (const a of auditEntries) {
    await prisma.auditLog.create({
      data: {
        companyId: company.id,
        userId: a.user,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        newValue: json({ description: a.desc }),
        ipAddress: '127.0.0.1'
      }
    });
  }
  console.log(`✓ Created ${auditEntries.length} Audit Log records`);

  console.log('\n=============================================================');
  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  console.log('Demo Credentials:');
  console.log(' - Admin: admin@abctech.com / Demo1234!');
  console.log(' - Finance Manager: manager@abctech.com / Demo1234!');
  console.log(' - Finance Analyst: analyst@abctech.com / Demo1234!');
  console.log('Company: ABC Technologies Pvt Ltd');
  console.log('=============================================================\n');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
