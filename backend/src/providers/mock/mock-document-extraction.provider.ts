import { IDocumentExtractionProvider, ExtractedDocumentData } from '../interfaces/document-extraction.interface';

export class MockDocumentExtractionProvider implements IDocumentExtractionProvider {
  async extractDocumentData(filePath: string, originalFileName: string, documentType: string): Promise<ExtractedDocumentData> {
    const lowerName = originalFileName.toLowerCase();

    // Default template
    let vendorName = 'ABC Technologies Vendor';
    let invoiceNumber = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    let referenceNumber = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    let totalAmount = 45000;
    let subtotal = 38135.59;
    let taxAmount = 6864.41;
    let currency = 'INR';
    let lineItems = [
      { description: 'Standard Services & Support', quantity: 1, unitPrice: 38135.59, total: 38135.59 }
    ];

    if (lowerName.includes('aws') || lowerName.includes('amazon')) {
      vendorName = 'Amazon Web Services (AWS)';
      invoiceNumber = 'AWS-IN-2026-9812';
      referenceNumber = 'AWS-PO-4412';
      totalAmount = 100300;
      subtotal = 85000;
      taxAmount = 15300;
      lineItems = [
        { description: 'EC2 Compute Infrastructure', quantity: 1, unitPrice: 60000, total: 60000 },
        { description: 'S3 Storage & Data Transfer', quantity: 1, unitPrice: 25000, total: 25000 }
      ];
    } else if (lowerName.includes('microsoft') || lowerName.includes('azure')) {
      vendorName = 'Microsoft Cloud Corporation';
      invoiceNumber = 'MS-881920-IND';
      referenceNumber = 'MSFT-REF-1092';
      totalAmount = 64500;
      subtotal = 54661;
      taxAmount = 9839;
      lineItems = [
        { description: 'Microsoft 365 Enterprise E5 Licenses', quantity: 25, unitPrice: 2186.44, total: 54661 }
      ];
    } else if (lowerName.includes('uber') || lowerName.includes('cab')) {
      vendorName = 'Uber Technologies Ltd';
      invoiceNumber = 'UBER-CORP-4512';
      referenceNumber = 'UBR-TRIP-9011';
      totalAmount = 3450;
      subtotal = 3285.71;
      taxAmount = 164.29;
      lineItems = [
        { description: 'Executive Airport Transit Services', quantity: 2, unitPrice: 1642.85, total: 3285.71 }
      ];
    } else if (lowerName.includes('office') || lowerName.includes('depot') || lowerName.includes('staple')) {
      vendorName = 'Office Depot Supplies';
      invoiceNumber = 'OD-89211';
      referenceNumber = 'PO-OD-2026-04';
      totalAmount = 12400;
      subtotal = 10508.47;
      taxAmount = 1891.53;
      lineItems = [
        { description: 'Ergonomic Mesh Chairs & Supplies', quantity: 4, unitPrice: 2627.12, total: 10508.47 }
      ];
    } else if (lowerName.includes('bank') || documentType === 'BANK_STATEMENT') {
      vendorName = 'HDFC Corporate Banking';
      invoiceNumber = 'STMT-HDFC-SEP-2026';
      referenceNumber = 'HDFC-ACC-981244';
      totalAmount = 350000;
      subtotal = 350000;
      taxAmount = 0;
      lineItems = [
        { description: 'Consolidated Monthly Account Summary', quantity: 1, unitPrice: 350000, total: 350000 }
      ];
    }

    return {
      documentType,
      vendorName,
      invoiceNumber,
      referenceNumber,
      date: new Date().toISOString(),
      subtotal,
      taxAmount,
      totalAmount,
      currency,
      confidence: 0.96,
      lineItems,
      metadata: {
        extractedEngine: 'MockDeterministicExtraction_v1',
        rawFileName: originalFileName,
        processedAt: new Date().toISOString()
      }
    };
  }
}
